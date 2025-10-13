# DocSearchEngine

DocSearchEngine is a minimal Express + TypeScript starter that serves a password-protected admin interface for upcoming document-search features. The current build renders simple HTML pages, protects them with a session-based login form, and exposes stubbed JSON endpoints for same-origin API calls.

## Features
- **Session login** – username/password are configured through environment variables and stored in the current session.
- **Server-rendered pages** – HTML layouts (home, search, explore, library, admin) are produced directly by Express.
- **Same-origin API stubs** – `/api/search` returns placeholder data that can be replaced with a real search implementation.

## Tech stack
- **Runtime:** Node.js 20+, Express 4
- **Language:** TypeScript (compiled to ES2022 modules)
- **Tooling:** `ts-node-dev` for development, `typescript` for builds, `helmet` + `express-session` for security primitives

## Getting started
1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Update the values to match your desired admin credentials and secrets.

3. **Run the development server**
   ```bash
   npm run dev
   ```
   The app listens on `http://localhost:4000` by default.

4. **Build for production**
   ```bash
   npm run build
   ```
   Compiled assets are emitted to `dist/`.

## Project structure
```
.
├── public/         # Static assets served as-is
├── src/            # Express server and routes
├── .env.example    # Sample environment configuration
├── package.json    # Node package manifest
└── README.md       # Project documentation
```

## Environment variables
| Variable | Description |
| --- | --- |
| `NODE_ENV` | Runtime mode (e.g., `development`, `production`). |
| `PORT` | HTTP port for the server (defaults to `4000`). |
| `SESSION_SECRET` | Secret used to sign Express session cookies. |
| `ADMIN_USER` | Admin username accepted by the login form. |
| `ADMIN_PASS` | Admin password accepted by the login form. |

Keep this table up to date when configuration needs change.

## Testing
No automated tests are defined yet. Add test commands here when they become available.

## Deployment
Run `npm run build` and then `npm start` to launch the compiled server from the `dist/` directory. Static assets from `public/` are copied into `dist/public` during the build step.
