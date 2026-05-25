# Changelog

Alle relevanten Änderungen werden hier dokumentiert.
Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

---

## [Unreleased]

### Added

- Web-Frontend: Suche mit Debounce, MapLibre-Karte, Toilet/Rating/Add-Sheets
- Web-Frontend: i18n (DE/FR/IT/EN), SVG-Logo, Favicon
- Mobile: Leaderboard-Screen mit Podium (Gold/Silber/Bronze)
- Mobile: Kriterien-Breakdown (aufklappbar pro Kriterium in ToiletSheet)
- Mobile: Badge-Unlock-Animation nach dem Bewerten
- Mobile: Offline-Caching (SecureStore, Offline-Banner)
- Mobile: Karten-Kompass (statisch Nord-oben) + Recenter-Button
- Mobile: Öffentliche Nutzerprofile (UserProfileSheet)
- Mobile: Karten-Clustering (pure-JS Grid-Algorithmus, OTA-fähig)
- Mobile: Radius-Auswahl (500m / 1km / 2km / 5km)
- Mobile: Heatmap-Overlay (Toiletten-Wüsten visualisieren)
- Mobile: Verifizierte Beiträge (Moderator-Badge, Verify/Unverify)
- Mobile: Teilen-Button (Share API)
- Mobile: Onboarding (4 Slides, Standort-Anfrage)
- Mobile: Push-Benachrichtigungen (Expo Notifications)
- Mobile: Sprach-Umschalter (DE/FR/IT/EN, SecureStore)
- Mobile: Suche verbessert (Highlights, Verlauf, Score-Badge)
- Mobile: Report-Button (Toilette, Bewertung, Foto)
- Mobile: Foto-Viewer (Vollbild, Pagination, Report)
- Mobile: Dark Mode Toggle (system/dark/light)
- Mobile: Karten-Filter (Kategorie, Gratis, Barrierefrei)
- API: Öffentliche Nutzerprofile (`GET /users/:id/profile`)
- API: Heatmap-Endpoint (`GET /heatmap`)
- API: Partner-Programm (Bewerbung, Badge, Listing)
- API: Gamification (Punkte, Badges, Leaderboard)
- API: Push-Notifications via Expo Push API
- API: Verifizierung (`PATCH /toilets/:id/verify`)
- API: Privat-Toiletten mit Einladungssystem
- API: Foto-Upload mit EXIF-Entfernung und NSFW-Moderation
- Infrastruktur: Docker Compose (PostgreSQL + PostGIS, Redis, MinIO, Meilisearch, Mailhog)

---

## [0.1.0] — 2026-05-01

### Added

- Initiales Monorepo-Setup (Turborepo + pnpm Workspaces)
- NestJS Backend mit Prisma ORM + PostGIS
- Expo Mobile-App Grundgerüst
- Next.js Web-App Grundgerüst
- Auth: Magic Link + JWT + OAuth Google/Apple
- Toilet CRUD + Geo-Abfrage (PostGIS)
- Bewertungssystem (10 Kriterien, Blümchen 🌸 / Fliegen 🪰)
- i18n-Package (DE/FR/IT/EN)
- Shared-Types Package (Zod-Schemas)
