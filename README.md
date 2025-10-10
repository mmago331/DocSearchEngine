# DocSearchEngine

DocSearchEngine is a full-stack PDF ingestion and semantic search platform. Users can register, upload PDF documents, and run fast full-text queries that return highlighted snippets for each page. The project combines a modern React interface with a TypeScript/Express API backed by PostgreSQL full-text search.

## Features
- **Secure authentication** – email/password registration, login, and authenticated APIs protected with JWTs.
- **Document ingestion** – upload PDF files up to 25&nbsp;MB, automatically extract per-page text, and manage document visibility (private or public).
- **Full-text search** – powered by PostgreSQL `tsvector`/`tsquery` with ranked results and highlighted snippets. Supports filtering by document and paginated responses.
- **Document management UI** – browse uploaded documents, inspect individual pages, and search across personal or shared content from the React frontend.

## Tech stack
- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Heroicons.
- **Backend:** Express 4 with TypeScript, Zod validation, Multer for uploads, JWT-based auth, PostgreSQL client (`pg`).
- **Infrastructure:** PostgreSQL 16 (via Docker Compose), PDF parsing with `pdfjs-dist`, shared types published through a `shared/` workspace.

## Prerequisites
- Node.js **18.17+** and npm **9+** (workspace-aware commands are used throughout the repo).
- Docker (optional but recommended) to launch the local PostgreSQL instance with `docker compose`.

## Getting started
1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp backend/.env.example backend/.env
   ```
   Adjust `DATABASE_URL`, `PORT`, and `JWT_SECRET` as needed.

3. **Start PostgreSQL**
   ```bash
   docker compose up -d
   ```

4. **Run database migrations**
   ```bash
   npm run migrate:up --workspace backend
   ```

5. **Start the API server**
   ```bash
   npm run dev --workspace backend
   ```
   The server defaults to `http://localhost:4000` and exposes `/auth`, `/documents`, and `/api/search` endpoints.

6. **Start the frontend** (in a second terminal)
   ```bash
   npm run dev --workspace frontend
   ```
   Vite serves the app at `http://localhost:5173`.

Once both services are running, register a new account in the UI, upload PDF documents, and try searching for phrases to see highlighted results from the indexed pages.

## Project structure
```
.
├── backend/            # Express API source, migrations, and scripts
├── frontend/           # React single-page application
├── shared/             # Placeholder for cross-package TypeScript types
├── docker-compose.yml  # Local PostgreSQL service definition
└── README.md           # You are here
```

### Backend scripts
Run any workspace script with `npm run <name> --workspace backend`:
- `dev` – start the API in watch mode (tsx).
- `build` – compile to `dist/` and copy migrations.
- `start` – run the compiled server.
- `typecheck` – TypeScript type checking without emitting output.
- `migrate:up` / `migrate:down` – apply or roll back database migrations.

### Frontend scripts
Run with `npm run <name> --workspace frontend`:
- `dev` – start the Vite dev server.
- `build` – type-check and bundle for production.
- `preview` – preview the production build locally.

## Environment variables
The backend reads configuration from `backend/.env`:

| Variable | Description |
| --- | --- |
| `NODE_ENV` | Runtime mode (`development`, `production`, etc.). |
| `PORT` | HTTP port for the API server (defaults to `4000`). |
| `DATABASE_URL` | Connection string for PostgreSQL. |
| `JWT_SECRET` | Secret used to sign JWT access tokens. |
| `SEARCH_TEXT_CONFIG` | PostgreSQL text search configuration (defaults to `english`). |

Update this table whenever environment requirements change.

## Testing
No automated tests are defined yet. When you add tests, document the commands to run them in this section.

## Additional resources
- [`backend/README.md`](backend/README.md) – backend-specific notes.
- [`shared/README.md`](shared/README.md) – guidance for shared types.

