FROM node:22-alpine AS base
# openssl + libc6-compat: benötigt von Prisma (libssl-Detection in Alpine/musl)
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
# Install all deps (incl. devDeps — für NestJS-Build und prisma generate)
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=1
RUN pnpm install --frozen-lockfile --filter @klopilot/api...

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
# Quellcode kopieren
COPY apps/api ./apps/api
COPY packages/shared-types ./packages/shared-types
# Prisma Client generieren (schema ist jetzt vorhanden)
RUN pnpm --filter @klopilot/api exec prisma generate
# API bauen
RUN pnpm --filter @klopilot/api build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable && corepack prepare pnpm@9 --activate

# Non-root user für Sicherheit
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nestjs

WORKDIR /app
ENV NODE_ENV=production
# Prisma postinstall überspringen (schema noch nicht vorhanden während install)
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=1

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/

# --prod installiert nur production deps (prisma CLI in dependencies → migrate deploy)
RUN pnpm install --frozen-lockfile --filter @klopilot/api... --prod

# Kompilierter Code + Prisma-Schema
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Prisma Client generieren (schema ist jetzt vorhanden, openssl installiert)
RUN pnpm --filter @klopilot/api exec prisma generate

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3101

# Healthcheck: /api/v1/health muss 200 zurückgeben
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3101/api/v1/health || exit 1

CMD ["node", "apps/api/dist/main"]
