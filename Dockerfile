# 1) Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps (including dev deps for TS build)
COPY package*.json ./
RUN npm ci

# Copy source
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY prisma.config.ts ./

# Generate Prisma Client (needed before build)
RUN npx prisma generate

# Build TypeScript -> dist/
RUN npm run build

# 2) Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV TZ=UTC

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build output + prisma files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Prisma Client (generated in build) lives inside node_modules/.prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma



EXPOSE 4000

# Run migrations safely, then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
