# klopilot 🚽

Community-Plattform zur Bewertung öffentlich zugänglicher Toiletten — kostenlos, ohne Werbung.

**Live:** [klopilot.ch](https://klopilot.ch) · **Betreiber:** Transivroom Division · **Kontakt:** admin@4cpa.ch

---

## Stack

| Schicht            | Technologie                                      |
| ------------------ | ------------------------------------------------ |
| Monorepo           | Turborepo + pnpm Workspaces                      |
| Backend            | NestJS 10 · Prisma ORM · PostgreSQL 16 + PostGIS |
| Cache / Rate-Limit | Redis 7                                          |
| Suche              | Meilisearch                                      |
| Object Storage     | MinIO (lokal) · S3-kompatibel (prod)             |
| Web                | Next.js 14 · TailwindCSS · MapLibre GL JS        |
| Mobile             | Expo SDK 51 · React Native · react-native-maps   |
| Auth               | JWT · Magic Link · OAuth Google/Apple            |

---

## Schnellstart

### Voraussetzungen

- Node.js ≥ 20
- pnpm ≥ 9
- Docker & Docker Compose

### Setup

```bash
git clone https://github.com/transivroom/klopilot.git
cd klopilot

# Abhängigkeiten installieren
pnpm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# .env anpassen (Datenbankpasswörter, API-Keys, etc.)

# Infrastruktur starten (PostgreSQL, Redis, MinIO, Meilisearch, Mailhog)
docker compose -f infra/docker-compose.yml up -d

# Datenbank migrieren und seedieren
pnpm db:migrate
pnpm db:seed

# Alle Apps starten
pnpm dev
```

### Ports

| Service                | URL                   |
| ---------------------- | --------------------- |
| API                    | http://localhost:3101 |
| Web                    | http://localhost:3102 |
| Mobile (Expo)          | http://localhost:8081 |
| PostgreSQL             | localhost:5444        |
| Redis                  | localhost:6389        |
| MinIO API              | http://localhost:9010 |
| MinIO Console          | http://localhost:9011 |
| Meilisearch            | http://localhost:7710 |
| Mailhog (Mail-Testing) | http://localhost:8035 |

---

## Projektstruktur

```
klopilot/
├── apps/
│   ├── api/          # NestJS Backend
│   ├── web/          # Next.js Web-App
│   └── mobile/       # Expo Mobile-App
├── packages/
│   ├── shared-types/ # Zod-Schemas, DTOs
│   ├── i18n/         # Übersetzungen (DE/FR/IT/EN)
│   └── config/       # ESLint, tsconfig, prettier
├── infra/
│   ├── docker-compose.yml      # Lokale Infrastruktur
│   ├── docker-compose.prod.yml # Produktions-Setup
│   └── migrations/             # Prisma Migrations
└── docs/             # Architektur, ADRs, API-Spec
```

---

## Befehle

```bash
pnpm dev          # Alle Apps starten
pnpm build        # Alle Apps bauen
pnpm test         # Unit-Tests
pnpm test:e2e     # E2E-Tests (Playwright)
pnpm lint         # Linting
pnpm format       # Code formatieren

pnpm db:migrate   # Prisma migrate dev
pnpm db:studio    # Prisma Studio öffnen
pnpm db:seed      # Seed-Daten einspielen
pnpm db:reset     # DB zurücksetzen + neu seeden
```

---

## Deployment

Siehe [DEPLOYMENT.md](./DEPLOYMENT.md) für vollständige Anleitung.

**Kurzversion:**

```bash
# API + Web mit Docker
docker compose -f infra/docker-compose.prod.yml up -d

# Mobile OTA-Update
cd apps/mobile && npx eas-cli update --branch production --message "..."
```

---

## Beitragen

Siehe [CONTRIBUTING.md](.github/CONTRIBUTING.md).

- Branch-Konvention: `feat/<scope>`, `fix/<scope>`, `docs/<scope>`
- Commit-Konvention: [Conventional Commits](https://www.conventionalcommits.org)
- PR gegen `develop` öffnen, mind. 1 Review erforderlich

---

## Lizenz

Copyright © 2026 Transivroom Division. Alle Rechte vorbehalten.  
Nicht-kommerzielle Nutzung gestattet mit Quellenangabe.
