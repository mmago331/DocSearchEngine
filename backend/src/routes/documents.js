import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// pdf-parse will be imported dynamically when needed
import { createConnection, executeQuery } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

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
