# Test-Strategie & Anleitung — klopilot.ch

> Ziel: ausreichende Testabdeckung für das MVP mit klarem Fokus auf
> kritische Pfade (Auth, Toiletten-CRUD, Bewertungen, Zugriffsschutz).
> Kein Test-Perfektionismus — pragmatische Coverage, schnelle Feedback-Loops.

---

## 1. Test-Pyramide

```
        ┌──────┐
        │  E2E │  ← Playwright (Web) · Detox (Mobile) — wenige, kritische Flows
        └──────┘
      ┌──────────┐
      │Integration│  ← NestJS + Prisma gegen echte Test-DB — Service-Grenze
      └──────────┘
    ┌────────────────┐
    │   Unit Tests   │  ← Vitest — Logik, Transformationen, Guards, Utils
    └────────────────┘
```

---

## 2. Alle Tests auf einmal

```bash
# Unit-Tests aller Pakete:
pnpm test

# Mit Watch-Modus:
pnpm test -- --watch

# Mit Coverage:
pnpm test -- --coverage

# E2E (Web, erfordert laufende Instanz):
pnpm test:e2e

# Integrationstests Backend:
pnpm --filter api test:int
```

---

## 3. Unit-Tests (Vitest)

**Framework:** Vitest — schnell, ESM-nativ, kompatibel mit TypeScript/Zod.

**Konfiguration:** `apps/api/vitest.config.ts`

### 3.1 Tests schreiben (API)

```typescript
// apps/api/src/modules/toilets/toilets.service.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { ToiletsService } from './toilets.service';

describe('ToiletsService', () => {
  it('normalizes score correctly', () => {
    const score = ToiletsService.normalizeScore({ flowers: 4, flies: 1 });
    expect(score).toBeCloseTo(0.6, 1);
  });
});
```

### 3.2 Tests ausführen

```bash
# Nur API-Unit-Tests:
pnpm --filter api test

# Watch-Modus:
pnpm --filter api test -- --watch

# Einzelne Datei:
pnpm --filter api test -- src/modules/toilets/toilets.service.spec.ts

# Coverage-Report:
pnpm --filter api test -- --coverage
```

### 3.3 Was wird unit-getestet?

- **Auth-Service:** Token-Generierung, Magic-Link-Logik, Session-Polling
- **Toilets-Service:** Score-Aggregation, Geo-Validierung, Soft-Delete-Logik
- **Ratings-Service:** Bewertungsvalidierung (flowers/flies, 0–5, nie beides)
- **Guards:** `JwtAuthGuard`, `RolesGuard` — Payload-Extraktion, Rollenprüfung
- **Utils:** `normalizeScore`, `roundCoordinates`, EXIF-Entfernung

### 3.4 Mocking

```typescript
// Prisma-Client mocken:
import { mockDeep } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';

const prisma = mockDeep<PrismaClient>();
// prisma.toilet.findMany.mockResolvedValue([...])
```

---

## 4. Integrationstests (API)

**Datei:** `apps/api/src/modules/ratings/ratings.integration.spec.ts`

Integrationstests starten einen vollständigen NestJS-Test-Modul mit einer
echten PostgreSQL-Test-DB (via Docker Compose) und testen den HTTP-Layer
von Ende zu Ende.

### 4.1 Voraussetzungen

```bash
# Test-Infrastruktur starten:
docker compose -f infra/docker-compose.yml up -d postgres redis

# Test-DB migrieren:
DATABASE_URL="postgresql://klopilot:klopilot@localhost:5444/klopilot_test" \
  npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

### 4.2 Ausführen

```bash
pnpm --filter api test:int
```

### 4.3 Beispiel: Rating-Integrationstest

```typescript
// apps/api/src/modules/ratings/ratings.integration.spec.ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../app.module';

