# CLAUDE.md — klopilot.ch

> Diese Datei ist die zentrale Anleitung für Claude Code beim Arbeiten an
> klopilot.ch. Sie wird beim Start automatisch eingelesen. Inhalt: Projekt­
> kontext, Stack, Konventionen, Befehle, Architekturentscheide. Bei Änderungen
> dieses Dokument synchron halten.

---

## 1. Projekt­übersicht

**klopilot.ch** ist eine international ausgerichtete Community-Plattform (Web + Mobile)
zur Bewertung öffentlich zugänglicher Toiletten ("Nette Toilette"-Konzept).
Mission: Förderung der Notwendigkeit frei zugänglicher Toilettenanlagen weltweit
mit Berücksichtigung lokaler Gepflogenheiten.

- **Betreiber:** Transivroom Division · 2026 · admin@4cpa.ch
- **Nutzung:** kostenlos für Endnutzer (keine Werbung an Nutzer, keine Datenverkäufe)
- **Karten­basis:** satellitenbasiert (MapTiler Satellite oder Esri World Imagery)
- **Bewertungs­symbole:** Blümchen 🌸 (positiv, 0–5) und Fliegen 🪰 (negativ, 0–5)
- **Privat­toiletten:** stark eingeschränkt (Adresse unscharf, nur eingeladene Nutzer)
- **Sprachen:** 31 (inkl. RTL Arabisch/Hebräisch), Default DE — Kern DE/FR/IT/EN.
  Details `docs/INTERNATIONALIZATION.md`
- **Datenbestand (Prod, Stand 2026-06):** ~167 000 Toiletten in 39 europäischen
  Ländern (West-/Nord-/Mittel-/Osteuropa, gesamter Balkan) plus Mittelmeer-
  Küstenregionen; Standorte teils aus OpenStreetMap (ODbL)
- **Tonalität & Design:** frech, farbenfroh, Dark-Mode first-class — siehe `docs/DESIGN.md`

## 2. Tech-Stack (verbindlich)

| Schicht            | Technologie                                                                     |
| ------------------ | ------------------------------------------------------------------------------- |
| Monorepo           | Turborepo + pnpm Workspaces                                                     |
| Backend            | NestJS 10 (TypeScript), Prisma ORM                                              |
| Datenbank          | PostgreSQL 16 + PostGIS 3                                                       |
| Cache / Rate-Limit | Redis 7                                                                         |
| Suche              | Meilisearch                                                                     |
| Object Storage     | MinIO (lokal) / S3-kompatibel (prod)                                            |
| Web-Frontend       | Next.js 14 (App Router), TailwindCSS, MapLibre GL JS                            |
| Mobile             | Expo SDK 51 + React Native, react-native-maps                                   |
| Auth               | Auth.js (Web), eigener JWT-Flow (Mobile), OAuth Google/Apple, E-Mail Magic Link |
| Validation         | Zod (shared in `packages/shared-types`)                                         |
| Tests              | Vitest (unit), Playwright (web e2e), Detox (mobile e2e)                         |
| CI/CD              | GitHub Actions                                                                  |
| Container          | Docker / Docker Compose (lokal); Infomaniak CH (prod)                           |

## 3. Repo-Struktur

```
klopilot/
├── apps/
│   ├── api/              # NestJS Backend
│   ├── web/              # Next.js Web-App
│   └── mobile/           # Expo Mobile-App
├── packages/
│   ├── shared-types/     # Zod-Schemas, DTOs, gemeinsame TS-Typen
│   ├── ui/               # geteilte React-Komponenten (Web)
│   └── config/           # ESLint, tsconfig, prettier
├── infra/
│   ├── docker-compose.yml
│   ├── migrations/       # Prisma Migrations
│   └── seed/             # Seed-Daten
├── docs/                 # Architektur, ADRs, API-Spec, dieses CLAUDE.md
├── .github/workflows/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 4. Coding Conventions

- **TypeScript strict** überall, keine `any` ohne Begründung im Kommentar
- **Zod-First:** API-Inputs und -Outputs werden als Zod-Schema definiert,
  TS-Typen daraus abgeleitet (`z.infer`)
- **Naming:** `camelCase` für Variablen, `PascalCase` für Typen/Komponenten,
  `kebab-case` für Dateinamen außer React-Komponenten
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`,
  `test:`, `chore:`)
- **Branches:** `main` (geschützt) — `develop` — `feat/<scope>` / `fix/<scope>`
- **Pull Requests:** mind. 1 Review, alle Checks grün, kein direktes Push auf `main`
- **i18n:** keine fest verdrahteten Strings im UI — alle Texte über Translation-Keys
- **Geo:** Koordinaten immer als `[lng, lat]` (GeoJSON-Reihenfolge), in Prisma als
  PostGIS `geography(Point, 4326)`
