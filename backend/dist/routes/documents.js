import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { access, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
// pdf-parse will be imported dynamically when needed
import { pool, isMockMode } from '../db/pg.js';
import { requireAuth } from '../middleware/auth.js';
import { createMockDocument, deleteMockDocument, listMockDocumentsForUser, listMockPublicDocuments, } from '../mock/store.js';
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
    }
    catch {
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
    }
    catch (error) {
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
                console.warn(`Document analysis command "${relayCommand}" was not found. Skipping analysis for document uploads.`);
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
                console.error(`Document analysis command exited with code ${code} for document ${context.documentId}.`);
            }
        });
        if (typeof child.unref === 'function') {
            child.unref();
        }
    }
    catch (error) {
        console.error('Unexpected error while starting document analysis command:', error);
    }
}
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['application/pdf', 'text/plain'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            const error = new Error('Only PDF and text files are allowed');
            error.status = 400;
            cb(error);
        }
    }
});
router.post('/upload', (req, _res, next) => {
    req.url = '/';
    next();
});
const uploadMiddleware = upload.single('file');
router.post('/', requireAuth, uploadMiddleware, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'missing_file' });
        }
        const { buffer, originalname, mimetype, size } = req.file;
        const isPublic = req.body.isPublic === 'true';
        const rawUserId = req.session.userId;
        const numericUserId = typeof rawUserId === 'number' ? rawUserId : Number(rawUserId);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(originalname);
        const filename = `upload-${uniqueSuffix}${extension}`;
        const uploadsDir = path.join(__dirname, '../../uploads');
        const filePath = path.join(uploadsDir, filename);
        if (isMockMode) {
            if (!Number.isFinite(numericUserId)) {
                return res.status(400).json({ error: 'invalid_user_session' });
            }
            const content = mimetype === 'text/plain' ? buffer.toString('utf8') : '';
            const document = createMockDocument({
                userId: numericUserId,
                originalName: originalname,
                isPublic,
                fileType: mimetype,
                fileSize: size,
                content,
            });
            return res.json({
                success: true,
                message: 'Document uploaded successfully (mock)',
                document: {
                    id: document.id,
                    originalName: originalname,
                    filename: document.filename,
                    fileSize: size,
                    fileType: mimetype,
                    isPublic,
                }
            });
        }
        await writeFile(filePath, buffer);
        const userId = rawUserId;
        const { rows } = await pool.query('INSERT INTO documents (user_id, filename, original_name, file_path, file_size, file_type, is_public) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [userId, filename, originalname, filePath, size, mimetype, isPublic]);
        if (!rows.length) {
            throw new Error('Failed to save document metadata');
        }
        const documentId = rows[0].id;
        let content = '';
        if (mimetype === 'application/pdf') {
            try {
                const pdf = (await import('pdf-parse')).default;
                const pdfData = await pdf(buffer);
                content = pdfData.text;
            }
            catch (error) {
                console.error('PDF parsing error:', error);
                content = 'Error parsing PDF content';
            }
        }
        else if (mimetype === 'text/plain') {
            content = buffer.toString('utf8');
        }
        if (content) {
            await pool.query('INSERT INTO document_content (document_id, content) VALUES ($1, $2)', [documentId, content]);
            await pool.query('INSERT INTO search_index (document_id, content) VALUES ($1, $2)', [documentId, content]);
        }
        triggerDocumentAnalysis({
            documentId,
            filePath,
            originalName: originalname,
            fileType: mimetype,
        });
        res.json({
            success: true,
            message: 'Document uploaded successfully',
            document: {
                id: documentId,
                originalName: originalname,
                filename,
                fileSize: size,
                fileType: mimetype,
                isPublic,
            }
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});
router.get('/my-documents', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        if (isMockMode) {
            const numericUserId = typeof userId === 'number' ? userId : Number(userId);
            const documents = listMockDocumentsForUser(numericUserId);
            return res.json({ success: true, documents });
        }
        const { rows: documents } = await pool.query('SELECT id, original_name, file_size, file_type, is_public, created_at FROM documents WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json({ success: true, documents });
    }
    catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});
router.get('/public', async (_req, res) => {
    try {
        if (isMockMode) {
            const documents = listMockPublicDocuments();
            return res.json({ success: true, documents });
        }
        const { rows: documents } = await pool.query(`SELECT d.id, d.original_name, d.file_size, d.file_type, d.created_at, u.name as uploader_name
         FROM documents d
         JOIN users u ON d.user_id = u.id
         WHERE d.is_public = true
         ORDER BY d.created_at DESC`);
        res.json({ success: true, documents });
    }
    catch (error) {
        console.error('Error fetching public documents:', error);
        res.status(500).json({ error: 'Failed to fetch public documents' });
    }
});
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const documentId = Number.parseInt(req.params.id, 10);
        const userId = req.session.userId;
        if (Number.isNaN(documentId)) {
            return res.status(400).json({ error: 'Invalid document id' });
        }
        if (isMockMode) {
            const numericUserId = typeof userId === 'number' ? userId : Number(userId);
            const removed = deleteMockDocument(documentId, numericUserId);
            if (!removed) {
                return res.status(404).json({ error: 'Document not found' });
            }
            return res.json({ success: true, message: 'Document deleted successfully (mock)' });
        }
        const { rows: documents } = await pool.query('SELECT id, file_path FROM documents WHERE id = $1 AND user_id = $2', [documentId, userId]);
        if (documents.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }
        await pool.query('DELETE FROM documents WHERE id = $1', [documentId]);
        try {
            const fs = await import('node:fs');
            fs.unlinkSync(documents[0].file_path);
        }
        catch (fileError) {
            console.error('Error deleting file:', fileError);
        }
        res.json({ success: true, message: 'Document deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});
export default router;
