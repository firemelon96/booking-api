FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=UTC

COPY package*.json ./
RUN npm install --omit=dev

# ✅ copy prisma config too
COPY prisma.config.ts ./prisma.config.ts

COPY prisma ./prisma

COPY dist ./dist

COPY public ./public

EXPOSE 4000
CMD ["sh", "-c", "echo DB=$([ -n \"$DATABASE_URL\" ] && echo YES || echo NO) && npx prisma migrate deploy && node dist/server.js"]
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build


# Runtime stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV TZ=UTC

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]