# Wartung & Betrieb — klopilot.ch

> Dieser Leitfaden beschreibt wiederkehrende Wartungsaufgaben, Deployment-
> Abläufe, Backup-/Restore-Prozeduren und Monitoring für klopilot.ch.

---

## 1. Infrastruktur-Übersicht (Produktion)

| Komponente           | Wo               | Details                                 |
| -------------------- | ---------------- | --------------------------------------- |
| VPS                  | Hetzner          | Ubuntu 24.04 LTS, `/opt/klopilot`       |
| Reverse Proxy        | Traefik v3       | Port 80/443, Auto-TLS via Let's Encrypt |
| API                  | Docker Container | `ghcr.io/4cpa/klopilot-api:latest`      |
| Web                  | Docker Container | `ghcr.io/4cpa/klopilot-web:latest`      |
| PostgreSQL + PostGIS | Docker Container | Volume `/opt/klopilot/data/postgres`    |
| Redis                | Docker Container | Volume `/opt/klopilot/data/redis`       |
| MinIO                | Docker Container | Volume `/opt/klopilot/data/minio`       |
| Meilisearch          | Docker Container | Volume `/opt/klopilot/data/meili`       |

Alle Services laufen über `docker-compose.prod.yml`.

---

## 2. Deployment

### 2.1 Automatisches Deployment (Normal-Fall)

Nach jedem Push auf `main` baut GitHub Actions neue Docker-Images und
pusht sie nach GHCR. Das Deployment auf den VPS muss manuell oder per
Webhook ausgelöst werden:

```bash
# Auf dem VPS als deploy-User:
cd /opt/klopilot
sudo -u deploy docker compose -f docker-compose.prod.yml --env-file .env.prod pull
sudo -u deploy docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --force-recreate
```

### 2.2 Einzelnen Service deployen

```bash
# Nur API neu deployen:
sudo -u deploy docker compose -f docker-compose.prod.yml --env-file .env.prod pull api
sudo -u deploy docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --no-deps --force-recreate api

# Nur Web neu deployen:
sudo -u deploy docker compose -f docker-compose.prod.yml --env-file .env.prod pull web
sudo -u deploy docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --no-deps --force-recreate web
```

### 2.3 Rollback

```bash
# Zu einem spezifischen Image-Tag zurück:
sudo -u deploy docker compose -f docker-compose.prod.yml --env-file .env.prod \
  up -d --no-deps --force-recreate api \
  --env API_IMAGE=ghcr.io/4cpa/klopilot-api:v0.2.0
```

Oder in `.env.prod` den Tag auf das gewünschte Image pinnen und dann deployen.

### 2.4 Datenbankmigrationen

Prisma-Migrationen laufen **nicht** automatisch beim Container-Start.
Manuell ausführen:

```bash
# Auf dem VPS:
sudo -u deploy docker compose -f docker-compose.prod.yml --env-file .env.prod \
  exec api npx prisma migrate deploy
```

Bei Breaking Changes erst Migration, dann API deployen.

---

## 3. Backup & Restore

### 3.1 PostgreSQL Backup

```bash
# Backup erstellen (komprimiert, Zeitstempel im Dateinamen):
sudo -u deploy docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  | gzip > /opt/klopilot/backups/db_$(date +%Y%m%d_%H%M%S).sql.gz

# Automatisch täglich via Cron (als root):
# 0 3 * * * /opt/klopilot/scripts/backup-db.sh >> /var/log/klopilot-backup.log 2>&1
```

### 3.2 PostgreSQL Restore

```bash
# Restore aus Backup:
gunzip -c /opt/klopilot/backups/db_20260525_030000.sql.gz \
  | sudo -u deploy docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

> **Achtung:** Restore überschreibt alle Daten. Vorher aktuelles Backup machen.

### 3.3 MinIO Backup

```bash
# MinIO-Daten spiegeln (mc muss installiert sein):
mc mirror minio/klopilot-media /opt/klopilot/backups/minio/$(date +%Y%m%d)/

# Oder Volume direkt sichern (Container stoppen erst):
sudo -u deploy docker compose -f docker-compose.prod.yml stop minio
tar czf /opt/klopilot/backups/minio_$(date +%Y%m%d).tar.gz \
  /opt/klopilot/data/minio
sudo -u deploy docker compose -f docker-compose.prod.yml start minio
```

### 3.4 Backup-Rotation

Backups älter als 30 Tage automatisch löschen:

```bash
find /opt/klopilot/backups -name "*.gz" -mtime +30 -delete
```

### 3.5 Ziele

| Metrik                         | Zielwert (MVP) |
| ------------------------------ | -------------- |
| RPO (Recovery Point Objective) | 24 Stunden     |
| RTO (Recovery Time Objective)  | 4 Stunden      |
| Backup-Aufbewahrung            | 30 Tage lokal  |

---

## 4. Monitoring & Logs

### 4.1 Container-Status

```bash
# Überblick aller Container:
sudo -u deploy docker compose -f docker-compose.prod.yml ps

# Logs eines Services in Echtzeit:
sudo -u deploy docker compose -f docker-compose.prod.yml logs -f api
sudo -u deploy docker compose -f docker-compose.prod.yml logs -f web --tail 100

# Logs aller Services:
sudo -u deploy docker compose -f docker-compose.prod.yml logs --tail 50
```

### 4.2 Health-Checks

| Service     | Endpoint / Methode                                             |
| ----------- | -------------------------------------------------------------- |
| API         | `GET https://api.klopilot.ch/health` → `{ status: "ok" }`      |
| Web         | `GET https://klopilot.ch/` → HTTP 200                          |
| PostgreSQL  | `docker compose exec postgres pg_isready`                      |
| Redis       | `docker compose exec redis redis-cli ping` → `PONG`            |
| Meilisearch | `GET http://localhost:7710/health` → `{ status: "available" }` |

