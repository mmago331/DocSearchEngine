import { Router } from 'express';
import { pool } from '../db/pg.js';
const router = Router();
// GET /api/search?q=...&filter=...
router.get('/search', async (req, res) => {
    try {
        const q = String(req.query.q || '').trim();
        const filter = String(req.query.filter || 'all').toLowerCase();
        if (!q) {
            return res.json({ ok: true, q, filter, count: 0, results: [] });
        }
        try {
            let query = '';
            let parameters = [];
            if (filter === 'my' && req.session && req.session.userId) {
                // Search only user's documents
                query = `
          SELECT DISTINCT d.id, d.original_name as title, 
                 SUBSTRING(si.content, 
                   CASE 
                     WHEN POSITION($1 IN LOWER(si.content)) > 0 
                     THEN GREATEST(1, POSITION($1 IN LOWER(si.content)) - 100)
                     ELSE 1 
                   END, 200) as snippet,
                 d.created_at,
                 u.name as uploader_name,
                 'my' as filter_type
          FROM search_index si
          JOIN documents d ON si.document_id = d.id
          JOIN users u ON d.user_id = u.id
          WHERE d.user_id = $3 
          AND LOWER(si.content) LIKE $2
          ORDER BY d.created_at DESC
        `;
                parameters = [q.toLowerCase(), `%${q.toLowerCase()}%`, req.session.userId];
            }
            else if (filter === 'public') {
                // Search only public documents
                query = `
          SELECT DISTINCT d.id, d.original_name as title,
                 SUBSTRING(si.content, 
                   CASE 
                     WHEN POSITION($1 IN LOWER(si.content)) > 0 
                     THEN GREATEST(1, POSITION($1 IN LOWER(si.content)) - 100)
                     ELSE 1 
                   END, 200) as snippet,
                 d.created_at,
                 u.name as uploader_name,
                 'public' as filter_type
          FROM search_index si
          JOIN documents d ON si.document_id = d.id
          JOIN users u ON d.user_id = u.id
          WHERE d.is_public = true 
          AND LOWER(si.content) LIKE $2
          ORDER BY d.created_at DESC
        `;
                parameters = [q.toLowerCase(), `%${q.toLowerCase()}%`];
            }
            else {
                // Search all accessible documents (user's + public)
                if (req.session && req.session.userId) {
                    query = `
            SELECT DISTINCT d.id, d.original_name as title,
                   SUBSTRING(si.content, 
                     CASE 
                       WHEN POSITION($1 IN LOWER(si.content)) > 0 
                       THEN GREATEST(1, POSITION($1 IN LOWER(si.content)) - 100)
                       ELSE 1 
                     END, 200) as snippet,
                   d.created_at,
                   u.name as uploader_name,
                   CASE 
                     WHEN d.user_id = $3 THEN 'my'
                     ELSE 'public'
                   END as filter_type
            FROM search_index si
            JOIN documents d ON si.document_id = d.id
            JOIN users u ON d.user_id = u.id
            WHERE (d.user_id = $3 OR d.is_public = true)
            AND LOWER(si.content) LIKE $2
            ORDER BY d.created_at DESC
          `;
                    parameters = [q.toLowerCase(), `%${q.toLowerCase()}%`, req.session.userId];
                }
                else {
                    // Search only public documents for non-authenticated users
                    query = `
            SELECT DISTINCT d.id, d.original_name as title,
                   SUBSTRING(si.content, 
                     CASE 
                       WHEN POSITION($1 IN LOWER(si.content)) > 0 
                       THEN GREATEST(1, POSITION($1 IN LOWER(si.content)) - 100)
                       ELSE 1 
                     END, 200) as snippet,
                   d.created_at,
                   u.name as uploader_name,
                   'public' as filter_type
            FROM search_index si
            JOIN documents d ON si.document_id = d.id
            JOIN users u ON d.user_id = u.id
            WHERE d.is_public = true 
            AND LOWER(si.content) LIKE $2
            ORDER BY d.created_at DESC
          `;
                    parameters = [q.toLowerCase(), `%${q.toLowerCase()}%`];
                }
            }
            const { rows: results } = await pool.query(query, parameters);
            // Format results for frontend
            const formattedResults = results.map((row, index) => ({
                id: row.id,
                title: row.title,
                snippet: row.snippet || 'No preview available',
                score: 0.9 - (index * 0.1), // Simple scoring based on order
                filter: row.filter_type,
                uploader: row.uploader_name,
                created_at: row.created_at
            }));
            res.json({ ok: true, q, filter, count: formattedResults.length, results: formattedResults });
        }
        catch (error) {
            console.error('Search error:', error);
            res.status(500).json({ error: 'Search failed' });
        }
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});
export default router;
