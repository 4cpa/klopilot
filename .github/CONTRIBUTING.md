# Beitragen zu klopilot.ch

Danke für dein Interesse, klopilot.ch zu verbessern!

## Voraussetzungen

- Node.js ≥ 20, pnpm ≥ 9, Docker & Docker Compose
- Setup: `pnpm install && cp .env.example .env && docker compose -f infra/docker-compose.yml up -d && pnpm db:migrate && pnpm db:seed`

## Workflow

1. **Fork** erstellen und Branch anlegen:

   ```bash
   git checkout -b feat/<scope>   # oder fix/<scope>, docs/<scope>
   ```

2. **Änderungen** implementieren (TypeScript strict, Zod-First, i18n-Keys)

3. **Tests** sicherstellen:

   ```bash
   pnpm test        # Unit-Tests (Vitest)
   pnpm test:e2e    # Playwright (Web)
   pnpm lint        # ESLint
   ```

4. **Commit** mit [Conventional Commits](https://www.conventionalcommits.org):

   ```
   feat(map): add radius selector
   fix(auth): handle expired magic link
   docs(api): update OpenAPI spec
   ```

5. **Pull Request** gegen `develop` öffnen:
   - Screenshot/Video bei UI-Änderungen
   - Changelog-Eintrag in `CHANGELOG.md` unter `[Unreleased]`
   - Mind. 1 Review erforderlich

## Konventionen

- Keine `any` ohne Kommentar
- Keine fest verdrahteten Strings im UI — alle Texte über i18n-Keys (DE + EN mindestens)
- Geo-Koordinaten immer als `[lng, lat]` (GeoJSON)
- EXIF zwingend entfernen bei Bild-Uploads
- Privat-Toiletten: Standort auf ~100 m runden vor Persistenz
- DSGVO: keine PII in Logs oder Fehlerberichten

## Definition of Done

- [ ] Unit-Test + mind. 1 Integrationstest
- [ ] i18n-Keys DE + EN
- [ ] Zod-Schema in `packages/shared-types`
- [ ] OpenAPI-Spec aktualisiert
- [ ] Mobile + Web verifiziert (sofern UI-Änderung)
- [ ] Accessibility-Check (WCAG 2.1 AA)
- [ ] Changelog-Eintrag

## Fragen?

Kontakt: admin@4cpa.ch
