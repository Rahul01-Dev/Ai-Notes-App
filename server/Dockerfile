# ─── Stage 1: Dependencies ──────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package manifests only (layer-cache friendly)
COPY package.json package-lock.json ./

# Install ALL deps (including dev) — needed for prisma generate
RUN npm install

# ─── Stage 2: Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client for the correct platform
RUN npx prisma generate

# ─── Stage 3: Production Runner ─────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Prisma's query engine needs OpenSSL on Alpine
RUN apk add --no-cache openssl

# Only copy what the runtime needs
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/index.js ./index.js
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/package.json ./package.json

# Expose API port
EXPOSE 5000

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]
