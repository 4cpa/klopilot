#!/usr/bin/env bash
# klopilot.ch — Serverseitiges Deploy-Script
# Wird von GitHub Actions via SSH aufgerufen oder manuell ausgeführt.
# Voraussetzung: /opt/klopilot/.env.prod und docker-compose.prod.yml vorhanden.
set -euo pipefail

DEPLOY_DIR="/opt/klopilot"
COMPOSE="docker compose -f $DEPLOY_DIR/docker-compose.prod.yml"
ENV_FILE="$DEPLOY_DIR/.env.prod"
REGISTRY="${REGISTRY:-ghcr.io/4cpa}"
TAG="${TAG:-latest}"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

log "🚀 Deploying klopilot.ch (Tag: $TAG)"

cd "$DEPLOY_DIR"

# ── 1. GHCR-Login (GITHUB_TOKEN aus Umgebung oder .env.prod) ─────────────
if [ -n "${GHCR_TOKEN:-}" ]; then
  log "▸ GHCR login…"
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:-github}" --password-stdin
fi

# ── 2. Images pullen ─────────────────────────────────────────────────────
log "▸ Pulling images (Registry: $REGISTRY, Tag: $TAG)…"
REGISTRY="$REGISTRY" TAG="$TAG" \
  $COMPOSE --env-file "$ENV_FILE" pull api web

# ── 3. Infrastruktur sicherstellen ───────────────────────────────────────
log "▸ Starting infrastructure services…"
REGISTRY="$REGISTRY" TAG="$TAG" \
  $COMPOSE --env-file "$ENV_FILE" up -d \
  postgres redis minio meilisearch

log "▸ Waiting for Postgres…"
for i in $(seq 1 30); do
  REGISTRY="$REGISTRY" TAG="$TAG" \
    $COMPOSE --env-file "$ENV_FILE" \
    exec -T postgres pg_isready -U klopilot -d klopilot 2>/dev/null && break
  sleep 2
  [ "$i" -eq 30 ] && { log "❌ Postgres not ready after 60s"; exit 1; }
done

# ── 4. MinIO-Bucket initialisieren (idempotent) ───────────────────────────
log "▸ MinIO bucket init…"
REGISTRY="$REGISTRY" TAG="$TAG" \
  $COMPOSE --env-file "$ENV_FILE" run --rm minio-init 2>/dev/null || true

# ── 5. Prisma-Migrationen ─────────────────────────────────────────────────
log "▸ Running Prisma migrations…"
REGISTRY="$REGISTRY" TAG="$TAG" \
  $COMPOSE --env-file "$ENV_FILE" run --rm --no-deps api \
  sh -c 'PRISMA_BIN=$(find /app -path "*/node_modules/.bin/prisma" | head -1) && \
         "$PRISMA_BIN" migrate deploy --schema /app/apps/api/prisma/schema.prisma'

# ── 6. API & Web neustarten ───────────────────────────────────────────────
log "▸ Restarting API & Web…"
REGISTRY="$REGISTRY" TAG="$TAG" \
  $COMPOSE --env-file "$ENV_FILE" up -d --remove-orphans api web

# ── 7. Healthcheck ───────────────────────────────────────────────────────
log "▸ Waiting for API health…"
for i in $(seq 1 30); do
  if REGISTRY="$REGISTRY" TAG="$TAG" \
      $COMPOSE --env-file "$ENV_FILE" \
      exec -T api wget -qO- http://localhost:3101/api/v1/health 2>/dev/null | grep -q "ok"; then
    log "✅ API healthy"
    break
  fi
  sleep 3
  [ "$i" -eq 30 ] && { log "⚠️  API health check timed out (not rolling back)"; }
done

# ── 8. Aufräumen ─────────────────────────────────────────────────────────
log "▸ Removing dangling images…"
docker image prune -f --filter "until=24h" 2>/dev/null || true

log ""
log "──────────────────────────────────────────────"
log "✅ Deploy abgeschlossen! Tag: $TAG"
log "   API:  https://api.klopilot.ch/api/v1/health"
log "   Web:  https://klopilot.ch"
log "──────────────────────────────────────────────"