describe('Ratings (integration)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    // Auth via Test-Helper...
  });

  afterAll(() => app.close());

  it('POST /ratings creates rating (authenticated)', async () => {
    const res = await request(app.getHttpServer())
      .post('/ratings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        toiletId: 'test-toilet-id',
        criteria: [{ name: 'cleanliness', flowers: 4, flies: 0 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  it('POST /ratings returns 401 without token', async () => {
    const res = await request(app.getHttpServer()).post('/ratings').send({});
    expect(res.status).toBe(401);
  });

  it('enforces one rating per (user, toilet)', async () => {
    // Zweites Rating → 409 Conflict
    await request(app.getHttpServer())
      .post('/ratings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ toiletId: 'test-toilet-id', criteria: [...] });
    const res = await request(app.getHttpServer())
      .post('/ratings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ toiletId: 'test-toilet-id', criteria: [...] });
    expect(res.status).toBe(409);
  });
});
```

### 4.4 Kritische Integrationspfade

| Bereich     | Testfall                                                      |
| ----------- | ------------------------------------------------------------- |
| Auth        | Magic-Link-Flow, Refresh-Token-Rotation, Cross-Device-Polling |
| Toiletten   | CRUD, Geo-Abfrage `ST_DWithin`, Soft-Delete-Hierarchie        |
| Bewertungen | Erstellen, Bearbeiten, 1-pro-User-Constraint                  |
| Moderation  | Admin: Status-Änderung, Foto-Freigabe; Nicht-Admin: 403       |
| Media       | Upload → EXIF-Entfernung → S3-Speicherung → URL-Rückgabe      |
| Rate-Limit  | 61. Request in 1 min → 429                                    |
| CORS        | Request von `attacker.com` → CORS-Error                       |

---

## 5. E2E-Tests Web (Playwright)

**Framework:** Playwright — Chromium, Firefox, WebKit (Safari-Simulation).

### 5.1 Konfiguration

```bash
# Playwright-Browser installieren (einmalig):
npx playwright install --with-deps

# Tests ausführen (erfordert laufende Web + API):
pnpm test:e2e
```

### 5.2 Kritische E2E-Flows

```typescript
// apps/web/e2e/auth.spec.ts
test('Magic-Link Login', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="login-button"]');
  await page.fill('[data-testid="email-input"]', 'test@klopilot.ch');
  await page.click('[data-testid="send-magic-link"]');
  // E-Mail via Mailhog-API abrufen und Link extrahieren...
  await page.goto(magicLinkUrl);
  await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
});

// apps/web/e2e/map.spec.ts
test('Karte lädt und zeigt Toiletten', async ({ page }) => {
  await page.goto('/karte');
  await page.waitForSelector('.maplibregl-canvas', { timeout: 10000 });
  // Marker-Count prüfen...
});

test('Toilette per Karten-Klick hinzufügen', async ({ page }) => {
  // Login, Karte öffnen, Klick auf leere Fläche,
  // AddToiletSheet erscheint, Formular ausfüllen, Speichern
});
```

### 5.3 E2E-Umgebung

```bash
# Lokal für E2E:
docker compose -f infra/docker-compose.yml up -d
pnpm dev &
# Warten bis Port 3102 erreichbar, dann:
pnpm test:e2e
```

### 5.4 CI-Konfiguration

E2E läuft in GitHub Actions nur auf `main`-Push (nicht bei PRs, zu langsam):

```yaml
# .github/workflows/ci.yml (vereinfacht)
e2e:
  needs: [build]
  if: github.ref == 'refs/heads/main'
  steps:
    - run: docker compose up -d
    - run: pnpm --filter web test:e2e
```

---

## 6. Mobile-Tests (Detox — P3)

**Framework:** Detox für React Native / Expo.

Geplant für Phase P3 (nach Public Beta). Erst dann werden E2E-Tests auf
echten Simulatoren (iOS Simulator, Android Emulator) eingerichtet.

```bash
# Noch nicht eingerichtet (P3):
pnpm --filter mobile test:e2e
```

Detox-Konfiguration: `apps/mobile/.detoxrc.js` (zu erstellen).

---

## 7. CI/CD-Testkette

```
git push →
  1. lint (ESLint, Prettier-Check)
  2. typecheck (tsc --noEmit, alle Pakete)
  3. unit-test (Vitest)
  4. integration-test (API + Test-DB in Docker)
  5. build (Docker Images für API + Web)
  6. e2e (Playwright, nur auf main)
  7. deploy (nur auf main, wenn alles grün)
```

Alle Schritte müssen grün sein bevor Merge (Branch Protection Rules auf `main`
und `develop`).

---

## 8. Testdaten & Seeding

### Seed-Daten (lokal + Test-DB)

```bash
# Standard-Seed:
pnpm db:seed

# Reset + Seed:
pnpm db:reset
```

Seed erstellt:

- 3 Nutzer (`seed@klopilot.ch`, `moderator@klopilot.ch`, `admin@klopilot.ch`)
- 20 Toiletten in Zürich/Bern/Basel mit realistischen Koordinaten
- 30 Bewertungen (zufällig verteilt)
- 5 Fotos (Placeholder)

### Test-Fixtures (Unit/Integration)

```typescript
// packages/shared-types/src/test-fixtures.ts
export const mockToilet = {
  id: 'test-toilet-1',
  name: 'Testtoilette Zürich HB',
  latitude: 47.3784,
  longitude: 8.5403,
  category: 'transport',
  // ...
};

export const mockUser = {
  id: 'test-user-1',
  email: 'test@klopilot.ch',
  role: 'user',
};
```

---

## 9. Coverage-Ziele

| Bereich                       | Aktuell | Ziel MVP | Ziel P2 |
| ----------------------------- | ------- | -------- | ------- |
| API Services (Unit)           | ~60 %   | 70 %     | 80 %    |
| API Controllers (Integration) | ~40 %   | 60 %     | 75 %    |
| Web Components (Unit)         | ~20 %   | 40 %     | 60 %    |
| E2E kritische Flows           | 3       | 8        | 15      |

Coverage-Report lokal:

```bash
pnpm --filter api test -- --coverage --reporter=html
# → apps/api/coverage/index.html öffnen
```

---

## 10. Häufige Probleme & Lösungen

### `prisma generate` fehlt im CI

```yaml
# In CI-Workflow vor typecheck:
- run: npx prisma generate --schema apps/api/prisma/schema.prisma
```

### Husky Pre-Commit schlägt in CI fehl

In CI ist Husky korrekt deaktiviert via:

```bash
HUSKY=0 pnpm install
```

### Playwright findet Elemente nicht

- `data-testid`-Attribute zu fehlenden Elementen hinzufügen.
- `await page.waitForSelector(...)` mit sinnvollem Timeout verwenden.
- Bei Hydration-Problemen: `await page.waitForLoadState('networkidle')`.

### Test-DB nicht erreichbar

```bash
# Docker-Status prüfen:
docker compose ps postgres

# Test-DB direkt verbinden:
psql postgresql://klopilot:klopilot@localhost:5444/klopilot_test
```

---

## 11. Definition of Done — Tests

Bevor ein Feature als fertig gilt:

- [ ] Unit-Tests für neue Service-Logik
- [ ] Mind. 1 Integrationstest für neuen API-Endpoint
- [ ] Negative Testfälle: 401, 403, 404, 409, 422 wo relevant
- [ ] E2E-Test für neue User-Flows (ab P2)
- [ ] Kein `console.error` / `console.warn` in Tests ohne Begründung
- [ ] Test-Fixtures in `shared-types` wenn wiederverwendbar

---

— Stand: v0.3.0 · 2026-05-25 · © 2026 Transivroom Division
