# klopilot 🚽

Community-Plattform zur Bewertung öffentlich zugänglicher Toiletten — kostenlos, ohne Werbung.

**Live:** [klopilot.ch](https://klopilot.ch) · **API:** [api.klopilot.ch](https://api.klopilot.ch) · **Betreiber:** Transivroom Division · **Kontakt:** admin@4cpa.ch

---

## Features

| Feature                                             | Web | Mobile |
| --------------------------------------------------- | :-: | :----: |
| Karte mit Toiletten-Markern                         |  ✓  |   ✓    |
| Heatmap (Toiletten-Wüsten)                          |  ✓  |   ✓    |
| Kartenstil-Wechsler (Satellit / Strassen / Outdoor) |  ✓  |   —    |
| Kompass (DeviceOrientation, Nord-Ausrichtung)       |  ✓  |   —    |
| Suche (Meilisearch)                                 |  ✓  |   ✓    |
| 10 Bewertungskriterien (🌸 / 🪰)                    |  ✓  |   ✓    |
| Foto-Upload (EXIF-frei)                             |  ✓  |   ✓    |
| Magic-Link + OAuth Login                            |  ✓  |   ✓    |
| Cross-Device Magic-Link Polling                     |  ✓  |   —    |
| Dark Mode / Light / System                          |  ✓  |   ✓    |
| i18n (31 Sprachen, inkl. RTL Arabisch/Hebräisch)    |  ✓  |   ✓    |
| Karten-Filter (Gratis, Barrierefrei, Kategorie)     |  ✓  |   ✓    |
| Toilet direkt per Karten-Klick hinzufügen           |  ✓  |   —    |
| Admin-Panel (Moderation, Verwaltung)                |  ✓  |   —    |
| Gamification (Punkte, Badges, Leaderboard)          |  —  |   ✓    |
| Push-Benachrichtigungen                             |  —  |   ✓    |
| Offline-Caching                                     |  —  |   ✓    |

---

## Tech-Stack

| Schicht            | Technologie                                                          |
| ------------------ | -------------------------------------------------------------------- |
| Monorepo           | Turborepo + pnpm Workspaces                                          |
| Backend            | NestJS 10 · Prisma ORM · PostgreSQL 16 + PostGIS 3                   |
| Cache / Rate-Limit | Redis 7                                                              |
| Suche              | Meilisearch                                                          |
| Object Storage     | MinIO (lokal) · S3-kompatibel (prod)                                 |
| Web                | Next.js 14 · TailwindCSS · MapLibre GL JS                            |
| Mobile             | Expo SDK 51 · React Native · react-native-maps                       |
| Auth               | JWT (15 min) · Refresh-Token (7 d) · Magic Link · OAuth Google/Apple |
| Validation         | Zod (shared-types package)                                           |
| CI/CD              | GitHub Actions → GHCR → Infomaniak VPS (CH)                          |
| Reverse Proxy      | Traefik v3 + Let's Encrypt                                           |

---

## Schnellstart (Lokal)

### Voraussetzungen

- Node.js ≥ 22
- pnpm ≥ 9
- Docker & Docker Compose

### Setup

```bash
git clone https://github.com/4cpa/klopilot.git
cd klopilot

# Abhängigkeiten installieren
pnpm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# .env anpassen (DB-Passwörter, JWT_SECRET, ggf. MapTiler-Key etc.)

# Infrastruktur starten (PostgreSQL+PostGIS, Redis, MinIO, Meilisearch, Mailhog)
docker compose -f infra/docker-compose.yml up -d

# Datenbank migrieren + seeden
pnpm db:migrate
pnpm db:seed

# Alle Apps gleichzeitig starten
pnpm dev
```

### Lokale Service-URLs

| Service                    | URL                            |
| -------------------------- | ------------------------------ |
| API                        | http://localhost:3101          |
| API Swagger-Docs           | http://localhost:3101/api/docs |
| Web                        | http://localhost:3102          |
| Mobile (Expo)              | http://localhost:8081          |
| PostgreSQL                 | localhost:5444                 |
| Redis                      | localhost:6389                 |
| MinIO API                  | http://localhost:9010          |
| MinIO Console              | http://localhost:9011          |
| Meilisearch                | http://localhost:7710          |
| Mailhog (Magic-Link-Mails) | http://localhost:8035          |

### Erstes Admin-Konto

Nach dem Seeden hat der erste Nutzer (`seed@klopilot.ch`) die Rolle `user`. Für Admin-Zugriff:

```bash
# Prisma Studio öffnen
pnpm db:studio
# → Tabelle User → Rolle auf 'admin' setzen
```

Oder direkt per SQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'deine@email.ch';
```

---

## Projektstruktur

```
klopilot/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/modules/        # auth, toilets, ratings, media, moderation, …
│   │   ├── prisma/             # Schema, Migrations, Seed
│   │   └── Dockerfile
│   ├── web/                    # Next.js Web-App (App Router)
│   │   ├── app/                # Pages (karte, admin, …)
│   │   ├── components/         # UI, map, sheets, auth
│   │   └── lib/                # api.ts, auth-store, hooks
│   └── mobile/                 # Expo React Native
├── packages/
│   ├── shared-types/           # Zod-Schemas, DTOs, gemeinsame TS-Typen
│   ├── i18n/                   # Übersetzungen (31 Sprachen, inkl. RTL)
│   └── config/                 # ESLint, tsconfig, prettier
├── infra/
│   ├── docker-compose.yml      # Lokale Infrastruktur
│   ├── docker-compose.prod.yml # Produktions-Setup
│   └── migrations/             # Prisma Migrations (Backup)
├── docs/
│   ├── SECURITY.md             # Sicherheit & Datenschutz
│   ├── DESIGN.md               # Design-Tokens, Farben, Typografie
│   ├── ROADMAP.md              # Feature-Phasen P1–P4
│   ├── MAINTENANCE.md          # Wartung & Betrieb
│   ├── MONETIZATION.md         # Geschäftsmodell (B2B-only)
│   ├── INTERNATIONALIZATION.md # i18n: 31 Sprachen, RTL, Sprache hinzufügen
│   ├── TESTING.md              # Test-Strategie & Anleitung
│   ├── adr/                    # Architecture Decision Records
│   └── api/openapi.yaml        # OpenAPI-Spec
├── .github/
│   ├── workflows/              # CI + Release + Deploy
│   ├── CONTRIBUTING.md
│   └── PULL_REQUEST_TEMPLATE.md
├── CHANGELOG.md
├── DEPLOYMENT.md
└── CLAUDE.md                   # Anleitung für Claude Code
```

---

## Wichtige Befehle

```bash
# Entwicklung
pnpm dev                    # Alle Apps starten
pnpm --filter api dev       # Nur Backend
pnpm --filter web dev       # Nur Web
pnpm --filter mobile start  # Nur Mobile (Expo)

# Tests
pnpm test                   # Alle Unit-Tests (Vitest)
pnpm test:e2e               # Playwright E2E (Web)
pnpm --filter api test:int  # Integrationstests Backend

# Datenbank
pnpm db:migrate             # Prisma migrate dev
pnpm db:studio              # Prisma Studio
pnpm db:seed                # Seed-Daten einspielen
pnpm db:reset               # Reset + neu seeden

# Qualität
pnpm lint                   # ESLint
pnpm format                 # Prettier
pnpm typecheck              # tsc --noEmit aller Pakete

# Build
pnpm build                  # Alle Pakete bauen
```

---

## Admin-Panel

Das Admin-Panel unter `/admin` (nur für Nutzer mit Rolle `admin` oder `moderator`) bietet:

- **📷 Foto-Queue** — Eingereichte Fotos freigeben, ablehnen oder löschen
- **🚨 Reports** — Nutzermeldungen einsehen und bearbeiten
- **🚽 Toiletten-Verwaltung** — Alle Toiletten mit Suche, Status-Filter, Verifizierung

Zugriff: AppBar → 🔧-Icon (nur sichtbar wenn eingeloggt als Admin/Moderator).

---

## Bewertungssystem

Pro Toilette, pro Nutzer: **eine** Bewertung (editierbar). 10 Kriterien, je Kriterium entweder Blümchen 🌸 (positiv, 0–5) **oder** Fliegen 🪰 (negativ, 0–5).

| Kriterium            | Beschreibung                                     |
| -------------------- | ------------------------------------------------ |
| Zugänglichkeit       | Auffindbarkeit, Barrierefreiheit, Öffnungszeiten |
| Sauberkeit           | Allgemeiner Zustand                              |
| Hygiene              | Seife, Desinfektion, Geruch                      |
| Stil                 | Aufmachung, Ambiente                             |
| Ausstattung          | Papier, Trockner, Wickeltisch, Spiegel           |
| Sicherheit           | Schloss, Beleuchtung, Umgebung                   |
| Inklusivität         | Geschlechtsneutral, Barrierefreiheit             |
| Kosten               | Gratis vs. kostenpflichtig                       |
| Wartezeit            | Verfügbarkeit, Schlange                          |
| Kinderfreundlichkeit | —                                                |

Aggregierter Score pro Kriterium = `flowers − flies`. Gesamtscore = normalisierte Summe.

---

## Deployment

Vollständige Anleitung in [DEPLOYMENT.md](./DEPLOYMENT.md).
Wartung und Betrieb in [docs/MAINTENANCE.md](./docs/MAINTENANCE.md).

**Kurzversion (bei laufendem VPS):**

```bash
# Nach jedem Push auf main läuft CI automatisch durch und triggert den Deploy-Workflow.
# Manuell auf dem VPS (als ubuntu-User):
cd /opt/klopilot
bash deploy.sh
```

> **Hinweis `.env.prod`:** Die Datei muss für Docker Compose v5 mindestens mit `chmod 644`
> (world-readable) konfiguriert sein, da Compose die Datei im Prozesskontext des SSH-Users
> öffnet — ohne Privilege-Escalation.

---

## Statistik-Report

Zweisprachiges (DE/EN) Statistik-Dokument (Toiletten nach Ländern und Rubriken, Logo,
Impressum/Datenquellen) als HTML + PDF unter `apps/web/public/reports/`, verlinkt von `/impressum`.

```bash
pnpm report                 # frische Prod-Zahlen ziehen + HTML/PDF neu rendern
pnpm --filter web report -- --no-pdf                       # nur HTML + JSON
pnpm --filter web report -- --from-json apps/web/public/reports/klopilot-stats.json
```

Datenquelle ist standardmässig die Prod-DB über SSH (`sudo docker exec <pg> psql …`),
konfigurierbar per Env (`REPORT_SSH_HOST`, `REPORT_PG_CONTAINER`, `REPORT_PG_USER`,
`REPORT_PG_DB`, `REPORT_DATE`). Länder werden geografisch aus den Koordinaten abgeleitet
(kleinste enthaltende Bounding-Box). Stabile Dateinamen → der Impressum-Link bleibt gültig.
Generator: `apps/web/scripts/generate-report.mjs`.

---

## Lokales Backup

```bash
pnpm backup                 # Git-Bundle (Historie) + Worktree-Tarball nach ./backup/
BACKUP_KEEP=10 pnpm backup  # Retention: wie viele Backups behalten (Default 5)
```

`./backup/` ist gitignored (nicht committet). Wiederherstellung und Details in der
automatisch erzeugten `backup/RESTORE.md`. Skript: `scripts/backup.sh`.

---

## Beitragen

Siehe [CONTRIBUTING.md](.github/CONTRIBUTING.md).

- Branch-Konvention: `feat/<scope>`, `fix/<scope>`, `docs/<scope>`
- Commit-Konvention: [Conventional Commits](https://www.conventionalcommits.org)
- PR gegen `develop` öffnen, mind. 1 Review, alle Checks grün

**Definition of Done:**

- [ ] Unit + Integrationstest vorhanden
- [ ] Zod-Schema in `shared-types` falls neue API-Shape
- [ ] i18n-Keys für DE und EN ergänzt
- [ ] OpenAPI-Spec aktualisiert
- [ ] Screenshot/Video bei UI-Änderungen im PR

---

## Sicherheit

Sicherheitslücken bitte **nicht** als öffentliches Issue melden, sondern vertraulich an **admin@4cpa.ch** — Details in [docs/SECURITY.md](./docs/SECURITY.md).

---

## Lizenz

Copyright © 2026 Transivroom Division. Alle Rechte vorbehalten.  
Nicht-kommerzielle Nutzung gestattet mit Quellenangabe — vollständige Bedingungen in [LICENSE.md](./LICENSE.md).

**Drittanbieter-Daten:** Ein Teil der Toiletten-Standorte stammt aus OpenStreetMap
(© OpenStreetMap-Mitwirkende, [ODbL](https://www.openstreetmap.org/copyright)).
Kartenkacheln von MapTiler/Esri unterliegen deren Bedingungen.
