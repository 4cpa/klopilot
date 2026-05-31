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

## [0.5.0] — 2026-05-31

### Added

**Karte — Clustering (Eurokey-Stil)**

- Geclusterte GeoJSON-Quelle (`cluster: true`) statt eines DOM-Markers pro Toilette
- Beim Rauszoomen: halbtransparente Cluster-Bubbles mit WC-Anzahl; Klick zoomt per
  `getClusterExpansionZoom` bis zum Aufbruch hinein
- Beim Reinzoomen: exakt 1:1 positionierte Einzelmarker (Pool nach Toilet-ID →
  keine Positionsdrift/kein Flackern beim Zoomen)
- Marker-Sync auf `idle`-Event (nicht jeden Frame) → kein Flackern bei Tile-Loading

**API — Viewport-Aggregation**

- Neuer Endpoint `GET /toilets/viewport` (Bbox): liefert Einzel-Toiletten (≤ 1500)
  oder serverseitig aggregierte Cluster-Zellen (Zentroid + exakte Anzahl) bei
  dichten/weit rausgezoomten Viewports → echter Gesamtbestand statt geladener Teilmenge
- Kategorie-Filter konsistent in allen Viewport-Queries (Aggregation + Detail)
- Redis-Cache (gerundete Bbox + Kategorie + Grid, 60 s TTL) gegen Seq-Scan-Last
- OpenAPI-Spec (`docs/api/openapi.json`) enthält den Endpoint

### Fixed

**OSM-Import — Kategorisierung**

- Restaurants/Cafés wurden fälschlich als `transport` (Bahnhof/Flughafen)
  klassifiziert. Transport wird jetzt nur aus strukturierten Tags abgeleitet
  (nicht aus Namens-Substrings); Gastronomie hat Vorrang (Tags + Lokalname mit
  Wortgrenzen-Erkennung). Näherungs-Phasen (Bahnhof/Mall-Umkreis) überschreiben
  erkannte Venues nicht mehr (`resolveCategory`)
- `mapFee`: Fremdwährungs-/Artefakt-Beträge (z. B. `200 CZK`, `1500 HUF`)
  erzeugten `numeric(6,2)`-Overflow → Plausibilitätsgrenze; ein einzelner Fehlsatz
  bricht nicht mehr die ganze Import-Region ab
- Phase-6 Mall-Query: fehlende `way[...]`-Zeile ergänzt (Mall-Toiletten als OSM-way
  wurden übersehen); Phase-8a Overpass-Query (doppeltes `out` → HTTP 400) korrigiert
- Klassifikationslogik in testbare Module ausgelagert (`osm-category`, `osm-fee`),
  24 Unit-Tests

**Karte**

- serverseitige Cluster-Bubbles und Heatmap-Farbverlauf gingen nach Kartenstil-Wechsel
  verloren → werden in `onStyleData` korrekt neu aufgebaut

---

## [0.4.0] — 2026-05-25

### Added

**Karte — Kompass**

- Kompass-Toggle-Button (unten links, neben Kartenstil-Wechsler): Ein/Aus
- Ausgeschaltet: Karte immer Nord-oben, Rotation gesperrt (`dragRotate.disable`)
- Eingeschaltet: Karte dreht sich automatisch nach Gerätekompass via `DeviceOrientation` API
  - iOS 13+: `DeviceOrientationEvent.requestPermission()` wird synchron im Click-Handler aufgerufen (Safari-Pflicht)
  - iOS: `webkitCompassHeading` (geografischer Nord)
  - Android / Chrome: `deviceorientationabsolute` mit absolutem `alpha`-Wert
  - Fallback auf reguläres `deviceorientation`
  - Manuelle Karten-Rotation per Rechtsklick+Drag (Desktop) / Zwei-Finger (Mobile) weiterhin möglich
- SVG-Kompassnadel im Button: rote Spitze zeigt immer Richtung Nord (dreht gegenläufig zum Karten-Bearing)
- Bearing-Anzeige im Button-Tooltip: `Bearing: 42°`
- Ausschalten setzt Bearing auf 0° zurück (400 ms `easeTo`)
- `onBearingChange` Callback auf MapView: React-State max. 10×/s aktualisiert (throttle)

**Karte — Kartenstil-Wechsler**

