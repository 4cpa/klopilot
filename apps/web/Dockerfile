FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/i18n/package.json ./packages/i18n/
COPY packages/shared-types/package.json ./packages/shared-types/
# CI=true: husky prepare-script überspringen (wird in prepare-script geprüft)
ENV CI=true
RUN pnpm install --frozen-lockfile --filter @klopilot/web...

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY apps/web ./apps/web
COPY packages/i18n ./packages/i18n
COPY packages/shared-types ./packages/shared-types
RUN pnpm --filter @klopilot/web build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
# Next.js standalone output (requires output: 'standalone' in next.config.mjs)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3102
ENV PORT=3102
# HOSTNAME=0.0.0.0: Next.js standalone liest HOSTNAME und bindet sich sonst
# an den Container-Hostnamen statt an alle Interfaces.
ENV HOSTNAME=0.0.0.0
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3102 || exit 1
CMD ["node", "apps/web/server.js"]
