# --- Build stage ---
FROM node:18-alpine AS builder
WORKDIR /app

# Install deps (clean, reproducible)
COPY package*.json ./
RUN npm ci

# Copy sources and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Runtime stage ---
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# PDF.js sometimes needs this for compatibility on alpine
RUN apk add --no-cache libc6-compat

# Install production deps only
COPY package*.json ./
RUN npm ci --omit=dev

# App artifacts
COPY --from=builder /app/dist ./dist
COPY bin/start.sh ./start.sh
RUN chmod +x ./start.sh

# Azure/App Service will set PORT; default to 4000
ENV PORT=4000
EXPOSE 4000

# Start: run migrations, then server
CMD ["./start.sh"]
