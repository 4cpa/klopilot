# Changelog

Alle relevanten Änderungen werden hier dokumentiert.
Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).
Versionierung nach [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

_Nächste geplante Features (P2/P3):_

- i18n: vollständige Übersetzungen FR/IT/EN für alle neuen UI-Texte
- Mobile: Admin-Panel (Foto-Moderation, Toiletten-Verwaltung)
- Mobile: EAS Build + OTA-Updates einrichten
- Push-Benachrichtigungen: Foto genehmigt / Bewertung erhalten
- Partner-Programm: Bewerbungsformular + Badge
- Privat-Toiletten: Einladungsflow Web
- Public API: öffentliche Dokumentation + API-Keys
- DNS: `minio.klopilot.ch` + `minio-api.klopilot.ch` A-Records setzen

---

## [0.3.0] — 2026-05-25

### Added

**Web — Admin-Panel**

- Moderation-Dashboard `/admin` mit Tab-Navigation
- Foto-Moderation: Pending-Queue, Freigabe / Ablehnung / Löschen pro Foto
- Report-Queue: Nutzer-Meldungen einsehen, als erledigt markieren oder ignorieren
- Toiletten-Verwaltung `/admin/toilets`: vollständige Liste mit Suche, Status-Filter, Pagination
- Pro Toilette: Status-Toggle (Aktiv ↔ Versteckt), Verifizierung ⭐, Löschen, Link zur Karte
- Admin-Link 🔧 in der AppBar (nur sichtbar für `admin` / `moderator`)
- Route Guard: `/admin`-Layout leitet Nicht-Admins sofort weiter

**Web — Karte**

- Direktes Hinzufügen per Karten-Klick: leere Fläche anklicken öffnet AddToiletSheet
- Toilette löschen: Button im ToiletSheet (sichtbar für Ersteller und Admin/Moderator)
- Foto löschen: ✕-Button in der Galerie (für eigene Fotos / Admin / Moderator)

**Web — Layout & UX**

- FilterBar: horizontales Drag-Scroll (Maustaste halten + ziehen), Mausrad-Scroll
- FilterBar: `cursor: grab` als Hinweis auf Scrollbarkeit
- FilterBar: Mask-Image entfernt (Chips sahen fälschlicherweise deaktiviert aus)
- ThemeToggle: Kompakt-Modus auf Mobile (1 Icon-Button statt 3), Desktop bleibt unverändert
- AppBar: `flex-shrink-0` auf Aktionen-Div — Icons werden nicht mehr herausgedrückt
- Karte: MapLibre NavigationControl + GeolocateControl von `top-right` → `bottom-right`
- Karte: `100dvh` statt `100vh` — Heatmap-Button nicht mehr hinter Safari-Toolbar
- `viewport-fit=cover` im Viewport-Meta — aktiviert `env(safe-area-inset-*)` auf iPhone

**API — Moderation**

- `GET /moderation/toilets` — paginierte Toiletten-Liste für Admin/Moderator
- `PATCH /moderation/toilets/:id/status` — Status-Verwaltung (active / hidden / removed)
- `PATCH /toilets/:id/verify` + `/unverify` — Verifizierungs-Endpoints

**API — Auth**

- Cross-Device Magic-Link: `sessionId` ermöglicht automatischen Login auf wartender Browser-Session
- `GET /auth/poll?sessionId=` — Polling-Endpoint; gibt Token zurück sobald Link geklickt
- JWT enthält nun `role` im Payload (kein extra DB-Lookup in Guards nötig)
- `POST /auth/refresh` — Token-Rotation mit httpOnly-Cookie

**API — Sicherheit**

- `Content-Type: application/json` wird nur gesetzt wenn tatsächlich ein Body vorhanden ist
- `DELETE /toilets/:id`: Admin/Moderator setzt `status: 'removed'`, User `status: 'hidden'`
- Automatischer Token-Refresh auf 401 in `api.ts` (transparente Session-Verlängerung)

**API — Media**

- `DELETE /media/:photoId` — Foto löschen (Eigentümer oder Moderator/Admin)

### Fixed

- Admin-Panel: Spinner drehte endlos (authStore.init() nicht global aufgerufen)
- Approve/Reject hatte keinen Effekt: Rolle fehlte im JWT → 403; Content-Type ohne Body → 400
- Fehleranzeige in Tabellen-Zeile: bedingtes `<td>` ersetzte durch `<p>` in Aktionen-Spalte
- CORS: Basis-Domain `klopilot.ch` fehlte in der Allowlist
- Docker Alpine: `localhost` → `127.0.0.1` (IPv6-Resolver-Problem)
- Next.js `NEXT_PUBLIC_API_URL` wird korrekt zur Build-Zeit eingebettet

---

## [0.2.0] — 2026-05-10

### Added

**Infrastruktur**

- Docker-Images für API + Web nach GHCR gepusht (CI bei `main`-Push)
- Produktions-Setup: Traefik v3, Let's Encrypt TLS, Hetzner VPS
- GitHub Actions: lint → typecheck → test → Docker-Build → Deploy
- `docker-compose.prod.yml` mit Secrets-Handling über `.env.prod`

**Web**

- Heatmap-Overlay: "Toiletten-Wüsten" visualisieren (WebGL, MapLibre)
- Karten-Filter: Gratis, Barrierefrei, Kategorie-Chips (horizontal scrollbar)
- Suche mit Debounce und Dropdown-Ergebnissen
- Foto-Upload in ToiletSheet (Camera-Capture auf Mobile)
- Foto-Lightbox mit Keyboard-Navigation
- Profil-Sidebar mit Statistiken und eigenen Toiletten
- i18n-Provider (DE/FR/IT/EN), ThemeToggle (Hell/Dunkel/System)
- Deep-Link `?t=<toiletId>` für direkte Detailansicht
- Bewertungs-Sheet (RatingSheet) mit allen 10 Kriterien

**API**

- Foto-Upload: EXIF-Entfernung vor Persistierung (Sharp)
- NSFW-Moderation: Pending-Queue für manuelle Review
- Meilisearch-Integration für Volltextsuche
- Heatmap-Endpoint (`GET /heatmap`)
- Users: Statistiken, Badges, öffentliche Profile
- Rate-Limiting: 60 req/IP/min (Redis Token-Bucket)

### Fixed

- Prisma-Binary-Target für Alpine-Linux (production Docker)
- ESLint 9 Flat Config + `prisma generate` im CI-Typecheck
- Husky Pre-Commit in CI-Umgebung korrekt deaktiviert

---

## [0.1.0] — 2026-05-01

### Added

- Initiales Monorepo-Setup (Turborepo + pnpm Workspaces)
- NestJS Backend mit Prisma ORM + PostGIS
- PostgreSQL 16 + PostGIS, Redis 7, MinIO, Meilisearch, Mailhog (lokale Infra)
- Auth: Magic Link + JWT-Rotation + OAuth Google/Apple
- Toilet CRUD + Geo-Abfrage via PostGIS `ST_DWithin`
- Bewertungssystem (10 Kriterien, Blümchen 🌸 / Fliegen 🪰)
- Shared-Types Package (Zod-Schemas)
- i18n-Package (DE/FR/IT/EN)
- Expo Mobile-App Grundgerüst
- Next.js Web-App Grundgerüst mit MapLibre GL JS

[Unreleased]: https://github.com/4cpa/klopilot/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/4cpa/klopilot/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/4cpa/klopilot/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/4cpa/klopilot/releases/tag/v0.1.0
