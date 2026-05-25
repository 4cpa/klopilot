FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Dependencies
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/i18n/package.json ./packages/i18n/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN pnpm install --frozen-lockfile --filter @klopilot/web...

# Build
FROM deps AS builder
COPY apps/web ./apps/web
COPY packages/i18n ./packages/i18n
COPY packages/shared-types ./packages/shared-types
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @klopilot/web build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3102
ENV PORT=3102
CMD ["node", "apps/web/server.js"]
