# Roadmap & Umsetzungs-Checkliste — klopilot.ch

> Geordnete, abhakbare Schritte vom leeren Repo bis zum globalen Rollout.
> Pro Phase: Ziele, Schritte, Definition-of-Done, Risiken.

## Übersicht

| Phase | Dauer | Ziel | Status |
|---|---|---|---|
| **P0** | 1 Woche | Setup, Tooling, Skeleton | offen |
| **P1** | 4–6 Wochen | Lokales MVP funktionsfähig | offen |
| **P2** | 6–8 Wochen | Closed Beta (Schweiz) | offen |
| **P3** | 8–10 Wochen | Public Beta (DACH + EN) | offen |
| **P4** | 10–12 Wochen | Internationalisierung & Skalierung | offen |
| **P5** | laufend | Wachstum, Monetarisierung B2B | offen |

---

## P0 · Fundament (1 Woche)

**Ziel:** Repo, Tools, lokale Services laufen. CLAUDE.md greift.

### Checkliste
- [ ] Git-Repo `klopilot` lokal initialisiert
- [ ] Turborepo + pnpm Workspaces eingerichtet
- [ ] Ordnerstruktur `apps/`, `packages/`, `infra/`, `docs/` angelegt
- [ ] `CLAUDE.md` ins Repo-Root kopiert (aus den Deliverables)
- [ ] `IMPRESSUM.md`, `DESIGN.md`, `SECURITY.md`, `ROADMAP.md`, `MONETIZATION.md` in `docs/`
- [ ] `.gitignore` (Node, .env, dist, .turbo, coverage)
- [ ] `.env.example` vorhanden, eigene `.env` lokal befüllt
- [ ] Docker Compose lädt: Postgres+PostGIS, Redis, MinIO, Meilisearch, Mailhog
- [ ] Pre-Commit-Hooks: ESLint, Prettier, gitleaks
- [ ] GitHub-Repo angelegt (privat), `main` geschützt
- [ ] GitHub Actions Workflow `ci.yml` (lint, test, build)
- [ ] Conventional Commits durchgesetzt

### Definition of Done
`docker compose up -d` startet alle Services healthy. `pnpm dev` startet leere Apps.

### Risiken
- Zeitverlust durch Tool-Konfiguration → Time-Box 1 Woche, danach Festlegen.

---

## P1 · Lokales MVP (4–6 Wochen)

**Ziel:** Eine Person kann lokal: Toilette suchen, eintragen, bewerten, Foto hochladen.

### Schritt 1 · Backend-Skeleton
- [ ] `apps/api` mit NestJS + Prisma scaffolded
- [ ] Module: `auth`, `users`, `toilets`, `ratings`, `media`, `search`, `health`
- [ ] Prisma-Schema (siehe `docs/schema.prisma`) übernommen
- [ ] `infra/migrations/001_postgis.sql` ausgeführt (Geo + Constraints + Privat-Blur)
- [ ] OpenAPI-Spec generiert unter `/api/docs`
- [ ] Zod-Schemas in `packages/shared-types`

### Schritt 2 · Auth
- [ ] Magic-Link-Flow (E-Mail via Mailhog lokal)
- [ ] OAuth Google
- [ ] JWT (access 15 min, refresh 7 Tage rotierend)
- [ ] Rate-Limit auf Auth-Endpunkten

### Schritt 3 · Toiletten-CRUD
- [ ] `POST /toilets` mit Validierung
- [ ] `GET /toilets?lng=&lat=&radius=` mit PostGIS `ST_DWithin`
- [ ] `GET /toilets/:id` mit Aggregat-Score
- [ ] Sichtbarkeits-Logik: `private` filtert sich aus öffentlicher Liste
- [ ] Privat-Blur-Trigger getestet

### Schritt 4 · Bewertungen
- [ ] 3 Kern-Kriterien aktiv: Zugänglichkeit, Sauberkeit, Hygiene
- [ ] XOR-Constraint auf DB-Ebene erzwungen
- [ ] Score-Aggregation: pro Toilette `avg(flowers - flies)` plus Histogramm
- [ ] Edit-Mode (eine Bewertung pro User pro Toilette)

### Schritt 5 · Medien
- [ ] Upload zu MinIO (S3-API)
- [ ] EXIF-Strip via `sharp` serverseitig
- [ ] Re-Encode zu WebP, max 1600 px Kante
- [ ] Moderation-Queue (Status `pending`)

### Schritt 6 · Web-Frontend
- [ ] Next.js 14 (App Router) + Tailwind + Tokens aus `DESIGN.md`
- [ ] Theme-Switch Light/Dark/System (Persistenz im Cookie)
- [ ] Karte mit MapLibre + MapTiler-Satellitentile
- [ ] Marker mit Cluster
- [ ] Detail-Sheet mit Score-Chart
- [ ] Formular "Toilette eintragen" mit Karten-Pin
- [ ] Bewertungs-Formular (Blümchen-/Fliegen-Slider)
- [ ] Login mit Magic Link / Google

### Schritt 7 · Mobile (Expo)
- [ ] App-Skelett mit Tabs Karte, Suche, Beitragen, Profil
- [ ] react-native-maps mit Satellitenprovider
- [ ] Native Bottom-Sheet für Detail
- [ ] Bewertungs-Komponente (gemeinsame Logik via shared-types)
- [ ] Foto-Aufnahme via Expo Image Picker

### Schritt 8 · Tests & QA
- [ ] Unit-Tests für Score-Aggregation, XOR-Validierung, Privat-Blur
- [ ] Integrations-Tests pro Endpunkt
- [ ] E2E Web (Playwright): Login → Toilette anlegen → bewerten
- [ ] Accessibility-Lighthouse-Score ≥ 95