### 4.3 Sentry

Fehler-Tracking unter [sentry.io](https://sentry.io) — Projekt `klopilot-api`
und `klopilot-web`. Alerting bei neuen Fehlern → admin@4cpa.ch.

### 4.4 Log-Rotation

Docker-Container-Logs rotieren automatisch wenn in `/etc/docker/daemon.json`
konfiguriert:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "5"
  }
}
```

---

## 5. TLS-Zertifikate

Traefik erneuert Let's-Encrypt-Zertifikate automatisch (ca. 30 Tage vor Ablauf).
Gespeichert in `/opt/klopilot/traefik/acme.json` (Permissions: 600).

```bash
# Zertifikat-Status prüfen:
openssl s_client -connect klopilot.ch:443 -servername klopilot.ch 2>/dev/null \
  | openssl x509 -noout -dates
```

---

## 6. Wiederkehrende Aufgaben

### Wöchentlich

- [ ] Container-Status prüfen (`docker compose ps`)
- [ ] Fehler in Sentry reviewen
- [ ] Disk-Usage kontrollieren (`df -h /opt/klopilot/data`)
- [ ] Neue Dependency-Updates in Dependabot prüfen

### Monatlich

- [ ] VPS-OS patchen: `apt update && apt upgrade -y`
- [ ] Docker Images aufräumen: `docker image prune -a --filter "until=720h"`
- [ ] Backup-Restore-Test (stichprobenartig)
- [ ] Alten Logs und Backups > 30 Tage löschen
- [ ] API-Key-Rotation für externe Services prüfen

### Quartalsweise

- [ ] Zugänge und Berechtigungen reviewen
- [ ] `pnpm audit` manuell laufen lassen und kritische Updates einspielen
- [ ] Disaster-Recovery-Test durchführen
- [ ] JWT-Secret-Rotation vorbereiten (koordiniert, da aktive Sessions terminiert)

---

## 7. Meilisearch-Index verwalten

```bash
# Index neu aufbauen (nach Schema-Änderungen):
sudo -u deploy docker compose -f docker-compose.prod.yml \
  exec api npx ts-node src/scripts/reindex.ts

# Index-Status prüfen:
curl -H "Authorization: Bearer $MEILI_KEY" http://localhost:7710/indexes

# Alle Toiletten re-indizieren:
curl -X POST -H "Authorization: Bearer $MEILI_KEY" \
  http://localhost:7710/indexes/toilets/documents/delete-all
# Danach API-Endpunkt /admin/reindex aufrufen (auth: admin)
```

---

## 8. Redis-Verwaltung

```bash
# Redis-CLI öffnen:
sudo -u deploy docker compose -f docker-compose.prod.yml exec redis redis-cli

# Alle gesetzten Keys anzeigen (nur Dev/Staging!):
KEYS *

# Magic-Link-Sessions prüfen:
KEYS magic:*
KEYS session:*

# Rate-Limit-Keys zurücksetzen (Notfall):
DEL "throttle:ip:<IP>"
```

---

## 9. Datenbank-Wartung

```bash
# Prisma Studio (erfordert SSH-Tunnel oder direkt auf VPS):
DATABASE_URL="postgresql://..." npx prisma studio

# Direkt per psql:
sudo -u deploy docker compose -f docker-compose.prod.yml \
  exec postgres psql -U klopilot -d klopilot

# Vakuumieren (PostgreSQL-Wartung):
VACUUM ANALYZE;

# PostGIS-Extensions prüfen:
SELECT PostGIS_version();

# Größte Tabellen anzeigen:
SELECT relname, pg_size_pretty(pg_relation_size(relid))
FROM pg_stat_user_tables
ORDER BY pg_relation_size(relid) DESC
LIMIT 10;
```

---

## 10. Erste Admin-Einrichtung

Nach einem frischen Deployment:

```bash
# 1. Datenbank migrieren:
docker compose exec api npx prisma migrate deploy

# 2. Seed-Daten einspielen (optional, nur für lokale Tests):
docker compose exec api npx ts-node prisma/seed.ts

# 3. Ersten Nutzer zum Admin machen:
docker compose exec postgres psql -U klopilot -d klopilot \
  -c "UPDATE users SET role = 'admin' WHERE email = 'admin@4cpa.ch';"
```

---

## 11. DNS-Konfiguration

Benötigte A-Records (Hetzner DNS):

| Hostname                | Typ | Ziel   |
| ----------------------- | --- | ------ |
| `klopilot.ch`           | A   | VPS-IP |
| `www.klopilot.ch`       | A   | VPS-IP |
| `api.klopilot.ch`       | A   | VPS-IP |
| `minio.klopilot.ch`     | A   | VPS-IP |
| `minio-api.klopilot.ch` | A   | VPS-IP |

> **Offen:** `minio.klopilot.ch` und `minio-api.klopilot.ch` A-Records fehlen noch.

---

## 12. Notfall-Kontakte

| Situation           | Kontakt                                |
| ------------------- | -------------------------------------- |
| VPS / Infrastruktur | Hetzner Support: console.hetzner.cloud |
| Sicherheitsvorfall  | admin@4cpa.ch, Sentry-Alert            |
| DNS                 | Hetzner DNS: dns.hetzner.com           |
| E-Mail (SMTP)       | Provider-Dashboard                     |

---

— Stand: v0.3.0 · 2026-05-25 · © 2026 Transivroom Division
