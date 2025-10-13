# DocSearchEngine

DocSearchEngine is a server-rendered document search portal built with Express and TypeScript. Upload PDFs, extract their text into PostgreSQL, and search across the content with full-text queries.

## Features
- **User accounts with sessions** – Register directly in the UI or fall back to `.env`-provided admin credentials.
- **PDF ingestion** – Upload PDFs, split them into per-page records, and store content in PostgreSQL for fast lookup.
- **Full-text search** – Query your private library and public documents with PostgreSQL trigram indexes.
- **Server-rendered UI** – Catalyst-inspired layouts rendered with EJS and styled via Tailwind CSS.

## Tech stack
- **Runtime:** Node.js 18+, Express 4, EJS templates
- **Language:** TypeScript (compiled to ES2022 modules)
- **Database:** PostgreSQL with `pg_trgm` and GIN indexes
- **Styling:** Tailwind CSS

## Getting started
1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Update the values to match your local secrets and database connection string.

3. **Run database migrations**
   ```bash
   npm run migrate:up
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   The app listens on `http://localhost:4000` by default.

5. **Build for production**
   ```bash
   npm run build
   ```
   Compiled assets are emitted to `dist/` and Tailwind builds `public/styles.css`.

## Project structure
```
.
├── migrations/      # SQL migrations
├── public/          # Static assets (generated CSS)
├── scripts/         # Build scripts
├── src/             # Express server, routes, views
├── styles/          # Tailwind input styles
├── .env.example     # Sample environment configuration
├── package.json     # Node package manifest
└── README.md        # Project documentation
```

## Environment variables
| Variable | Description |
| --- | --- |
| `NODE_ENV` | Runtime mode (`development`, `production`, etc.). |
| `PORT` | HTTP port for the server (defaults to `4000`). |
| `SESSION_SECRET` | Secret used to sign Express session cookies. |
| `DATABASE_URL` | PostgreSQL connection string used by the app and migrations. |
| `ADMIN_USER` | Optional bootstrap admin email accepted by the login form. |
| `ADMIN_PASS` | Optional bootstrap admin password accepted by the login form. |

## Database
Run `npm run migrate:up` to apply the initial schema. The migration enables the `pg_trgm` extension, creates tables for users, documents, and per-page text, and adds indexes that power full-text search.

## Testing
No automated tests are defined yet. Add test commands here when they become available.

## Deployment
Run `npm run build` and then `npm start` to launch the compiled server from the `dist/` directory.
