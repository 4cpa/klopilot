# Base-Image aus dem GHCR-Mirror (s. .github/workflows/mirror-base-images.yml),
# um Docker Hub (auth.docker.io 504) aus dem Build-Pfad zu nehmen. Override für
# lokale Builds: --build-arg NODE_IMAGE=node:22-alpine
ARG NODE_IMAGE=ghcr.io/4cpa/node:22-alpine

FROM ${NODE_IMAGE} AS base
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
# NEXT_PUBLIC_* werden zur Build-Zeit eingebettet (kein Runtime-Env möglich)
ARG NEXT_PUBLIC_API_URL=https://api.klopilot.ch
ARG NEXT_PUBLIC_S3_PUBLIC_URL=https://minio-api.klopilot.ch/klopilot-media
ARG NEXT_PUBLIC_DEFAULT_LNG=7.4474
ARG NEXT_PUBLIC_DEFAULT_LAT=46.9481
ARG NEXT_PUBLIC_DEFAULT_ZOOM=13
ARG NEXT_PUBLIC_MAPTILER_KEY=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_S3_PUBLIC_URL=$NEXT_PUBLIC_S3_PUBLIC_URL
ENV NEXT_PUBLIC_DEFAULT_LNG=$NEXT_PUBLIC_DEFAULT_LNG
ENV NEXT_PUBLIC_DEFAULT_LAT=$NEXT_PUBLIC_DEFAULT_LAT
ENV NEXT_PUBLIC_DEFAULT_ZOOM=$NEXT_PUBLIC_DEFAULT_ZOOM
ENV NEXT_PUBLIC_MAPTILER_KEY=$NEXT_PUBLIC_MAPTILER_KEY
COPY apps/web ./apps/web
COPY packages/i18n ./packages/i18n
COPY packages/shared-types ./packages/shared-types
RUN pnpm --filter @klopilot/web build

# ── Production image ──────────────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Next.js standalone output (requires output: 'standalone' in next.config.mjs)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
# public/ muss relativ zum server.js liegen (apps/web/server.js → apps/web/public/)
# NICHT ./public — sonst findet der Standalone-Server favicon.ico etc. nicht.
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3102
ENV PORT=3102
# HOSTNAME=0.0.0.0: Next.js standalone liest HOSTNAME und bindet sich sonst
# an den Container-Hostnamen statt an alle Interfaces.
ENV HOSTNAME=0.0.0.0
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3102 || exit 1
CMD ["node", "apps/web/server.js"]
