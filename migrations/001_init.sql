create extension if not exists pg_trgm;

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  title text not null,
  filename text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table pages (
  id bigserial primary key,
  document_id uuid not null references documents(id) on delete cascade,
  page_number int not null,
  content text not null,
  tsv tsvector generated always as (to_tsvector('simple', content)) stored
);

create index pages_tsv_idx on pages using gin(tsv);
create index pages_doc_idx on pages(document_id);
