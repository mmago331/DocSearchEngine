-- Full-text search over page content
ALTER TABLE pages ADD COLUMN IF NOT EXISTS search_tsv tsvector;

UPDATE pages
SET search_tsv = to_tsvector('english', coalesce(content, ''));

CREATE INDEX IF NOT EXISTS pages_search_tsv_idx ON pages USING GIN (search_tsv);

CREATE OR REPLACE FUNCTION pages_search_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv := to_tsvector('english', coalesce(NEW.content, ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pages_search_tsv_update ON pages;
CREATE TRIGGER pages_search_tsv_update
BEFORE INSERT OR UPDATE ON pages
FOR EACH ROW EXECUTE FUNCTION pages_search_tsv_trigger();
