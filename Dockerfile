# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build


# Runtime stage
FROM node:20-alpine

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