import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
// pdf-parse will be imported dynamically when needed
import { createConnection, executeQuery } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const relayCommand = process.env.LLAMA_INDEX_RELAY_COMMAND || 'llama_index-relay';
let relayArgsTemplateCache = null;
let relayArgsTemplateInvalid = false;
let relayMissingLogged = false;

const PATH_EXTENSIONS = process.platform === 'win32'
  ? ['', '.cmd', '.exe', '.bat']
  : [''];

async function fileExists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function tryResolveFromDirectory(directory, command) {
  if (!directory) {
    return null;
  }

  const trimmed = command.trim();
  if (!trimmed) {
    return null;
  }

  const candidateNames = [trimmed];

  for (const ext of PATH_EXTENSIONS) {
    if (!ext) {
      continue;
    }

    if (trimmed.toLowerCase().endsWith(ext)) {
      continue;
    }

    candidateNames.push(trimmed + ext);
  }

  for (const candidateName of candidateNames) {
    const candidatePath = path.join(directory, candidateName);
    if (await fileExists(candidatePath)) {
      return candidatePath;
    }
  }

  return null;
}

async function resolveRelayCommand(command) {
  if (!command) {
    return null;
  }

  if (path.isAbsolute(command)) {
    return (await fileExists(command)) ? command : null;
  }

  const localBinDir = path.resolve(__dirname, '../../node_modules/.bin');
  const localCandidate = await tryResolveFromDirectory(localBinDir, command);
  if (localCandidate) {
    return localCandidate;
  }

  const pathValue = process.env.PATH || '';
  const pathEntries = pathValue.split(path.delimiter).filter(Boolean);
  for (const entry of pathEntries) {
    const resolved = await tryResolveFromDirectory(entry, command);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

function getRelayArgsTemplate() {
  if (relayArgsTemplateCache) {
    return relayArgsTemplateCache;
  }

  if (relayArgsTemplateInvalid) {
    return [];
  }

  const raw = process.env.LLAMA_INDEX_RELAY_ARGS;
  if (!raw) {
    relayArgsTemplateCache = [];
    return relayArgsTemplateCache;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.some(item => typeof item !== 'string')) {
      console.warn('LLAMA_INDEX_RELAY_ARGS must be a JSON array of strings. Ignoring value.');
      relayArgsTemplateInvalid = true;
      return [];
    }

    relayArgsTemplateCache = parsed;
    return relayArgsTemplateCache;
  } catch (error) {
    console.warn('Failed to parse LLAMA_INDEX_RELAY_ARGS. Expecting JSON array of strings. Ignoring value.', error);
    relayArgsTemplateInvalid = true;
    return [];
  }
}

function buildRelayArgs(context) {
  const template = getRelayArgsTemplate();
  if (!template.length) {
    return [];
  }

  const replacements = {
    '{filePath}': context.filePath,
    '{documentId}': String(context.documentId),
    '{originalName}': context.originalName || '',
    '{fileType}': context.fileType || '',
  };

  return template.map(part => {
    let result = part;
    for (const [token, value] of Object.entries(replacements)) {
      result = result.split(token).join(value);
    }
    return result;
  });
}

async function triggerDocumentAnalysis(context) {
  try {
    const resolvedCommand = await resolveRelayCommand(relayCommand);
    if (!resolvedCommand) {
      if (!relayMissingLogged) {
        console.warn(
          `Document analysis command "${relayCommand}" was not found. Skipping analysis for document uploads.`
        );
        relayMissingLogged = true;
      }
      return;
    }

    const args = buildRelayArgs(context);

    const child = spawn(resolvedCommand, args, {
      stdio: 'ignore',
      env: {
        ...process.env,
        LLAMA_INDEX_DOCUMENT_ID: String(context.documentId),
        LLAMA_INDEX_SOURCE_PATH: context.filePath,
        LLAMA_INDEX_FILE_TYPE: context.fileType || '',
        LLAMA_INDEX_ORIGINAL_NAME: context.originalName || '',
      },
      detached: false,
    });

    child.on('error', (error) => {
      console.error('Document analysis command failed to start:', error);
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        console.error(
          `Document analysis command exited with code ${code} for document ${context.documentId}.`
        );
      }
    });

    if (typeof child.unref === 'function') {
      child.unref();
    }
  } catch (error) {
    console.error('Unexpected error while starting document analysis command:', error);
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'), false);
    }
  }
});

