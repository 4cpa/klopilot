# Deployment Guide

## Übersicht

klopilot besteht aus drei deployten Einheiten:

| Einheit | Technologie      | Ziel                   |
| ------- | ---------------- | ---------------------- |
| API     | NestJS (Docker)  | Hetzner / Fly.io       |
| Web     | Next.js (Docker) | Hetzner / Vercel       |
| Mobile  | Expo EAS         | App Store / Play Store |

Infrastruktur (PostgreSQL, Redis, MinIO, Meilisearch) läuft als Docker Compose auf dem Server.

---

## Lokale Entwicklung

```bash
# Infrastruktur
docker compose -f infra/docker-compose.yml up -d

# Apps
pnpm dev
```

---

## Produktion

### Voraussetzungen

- Server mit Docker & Docker Compose (Hetzner CX21 oder grösser empfohlen)
- Domäne `klopilot.ch` mit DNS auf Server
- SSL via Traefik oder nginx (Let's Encrypt)
- Alle Umgebungsvariablen in `.env.prod` gesetzt (siehe `.env.example`)

### 1. Infrastruktur starten

```bash
docker compose -f infra/docker-compose.prod.yml up -d
```

### 2. Datenbank migrieren

```bash
DATABASE_URL=<prod-url> pnpm db:migrate
```

### 3. API deployen

```bash
docker build -f apps/api/Dockerfile -t klopilot-api .
docker push <registry>/klopilot-api:latest

# Auf dem Server:
docker compose -f infra/docker-compose.prod.yml pull api
docker compose -f infra/docker-compose.prod.yml up -d api
```

### 4. Web deployen

```bash
docker build -f apps/web/Dockerfile -t klopilot-web .
docker push <registry>/klopilot-web:latest

# Auf dem Server:
docker compose -f infra/docker-compose.prod.yml pull web
docker compose -f infra/docker-compose.prod.yml up -d web
```

### 5. Mobile OTA-Update (JS-only Änderungen)

```bash
cd apps/mobile
npx eas-cli update --branch production --message "feat: ..."
```

### 6. Mobile nativer Build (neue native Dependencies)

```bash
cd apps/mobile
npx eas-cli build --profile production --platform all
```

---

## Umgebungsvariablen

Vollständige Liste in `.env.example`. Wichtigste Produktions-Variablen:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/klopilot
REDIS_URL=redis://localhost:6379
JWT_SECRET=<starkes-zufälliges-secret>
S3_ENDPOINT=https://s3.example.com
S3_BUCKET=klopilot-media
MEILI_HOST=http://localhost:7700
MEILI_KEY=<master-key>
MAPTILER_KEY=<api-key>
MAIL_HOST=smtp.example.com
EXPO_ACCESS_TOKEN=<token>
```

---

## Rollback

```bash
# API/Web: vorheriges Image deployen
docker compose -f infra/docker-compose.prod.yml up -d --no-build api

# Mobile: vorheriges OTA-Update reaktivieren
cd apps/mobile && npx eas-cli update:republish --branch production --group <group-id>
```

---

## Monitoring

- **Fehler:** Sentry (`SENTRY_DSN` setzen)
- **Analytics:** Plausible (`PLAUSIBLE_DOMAIN` setzen)
- **Logs:** `docker compose logs -f api` / `docker compose logs -f web`
- **DB:** Prisma Studio via SSH-Tunnel: `pnpm db:studio`