- Drei Stile: 🛰️ Satellit (`hybrid`), 🗺️ Strassen (`streets-v2`), 🌿 Outdoor (`outdoor-v2`)
- Quell: MapTiler Style-JSON (via `NEXT_PUBLIC_MAPTILER_KEY`)
- Fallback: OSM-Raster-Tiles ohne API-Key
- Nach Style-Wechsel wird Heatmap-Layer automatisch neu angewendet (`heatmapStateRef`)
- Eingebauter Kompass des `NavigationControl` entfernt (`showCompass: false`); Zoom-Buttons bleiben

**Karte — Heatmap**

- Heatmap-API-Aufruf jetzt mit korrekten Bbox-Parametern (`minLng/minLat/maxLng/maxLat`)
- Response-Mapping korrigiert: `cells` → `points` mit `weight: count`
- Heatmap-Farb-Gradient: Mint → Gelb → Orange → Berry (entspricht Brand-Palette)
- Beim Einschalten: aktueller sichtbarer Viewport als Bbox verwendet (Fallback: Schweiz-Default)

**Web — Suchfeld**

- Glas-Pill-Effekt: `backdrop-filter: blur(14px)` statt solider weisser Hintergrund
- Browser-native Suchfeld-Rahmen entfernt: `appearance: none`, `WebkitAppearance: none`, `border: none`
- Fokus-Highlight via `box-shadow` statt Browser-Outline
- AppBar-Header: transparenter Hintergrund (kein weisser Gradient-Balken)

**Web — Landing Page**

- Hero: Logo (80 px) + „klopilot" als `<Link href="/karte">` — klickbar zur Karte
  - Logo: `scale(1.06)` + stärkerer Glow bei Hover
  - Schriftzug: Farbe → Brand-Orange bei Hover
- Navbar: Logo + Brand mit Cream-Hintergrund-Pill bei Hover; `href="/"` (Standard)
- Footer: Logo + Brand mit weissem Glass-Hover, scale(1.06) für Logo, Brand-Orange für Text
- Footer: Bottom-Bar `klopilot.ch` + `admin@4cpa.ch` mit Hover-Übergang (35 % → 100 % Weiss)

**Web — UI-Konsistenz**

- AppBar: Logo + „klopilot" als `<Link href="/">` (war einfaches `<div>`)
- `ThemeToggle` (Desktop-3er-Gruppe): gleicher Rahmen wie HelpButton (`1.5px solid var(--line)`, `background: var(--surface)`, Höhe 30 px)
- `ThemeToggleMini` (Mobile/AppBar): 30 px Kreis mit `border: 1.5px solid var(--line)` — identisch zum HelpButton
- FilterBar: `background: transparent` statt `linear-gradient(to bottom, var(--paper) 50%, transparent)` — kein weisser Balken über der Karte mehr

### Fixed

- **Z-Index-Schichtung**: Map-Controls-Div `zIndex: 20 → 10` — HelpOverlay, Sheets und Modals rendern nun korrekt über den Karten-Controls
  - Ursache: AppBar (stacking context z-20) und Controls-Div (z-20, später im DOM) hatten gleichen z-Index; Controls gewannen gegen HelpOverlay innerhalb von AppBar's stacking context
  - Fix: Controls auf z-10 → AppBar's stacking context (z-20) liegt immer drüber
- **Deploy: `.env.prod` Permission Denied** (`open /opt/klopilot/.env.prod: permission denied`)
  - Docker Compose v5.1.4 öffnet Env-File im Prozesskontext des SSH-Users — kein sudo, kein Privilege-Escalation
  - Deployment-User `klopilot` hatte keine Leserechte auf ubuntu-owned `rw-------`-Datei
  - Fix: `chmod 644 /opt/klopilot/.env.prod` (world-readable; VPS hat keine weiteren untrusted Users)
- **MAPTILER_KEY**: GitHub Secret korrekt gesetzt; Build-Args in `ci.yml` + `release.yml` übergeben

### Changed

- Deploy: SSH_USER von `deploy` auf `ubuntu` (VPS-Hauptnutzer mit Docker-Gruppe)
- `MapView`: `NavigationControl({ showCompass: false })` — eigener Kompass-Button ersetzt built-in

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
- Produktions-Setup: Traefik v3, Let's Encrypt TLS, Infomaniak VPS (CH)
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

[Unreleased]: https://github.com/4cpa/klopilot/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/4cpa/klopilot/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/4cpa/klopilot/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/4cpa/klopilot/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/4cpa/klopilot/releases/tag/v0.1.0
