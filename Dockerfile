# syntax=docker/dockerfile:1

# ---------- Build stage ----------
# Installs all dependencies (including dev tools like vite/esbuild/drizzle-kit)
# and produces the production bundle in /app/dist.
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Build client (dist/public) and server bundle (dist/index.js).
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies only. The server bundle is built with
# --packages=external, so its runtime packages must be present — but Vite and
# the other build tools are not needed at runtime (the Vite code path is a
# lazily-imported, code-split chunk that production never loads).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Files needed by `drizzle-kit push` at startup.
COPY drizzle.config.ts ./drizzle.config.ts
COPY shared ./shared

# Persistent location for uploaded images (mount a volume here).
ENV UPLOADS_DIR=/app/uploads
RUN mkdir -p /app/uploads
VOLUME ["/app/uploads"]

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# The server reads PORT (defaults to 5000) and binds 0.0.0.0.
EXPOSE 5000

ENTRYPOINT ["./docker-entrypoint.sh"]