// Upload document
router.post('/upload', requireAuth, upload.single('document'), async (req, res) => {
  try {
    const pool = createConnection();
    if (!pool) {
      return res.status(503).json({
        error: 'Document uploads are unavailable because the database is not connected. Please configure the PG_URL environment variable.'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { isPublic = false } = req.body;
    const userId = req.session.userId;
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const filename = req.file.filename;
    const fileSize = req.file.size;
    const fileType = req.file.mimetype;

    try {
      // Save document record
      const result = await executeQuery(
        'INSERT INTO documents (user_id, filename, original_name, file_path, file_size, file_type, is_public) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [userId, filename, originalName, filePath, fileSize, fileType, isPublic === 'true']
      );

      if (!result || result.length === 0 || !result[0]?.id) {
        throw new Error('Failed to save document metadata');
      }

      const documentId = result[0].id;

      // Process document content
      let content = '';
      if (fileType === 'application/pdf') {
        try {
          const pdfBuffer = await import('node:fs').then(fs => fs.readFileSync(filePath));
          const pdf = (await import('pdf-parse')).default;
          const pdfData = await pdf(pdfBuffer);
          content = pdfData.text;
        } catch (error) {
          console.error('PDF parsing error:', error);
          content = 'Error parsing PDF content';
        }
      } else if (fileType === 'text/plain') {
        const fs = await import('node:fs');
        content = fs.readFileSync(filePath, 'utf8');
      }

      // Save document content
      if (content) {
        await executeQuery(
          'INSERT INTO document_content (document_id, content) VALUES ($1, $2)',
          [documentId, content]
        );

        // Create search index
        await executeQuery(
          'INSERT INTO search_index (document_id, content) VALUES ($1, $2)',
          [documentId, content]
        );
      }

      triggerDocumentAnalysis({
        documentId,
        filePath,
        originalName,
        fileType,
      });

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        document: {
          id: documentId,
          originalName,
          filename,
          fileSize,
          fileType,
          isPublic: isPublic === 'true'
        }
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get user's documents
router.get('/my-documents', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    try {
      const documents = await executeQuery(
        'SELECT id, original_name, file_size, file_type, is_public, created_at FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      res.json({ success: true, documents });

    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }

  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get public documents
router.get('/public', async (req, res) => {
  try {
    try {
      const documents = await executeQuery(
        `SELECT d.id, d.original_name, d.file_size, d.file_type, d.created_at, u.name as uploader_name 
         FROM documents d 
         JOIN users u ON d.user_id = u.id 
         WHERE d.is_public = true 
         ORDER BY d.created_at DESC`
      );

      res.json({ success: true, documents });

    } catch (error) {
      console.error('Error fetching public documents:', error);
      res.status(500).json({ error: 'Failed to fetch public documents' });
    }

  } catch (error) {
    console.error('Error fetching public documents:', error);
    res.status(500).json({ error: 'Failed to fetch public documents' });
  }
});

// Delete document
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.session.userId;
    
    try {
      // Check if document belongs to user
      const documents = await executeQuery(
        'SELECT id, file_path FROM documents WHERE id = $1 AND user_id = $2',
        [parseInt(documentId), userId]
      );

      if (documents.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Delete document (cascade will handle related records)
      await executeQuery(
        'DELETE FROM documents WHERE id = $1',
        [parseInt(documentId)]
      );

      // Delete file from filesystem
      try {
        const fs = await import('node:fs');
        fs.unlinkSync(documents[0].file_path);
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
      }

      res.json({ success: true, message: 'Document deleted successfully' });

    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
