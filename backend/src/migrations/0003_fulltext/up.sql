-- 0003_fulltext.up.sql
-- 1) add tsvector column
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS search_tsv tsvector;

-- 2) backfill (english dictionary by default)
UPDATE pages
SET search_tsv =
  setweight(to_tsvector(COALESCE(content, '')), 'B');

-- 3) index for fast search
CREATE INDEX IF NOT EXISTS idx_pages_search_tsv
  ON pages USING GIN (search_tsv);

-- 4) trigger to keep tsvector in sync
CREATE OR REPLACE FUNCTION pages_search_tsv_update() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector(COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pages_search_tsv ON pages;
CREATE TRIGGER trg_pages_search_tsv
BEFORE INSERT OR UPDATE OF content ON pages
FOR EACH ROW EXECUTE FUNCTION pages_search_tsv_update();
