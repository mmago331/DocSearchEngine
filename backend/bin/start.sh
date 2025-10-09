#!/usr/bin/env sh
set -eu

# Run DB migrations (idempotent)
node dist/db/migrate.js up || true

# Start the server
node dist/server.js