- **Bilder:** EXIF wird beim Upload zwingend entfernt (Privatsphäre)

## 5. Domänenmodell

### Bewertungslogik

Pro Kriterium **entweder** Blümchen 🌸 (0–5) **oder** Fliegen 🪰 (0–5), nie beides.
Aggregierter Score je Kriterium = `flowers - flies`. Gesamtscore = Summe normalisiert.

### Kriterien (Standard MVP)

1. Zugänglichkeit (Auffindbarkeit, Barrierefreiheit, Öffnungszeit)
2. Sauberkeit
3. Hygiene (Seife, Desinfektion, Geruch)
4. Aufmachung & Stil
5. Ausstattung (Papier, Trockner, Wickeltisch, Spiegel)
6. Sicherheit (Schloss, Beleuchtung, Umgebung)
7. Geschlechter­neutralität / Inklusivität
8. Kosten (gratis vs. kostenpflichtig)
9. Wartezeit / Verfügbarkeit
10. Kinder­freundlichkeit

### Kategorien

`public` · `nette_toilette` · `gastronomy` · `transport` · `mall` · `event` · `private`

### Sichtbarkeit

- `public` — auf Karte für alle
- `nette_toilette` — auf Karte, mit Partner-Badge
- `private` — **nicht auf öffentlicher Karte**, Standort gerundet auf 100 m,
  nur eingeladene Nutzer (`private_invites`)

## 6. Architektur (Kurzform)

```
Clients  ──>  API Gateway (NestJS)  ──>  Services
                                          ├─ Auth/User
                                          ├─ Toilet (CRUD + Geo)
                                          ├─ Rating
                                          ├─ Media (Upload, Moderation)
                                          ├─ Search/Geo (PostGIS, Meilisearch)
                                          ├─ Moderation
                                          └─ Notification
                                          ↓
                                  PostgreSQL + PostGIS
                                  Redis · MinIO/S3 · Meilisearch
```

Detailliertes Diagramm: `docs/architecture.png` und `docs/architecture.mmd`.

## 7. Wichtige Befehle

```bash
# Setup
pnpm install
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d
pnpm db:migrate
pnpm db:seed

# Entwicklung
pnpm dev                   # alle Apps gleichzeitig
pnpm --filter api dev      # nur Backend
pnpm --filter web dev      # nur Web
pnpm --filter mobile start # nur Mobile (Expo)

# Tests
pnpm test                  # alle Unit-Tests
pnpm test:e2e              # Playwright (Web)
pnpm --filter mobile test:e2e  # Detox

# Datenbank
pnpm db:migrate            # Prisma migrate dev
pnpm db:studio             # Prisma Studio
pnpm db:reset              # Reset + Seed

# Lint / Format
pnpm lint
pnpm format

# Build
pnpm build

# Statistik-Report (DE/EN HTML+PDF nach apps/web/public/reports/, verlinkt von /impressum)
pnpm report                # frische Prod-Zahlen ziehen + neu rendern

# Lokales Repo-Backup nach ./backup/ (gitignored): Git-Bundle + Worktree-Tarball
pnpm backup                # BACKUP_KEEP=<n> steuert die Retention (Default 5)

# Prod-Daten (im laufenden API-Container, via sudo docker exec klopilot-api)
node apps/api/dist/scripts/seed-osm.js --only=<ascii-substring>  # Region (nach-)importieren
node apps/api/dist/scripts/reindex-meili.js                      # Suche neu aufbauen
```

## 8. Umgebungs­variablen (Auszug)

Vollständige Liste in `.env.example`. Wichtigste:

| Key                                                  | Zweck              |
| ---------------------------------------------------- | ------------------ |
| `DATABASE_URL`                                       | Postgres + PostGIS |
| `REDIS_URL`                                          | Redis              |
| `S3_ENDPOINT` / `S3_BUCKET` / `S3_KEY` / `S3_SECRET` | Object Storage     |
| `MEILI_HOST` / `MEILI_KEY`                           | Suche              |
| `MAPTILER_KEY`                                       | Satellitenkarten   |
| `JWT_SECRET`                                         | API-Auth           |
| `OAUTH_GOOGLE_*`, `OAUTH_APPLE_*`                    | OAuth              |
| `MAIL_*`                                             | Magic-Link-Mails   |
| `MODERATION_NSFW_ENDPOINT`                           | Bild-Moderation    |

## 9. Sicherheit & Datenschutz (verbindlich)

