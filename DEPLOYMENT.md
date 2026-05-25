# Deployment Guide — klopilot.ch

## Übersicht

```
GitHub Actions (CI → Deploy)
        │
        │ SSH → deploy.sh
        ▼
Hetzner VPS (Ubuntu 24.04)
  ├── Traefik v3  (Reverse Proxy, Let's Encrypt)
  ├── PostgreSQL 16 + PostGIS 3.4
  ├── Redis 7
  ├── MinIO (S3-Storage)
  ├── Meilisearch v1.10
  ├── API  ← ghcr.io/4cpa/klopilot-api:latest
  └── Web  ← ghcr.io/4cpa/klopilot-web:latest
```

### Ablauf nach `git push main`

1. CI-Workflow läuft (lint → typecheck → test → build + Docker-Validate)
2. `release.yml` baut + pusht Images zu GHCR (nur bei `v*`-Tags)
3. `deploy.yml` startet automatisch sobald CI grün ist
4. Deploy-Script auf dem Server: pull → migrate → restart → healthcheck

---

## Erstinstallation

### Voraussetzungen

- Hetzner CX21 oder grösser (Ubuntu 24.04, 2 vCPU, 4 GB RAM)
- Domain `klopilot.ch` mit DNS-Zugang
- GitHub-Konto mit Schreibzugriff auf `4cpa/klopilot`

### Schritt 1 — Server bestellen und SSH einrichten

```bash
# Lokaler Rechner
ssh-keygen -t ed25519 -C "deploy@klopilot.ch" -f ~/.ssh/klopilot_deploy
# Public Key beim Hetzner-Server als Root-Key hinterlegen (bei Server-Erstellung)
```

### Schritt 2 — DNS-Records setzen

| Record                  | Typ | Wert          |
| ----------------------- | --- | ------------- |
| `klopilot.ch`           | A   | `<Server-IP>` |
| `www.klopilot.ch`       | A   | `<Server-IP>` |
| `api.klopilot.ch`       | A   | `<Server-IP>` |
| `minio.klopilot.ch`     | A   | `<Server-IP>` |
| `minio-api.klopilot.ch` | A   | `<Server-IP>` |

TTL: 300s für schnelle Erstpropagation, danach erhöhen.

### Schritt 3 — Server-Bootstrap

```bash
# Als root auf dem Server
git clone https://github.com/4cpa/klopilot.git /tmp/klopilot-setup
cd /tmp/klopilot-setup
bash infra/scripts/server-setup.sh
```

Das Script:

- Installiert Docker
- Erstellt `/opt/klopilot/` mit `docker-compose.prod.yml` und `deploy.sh`
- Startet Traefik mit Let's Encrypt
- Konfiguriert UFW-Firewall

> **Deploy-User:** GitHub Actions verbindet sich als `ubuntu` (VPS-Hauptnutzer mit Docker-Gruppe).
> Ein separater `deploy`-User ist nicht nötig.

### Schritt 4 — SSH-Key für GitHub Actions hinterlegen

```bash
# Lokaler Rechner: neues Ed25519-Schlüsselpaar für CI generieren
ssh-keygen -t ed25519 -C "github-actions@klopilot.ch" -f ~/.ssh/klopilot_ci

# Öffentlichen Key anzeigen
cat ~/.ssh/klopilot_ci.pub
```

Auf dem Server:

```bash
# Als ubuntu-User
cat >> ~/.ssh/authorized_keys << 'EOF'
ssh-ed25519 AAAA... github-actions@klopilot.ch
EOF
chmod 600 ~/.ssh/authorized_keys
```

### Schritt 5 — GitHub Secrets hinterlegen

In `https://github.com/4cpa/klopilot/settings/secrets/actions`:

