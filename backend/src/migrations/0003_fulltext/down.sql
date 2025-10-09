-- 0003_fulltext.down.sql
DROP TRIGGER IF EXISTS trg_pages_search_tsv ON pages;
DROP FUNCTION IF EXISTS pages_search_tsv_update();
DROP INDEX IF EXISTS idx_pages_search_tsv;
ALTER TABLE pages DROP COLUMN IF EXISTS search_tsv;
