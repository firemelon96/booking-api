
# Runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV TZ=UTC

COPY package*.json ./
RUN npm install --omit=dev

COPY dist ./dist
COPY public ./public
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]