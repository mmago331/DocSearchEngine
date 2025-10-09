DROP TRIGGER IF EXISTS pages_search_tsv_update ON pages;
DROP FUNCTION IF EXISTS pages_search_tsv_trigger;
DROP INDEX IF EXISTS pages_search_tsv_idx;
ALTER TABLE pages DROP COLUMN IF EXISTS search_tsv;
