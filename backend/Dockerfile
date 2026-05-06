# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat
RUN corepack enable

COPY backend/package.json ./
COPY backend/tsconfig.json ./
COPY backend/tsconfig.build.json ./
COPY backend/nest-cli.json ./
COPY backend/src ./src
COPY backend/scripts ./scripts

RUN pnpm install --no-frozen-lockfile
RUN pnpm build
RUN test -f dist/main.js

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache dumb-init libc6-compat
RUN corepack enable

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

COPY backend/package.json ./
RUN pnpm install --prod --no-frozen-lockfile

COPY --from=builder /app/dist ./dist

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]