| Secret            | Wert                                                         |
| ----------------- | ------------------------------------------------------------ |
| `SSH_HOST`        | Server-IP oder Hostname                                      |
| `SSH_USER`        | `ubuntu`                                                     |
| `SSH_PRIVATE_KEY` | Inhalt von `~/.ssh/klopilot_ci` (privater Key)               |
| `SSH_PORT`        | `22` (Standard)                                              |
| `GHCR_TOKEN`      | GitHub PAT mit `packages:read` Scope                         |
| `MAPTILER_KEY`    | API-Key von [cloud.maptiler.com](https://cloud.maptiler.com) |

Für das GitHub **Environment** `production` (Settings → Environments → New):

- Protection rules: Required reviewers (optional für Staging)
- Secrets wie oben

### Schritt 6 — Produktions-Umgebungsvariablen

```bash
# Auf dem Server als ubuntu-User
cp /opt/klopilot/.env.prod.example /opt/klopilot/.env.prod
nano /opt/klopilot/.env.prod
```

> **Wichtig — `.env.prod` Dateiberechtigungen:**
> Docker Compose v5 öffnet das Env-File im Prozesskontext des SSH-Users (kein sudo).
> Die Datei muss für diesen User lesbar sein:
>
> ```bash
> # Mindestens 644 (world-readable) — sicher solange keine anderen untrusted User auf dem VPS
> chmod 644 /opt/klopilot/.env.prod
> ```

Alle `CHANGE_ME`-Werte ersetzen:

```bash
# Secrets generieren
openssl rand -base64 32   # für Passwörter
openssl rand -base64 64   # für JWT_SECRET
```

Wichtigste Variablen:

- `POSTGRES_PASSWORD`, `REDIS_PASSWORD` — starke zufällige Passwörter
- `JWT_SECRET` — mind. 64 Zeichen
- `S3_ACCESS_KEY`, `S3_SECRET_KEY` — MinIO-Zugangsdaten
- `MEILI_KEY` — Meilisearch Master-Key
- `MAPTILER_KEY` / `NEXT_PUBLIC_MAPTILER_KEY` — von cloud.maptiler.com
- `MAIL_*` — SMTP-Zugangsdaten (Infomaniak empfohlen für CH-Hosting)

### Schritt 7 — Erstes Deployment

```bash
# Manuell (lokal) mit GitHub Actions:
# GitHub → Actions → Deploy → Run workflow → tag: latest

# ODER direkt auf dem Server:
cd /opt/klopilot
export GHCR_TOKEN="<dein-ghcr-token>"
bash deploy.sh
```

---

## Reguläre Deployments

Jeder Push auf `main` → CI → automatisches Deployment.

### Manuelles Deployment / Rollback

```bash
# GitHub → Actions → Deploy → Run workflow
# tag: sha-<commit-sha> für Rollback auf bestimmte Version

# ODER direkt auf dem Server:
TAG=sha-abc123 bash /opt/klopilot/deploy.sh
```

### Prisma-Migrationen

Migrationen laufen automatisch im Deploy-Script (Schritt 5 in `deploy.sh`).

Manuell ausführen:

```bash
# Auf dem Server
docker compose -f /opt/klopilot/docker-compose.prod.yml \
  run --rm --no-deps api \
  node /app/apps/api/node_modules/.bin/prisma migrate deploy \
    --schema /app/apps/api/prisma/schema.prisma
```

### Produktionslogs

```bash
# API-Logs
docker logs klopilot-api --tail 100 -f

# Web-Logs
docker logs klopilot-web --tail 100 -f

# Traefik Zugriffslogs
tail -f /var/log/traefik/access.log | grep -v "200"

# Alle Services
docker compose -f /opt/klopilot/docker-compose.prod.yml logs --tail 50 -f
```

### Datenbank-Zugriff (via SSH-Tunnel)

```bash
# Lokaler Rechner: SSH-Tunnel öffnen
ssh -L 5433:localhost:5432 deploy@<server-ip>

# Neues Terminal: Prisma Studio
DATABASE_URL="postgresql://klopilot:<password>@localhost:5433/klopilot?schema=public" \
  pnpm db:studio
```

---

## Mobile (Expo EAS)

### Voraussetzungen

```bash
pnpm add -g eas-cli
eas login   # mit Expo-Account
```

### OTA-Update (JS-only, kein App Store Review)

```bash
cd apps/mobile
eas update --branch production --message "fix: ..."
```

### Nativer Build (neue native Dependencies, App Store erforderlich)

```bash
cd apps/mobile
# iOS
eas build --profile production --platform ios
# Android
eas build --profile production --platform android
```

EAS-Konfiguration: `apps/mobile/eas.json`

---

## Monitoring & Betrieb

### Healthchecks

| Endpoint                                | Erwartung         |
| --------------------------------------- | ----------------- |
| `https://api.klopilot.ch/api/v1/health` | `{"status":"ok"}` |
| `https://klopilot.ch`                   | HTTP 200          |
| `http://<server>:8080` (SSH-Tunnel)     | Traefik Dashboard |

### Disk-Space prüfen

```bash
df -h
docker system df
# Images bereinigen (ältere als 24h, nicht genutzt)
docker image prune -f --filter "until=24h"
```

### Backup

PostgreSQL-Backup (täglich via Cron empfohlen):

```bash
# /etc/cron.daily/klopilot-backup
#!/bin/bash
docker exec klopilot-postgres pg_dump -U klopilot klopilot \
  | gzip > /opt/backups/klopilot-$(date +%Y%m%d).sql.gz
# Ältere als 30 Tage löschen
find /opt/backups -name "*.sql.gz" -mtime +30 -delete
```

MinIO-Backup: Hetzner Object Storage als Secondary via `mc mirror`.

---

## Häufige Probleme

| Problem                  | Ursache                   | Lösung                                              |
| ------------------------ | ------------------------- | --------------------------------------------------- |
| Traefik-Zertifikat fehlt | DNS noch nicht propagiert | 5–10 Minuten warten, dann `docker restart traefik`  |
| API startet nicht        | DB nicht ready            | `docker logs klopilot-api` → Fehlermeldung prüfen   |
| MinIO-Bucket fehlt       | minio-init nicht gelaufen | `docker compose run minio-init`                     |
| Migration fehlgeschlagen | Schema-Konflikt           | Logs prüfen, ggf. manuell anpassen                  |
| `prisma generate` fehlt  | Kein Prisma-Client        | `docker exec klopilot-api node ... prisma generate` |
