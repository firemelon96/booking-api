FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=UTC

COPY package*.json ./
RUN npm install --omit=dev

# ✅ copy prisma config too
COPY prisma.config.ts ./prisma.config.ts

COPY prisma ./prisma
RUN npx prisma generate

COPY dist ./dist

EXPOSE 4000
CMD ["sh", "-c", "echo DB=$([ -n \"$DATABASE_URL\" ] && echo YES || echo NO) && npx prisma migrate deploy && node dist/server.js"]
