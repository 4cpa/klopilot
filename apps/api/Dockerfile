FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
# Install all deps (incl. devDeps — needed for NestJS build)
RUN pnpm install --frozen-lockfile --filter @klopilot/api...

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY apps/api ./apps/api
COPY packages/shared-types ./packages/shared-types
RUN pnpm --filter @klopilot/api build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9 --activate

# Non-root user für Sicherheit
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nestjs

WORKDIR /app
ENV NODE_ENV=production

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/

# --prod installiert nur production deps
# prisma (CLI) ist in "dependencies" → wird mitinstalliert → migrate deploy läuft
RUN pnpm install --frozen-lockfile --filter @klopilot/api... --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3101

# Healthcheck: /api/v1/health muss 200 zurückgeben
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3101/api/v1/health || exit 1

CMD ["node", "apps/api/dist/main"]