### Definition of Done P1
Lokal: 100 Test-Toiletten geseedet, Karte zeigt sie an, Anlegen + Bewerten + Foto funktionieren, Web und Mobile parallel nutzbar.

---

## P2 · Closed Beta Schweiz (6–8 Wochen)

**Ziel:** 50–200 Test-Nutzer in der Schweiz, Datenbank wächst, Moderation greift.

### Checkliste
- [ ] Restliche 7 Bewertungs-Kriterien aktiviert (Stil, Ausstattung, Sicherheit, Inklusivität, Kosten, Wartezeit, Kinder)
- [ ] Filter & Suche (Kategorie, Mindest-Score, Barrierefrei, Offen jetzt)
- [ ] Volltextsuche via Meilisearch
- [ ] Moderation-Dashboard (Web) für `moderator`-Rolle
- [ ] Foto-Auto-Moderation (NSFW-Klassifikator)
- [ ] Profanitäts-Filter mit Mehrsprachen-Wortliste
- [ ] Report-Funktion (Toilette, Bewertung, Foto, User)
- [ ] Push-Notifications via Expo Push für Mobile
- [ ] Privattoiletten: Einladungs-Flow (Email + In-App)
- [ ] DPIA Schweiz dokumentiert
- [ ] Hosting: Staging-Umgebung auf Hetzner CH oder Exoscale CH
- [ ] Backup-Strategie aktiv (täglich, verschlüsselt, 30 Tage Retention)
- [ ] Sentry + Plausible eingebunden
- [ ] Erste 100 Beta-Nutzer einladen, Feedback-Loop einrichten

### Definition of Done P2
Public Staging-URL, 200+ verifizierte Toiletten in CH, ≤ 24 h Moderations-SLA, ≤ 2 % Fehlerrate.

---

## P3 · Public Beta DACH + EN (8–10 Wochen)

**Ziel:** Öffentlich zugängliche Beta in DE, AT, CH und international (EN).

### Checkliste
- [ ] i18n in DE, FR, IT, EN voll ausgestattet
- [ ] DeepL-Anbindung für nutzergenerierte Reviews on demand
- [ ] iOS- und Android-App im TestFlight / Play Internal Testing
- [ ] Public API mit API-Keys für Partner (`X-API-Key`)
- [ ] Verifizierungs-Prozess für Beiträge (Blue-Checkmark)
- [ ] "Nette Toilette"-Partnermodell aktiv (B2B-Eintragungen, siehe MONETIZATION.md)
- [ ] Marketing-Site mit Landingpage, Press-Kit
- [ ] `security.txt` veröffentlicht
- [ ] Externes Pen-Test vor Go-Live
- [ ] Gehärtete Production: WAF, DDoS, Rate-Limits, Health-Checks
- [ ] Status-Page (`status.klopilot.ch`)
- [ ] Datenschutz-Erklärung in 4 Sprachen, Cookie-Banner (minimal, kein Tracking)

### Definition of Done P3
App in Stores, Public API live, ≥ 1000 Toiletten in DACH, ≥ 5000 aktive Nutzer.

---

## P4 · Internationalisierung & Skalierung (10–12 Wochen)

**Ziel:** Plattform skaliert weltweit, weitere Sprachen, Heatmap-Mission greifbar.

### Checkliste
- [ ] Sprach-Pakete: ES, PT, NL, PL, JA, KO, AR (RTL-Support)
- [ ] Self-Service-Onboarding für Partner ("Nette Toilette"-Anbieter weltweit)
- [ ] Heatmap "Toiletten-Wüsten" als Public-Awareness-Tool
- [ ] Bulk-Import-API (für Stadtverwaltungen, NGOs)
- [ ] Read-Replica der Datenbank, Edge-Caching für Tiles
- [ ] Multi-Region-Hosting (EU + Asia-Pacific)
- [ ] Gamification: Badges für aktive Bewerter, Country-Leaderboard
- [ ] Open-Data-Export (CC-BY) der öffentlichen Toiletten

### Definition of Done P4
≥ 25 000 Toiletten in ≥ 20 Ländern, Latenz < 200 ms in 3 Regionen, Heatmap online.

---

## P5 · Wachstum & B2B-Monetarisierung (laufend)

**Ziel:** Tragfähiges Geschäftsmodell ohne Endnutzer-Werbung.

Siehe `docs/MONETIZATION.md` für Details. Kurz:
- B2B-Partnerprogramm (Gastronomie, Mall, Veranstalter, Tourismus)
- Open-Data-Lizenzierung an Stadtverwaltungen / Reise-Apps
- Anonymisierte Insights für Forschung (kostenpflichtig, nur aggregiert)
- Stiftung / Sponsoren für Mission ("Toiletten-Wüsten" weltweit)

---

## Querschnitts-Themen (immer mitlaufend)

### Qualität
- [ ] Code-Reviews verpflichtend
- [ ] Test-Abdeckung Backend ≥ 70 %, kritische Pfade 100 %
- [ ] Storybook für UI-Komponenten
- [ ] Visual Regression Tests (Chromatic) ab P3

### Sicherheit
- [ ] Dependabot / Renovate aktiv
- [ ] `pnpm audit` und `semgrep` im CI
- [ ] Secrets-Rotation alle 90 Tage
- [ ] Backup-Restore mind. 1× pro Quartal getestet

### Community
- [ ] Code of Conduct
- [ ] CONTRIBUTING.md
- [ ] Issue- und PR-Templates
- [ ] Discussions oder Discord für Beitragende

— Stand: Mai 2026 · v0.1.0 · © 2026 Transivroom Division