- DSGVO/revDSG: CH-Hosting bei Infomaniak (Genf); Server ausschliesslich in der Schweiz
- EXIF-Daten von Uploads **immer** entfernen, vor Persistenz
- Privat­toiletten: Geocoding wird vor Speicherung auf ~100 m gerastert
- Eine Bewertung pro `(user, toilet)`-Paar (editierbar)
- Rate-Limits: 60 Requests / IP / Minute (Redis Token Bucket)
- Auto-Moderation: Profanitäts­filter + NSFW-Bildklassifikator,
  manuelle Review-Queue für Grenz­fälle
- Captcha (hCaptcha) bei anonymen Schreib­operationen — falls überhaupt erlaubt

## 10. Definition of Done (Feature)

- [ ] Tests: Unit + mind. 1 Integrationstest
- [ ] i18n-Keys für DE und EN vorhanden
- [ ] Zod-Schema im `shared-types` Package
- [ ] OpenAPI-Spec aktualisiert (`docs/api/openapi.yaml`)
- [ ] Mobile + Web verifizieren (sofern UI)
- [ ] Accessibility-Check (WCAG 2.1 AA)
- [ ] PR enthält Screenshot/Video bei UI-Änderungen
- [ ] Changelog-Eintrag

## 11. Roadmap-Phasen

**P1 — Lokal-MVP (4–6 Wochen)**: Auth · Toilet-CRUD · Karte mit Markern ·
3 Kern­kriterien · Foto-Upload · Docker Compose lokal

**P2**: alle 10 Kriterien · Moderation · Filter & Suche · Mobile Beta

**P3**: i18n (✅ 31 Sprachen inkl. RTL) · Push · verifizierte Beiträge ·
Privat­toiletten · Public API

**P4**: Gamification · Heatmap "Toiletten-Wüsten" · Partner­programm

## 12. Häufig genutzte Pfade für Claude Code

- API-Endpunkte: `apps/api/src/modules/<domain>/*`
- Prisma-Schema: `apps/api/prisma/schema.prisma`
- Web-Seiten: `apps/web/app/[locale]/...`
- Map-Komponente: `apps/web/components/map/`
- Mobile-Screens: `apps/mobile/app/(tabs)/...`
- Geteilte Schemas: `packages/shared-types/src/schemas/`
- i18n-Übersetzungen: `packages/i18n/src/locales/<code>.json` (Quelle: `de.json`),
  Registrierung in `packages/i18n/src/index.ts`; Integritätstest
  `apps/api/src/common/i18n-locales.spec.ts`
- OSM-Seed / Reindex: `apps/api/prisma/seed-osm.ts`, `apps/api/prisma/reindex-meili.ts`
- Statistik-Report-Generator: `apps/web/scripts/generate-report.mjs`
- ADRs (Architecture Decision Records): `docs/adr/`
- Barrierefreiheit: Fokus-Falle `apps/web/lib/useFocusTrap.ts`, Listenansicht
  `apps/web/components/map/ToiletListPanel.tsx`, axe-Test `apps/web/e2e/a11y.spec.ts`,
  Kontrast-/Score-Tokens in `apps/web/app/globals.css`; Hintergrund/Konventionen:
  `docs/DESIGN.md` §9, `docs/adr/0004-wcag-accessibility-ueberarbeitung.md`

## 13. Externe Services

| Service                   | Plan / Status                         |
| ------------------------- | ------------------------------------- |
| MapTiler                  | Free Tier MVP, später Pay-as-you-go   |
| OpenStreetMap (Geocoding) | Nominatim (self-hosted ab P3)         |
| hCaptcha                  | Free Tier                             |
| DeepL                     | für Übersetzung der Reviews on demand |
| Sentry                    | Error-Tracking                        |
| Plausible                 | datenschutz­freundliche Analytics     |

## 14. Wenn unklar

- Zuerst diese Dokumente konsultieren:
  - `docs/CLAUDE.md` (diese Datei)
  - `docs/DESIGN.md` — Farben, Typografie, Komponenten-Sprache
  - `docs/SECURITY.md` — Sicherheits- und Datenschutz-Vorgaben (verbindlich)
  - `docs/ROADMAP.md` — was gehört zu welcher Phase
  - `docs/MONETIZATION.md` — Geschäftsmodell, was erlaubt / was nicht
  - `docs/IMPRESSUM.md` — rechtliche Angaben
  - `docs/INTERNATIONALIZATION.md` — i18n (31 Sprachen, RTL, Sprache hinzufügen)
  - `docs/TESTING.md` — Test-Strategie & Anleitung
  - `docs/adr/` — Architektur-Entscheide (i18n/RTL, Hosting Infomaniak, OSM-Seed)
- Bei Unsicherheit: kleinerer, reversibler Schritt schlägt großen Wurf.
- Geo-/Datenschutz-relevante Änderungen nie ohne Review.
- Kein Schreiben auf `main` — immer PR.

— Stand: 2026-06-01 · P2/P3 (31 Sprachen, europaweiter Datenbestand) · © 2026 Transivroom Division
