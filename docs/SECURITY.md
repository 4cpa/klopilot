# Sicherheit & Datenschutz — klopilot.ch

> **Vorrangiges Designprinzip.** Alle Funktionen werden gegen Sicherheits- und
> Datenschutzanforderungen abgewogen, bevor sie ausgerollt werden. Im Zweifel
> gilt: weniger Daten, mehr Schutz.

Sicherheitslücken bitte **nicht** als öffentliches Issue melden, sondern
vertraulich an **admin@4cpa.ch** — wir folgen einer 90-Tage-Coordinated-
Disclosure-Policy für Sicherheitsforscher.

---

## 1. Geltende Rechtsrahmen

- **Schweiz:** revDSG (in Kraft seit 1. September 2023)
- **EU/EWR:** DSGVO (GDPR)
- **UK:** UK GDPR / Data Protection Act 2018
- weitere Regionen je nach Markteintritt (z. B. CCPA / CPRA in Kalifornien)

Verantwortliche Stelle: **Transivroom Division** · admin@4cpa.ch

---

## 2. Datenminimierung

- Anonymes Browsen ohne Account ist möglich.
- Account benötigt nur eine E-Mail (Magic Link) **oder** einen OAuth-Login.
- Kein verpflichtender Klarname, kein Geburtsdatum, keine Adresse.
- Standortdaten werden nur on-demand erfasst (Knopfdruck "in meiner Nähe") und
  nicht persistiert; serverseitig nur die explizit eingetragene Geo-Position der
  Toilette gespeichert.

---

## 3. Schutz öffentlich zugänglicher Toiletten-Daten

- Geo-Position öffentlicher Toiletten ist per Definition öffentlich.
- Bei privaten Toiletten **Pflicht-Blur:** Koordinaten werden vor Speicherung
  auf ~100 m Raster gerundet (PostGIS-Trigger). Exakte Adresse nur für
  Eigentümer und explizit eingeladene Nutzer.
- Toiletten-Fotos: **EXIF-Daten werden serverseitig vor Persistierung
  entfernt** (Sharp-Pipeline, insbesondere GPS-Tags, Kameraserie, Originalzeit).
- Personen auf Fotos: Gesichts-Blur empfohlen (manuelle Moderation); Hochladen
  von Personen ohne Einwilligung verboten — siehe Community-Richtlinien.

---

## 4. Authentifizierung & Autorisierung

### 4.1 Magic Link (primärer Kanal)

1. Client sendet `POST /auth/magic-link` mit E-Mail und einer zufälligen
   `sessionId` (UUID v4, client-seitig generiert).
2. API legt `magic:<token>` (TTL 15 min) und `session:<sessionId>` in Redis an.
3. Mailhog (lokal) / SMTP (prod) sendet einen einmaligen Link.
4. Nach Klick auf den Link: Token wird in Redis gelöscht, `accessToken` kurz
   unter `session:<sessionId>:token` hinterlegt (TTL 60 s).
5. Wartender Browser pollt `GET /auth/poll?sessionId=` alle 3 s und bekommt den
   Token zurück (Cross-Device-Login ohne manuelle Eingabe).

### 4.2 JWT

- **Access-Token:** 15 min TTL, enthält `{ sub: userId, role }`.
  - `role` im Payload: Guards müssen nicht für jede Anfrage die DB befragen.
- **Refresh-Token:** 7 Tage TTL, rotierend, in `httpOnly`-Cookie für Web,
  Secure-Flag auf Prod. Mobile speichert im SecureStore.
- `POST /auth/refresh` rotiert das Refresh-Token (altes wird invalidiert).

### 4.3 OAuth (Google / Apple)

- Scopes: nur `email`, `openid`, `profile`.
- State-Parameter gegen CSRF.

### 4.4 Rollen (Least Privilege)

| Rolle       | Beschreibung                                                        |
| ----------- | ------------------------------------------------------------------- |
| `anon`      | Lesen, Karte, Suche                                                 |
| `user`      | + Toilette erstellen, Bewertung, Foto-Upload                        |
| `verified`  | + Verifizierter Beitrag (Badge)                                     |
| `moderator` | + Foto-Moderation, Reports, Toiletten-Verwaltung                    |
| `admin`     | + Alle Moderator-Rechte, Nutzer-Verwaltung, Status `removed` setzen |

Guards prüfen `request.user.role` (aus JWT-Payload) — kein DB-Lookup nötig.
Für destruktive Admin-Aktionen wird zusätzlich ein DB-Lookup gemacht um
aktuellen Rollenstatus zu verifizieren (JWT könnte noch gültig sein nach
Rolle-Downgrade).

### 4.5 Soft-Delete-Hierarchie

| Aktion                     | Wer                   | Status                |
| -------------------------- | --------------------- | --------------------- |
| Eigene Toilette ausblenden | `user` (Ersteller)    | `hidden` (reversibel) |
| Admin-Löschung             | `admin` / `moderator` | `removed` (dauerhaft) |

`removed` ist in der öffentlichen API nicht sichtbar (WHERE-Klausel).
`hidden` ist nur für den Ersteller und Admins sichtbar.

---

## 5. Transport- und Speicherverschlüsselung

- TLS 1.3 erzwungen (HSTS, `max-age=63072000; includeSubDomains; preload`).
- Traefik v3 verwaltet Let's-Encrypt-Zertifikate automatisch.
- Datenbank: TDE/At-Rest-Verschlüsselung (LUKS bei Infomaniak, CH).
- Object Storage: Server-Side Encryption (AES-256, MinIO / S3).
- Backups verschlüsselt, getrennte Region. RTO 4 h, RPO 24 h für MVP.

---

## 6. Geheimnisse

- Keine Secrets im Repo. `.env` in `.gitignore`. Pre-Commit-Hook mit
  `gitleaks` blockiert versehentliche Commits.
- Produktions-Secrets in **GitHub Actions Secrets** (CI/CD) und `.env.prod`
  auf dem VPS (nur `deploy`-User lesbar).
- Rotation: alle 90 Tage für API-Keys, jährlich für JWT-Pepper.

Kritische Secrets (Prod):

| Variable               | Zweck                                |
| ---------------------- | ------------------------------------ |
| `JWT_SECRET`           | JWT-Signatur (≥ 256 Bit, base64)     |
| `DATABASE_URL`         | PostgreSQL-Verbindung inkl. Passwort |
| `S3_KEY` / `S3_SECRET` | MinIO / S3 Object Storage            |
| `MEILI_KEY`            | Meilisearch Master-Key               |
| `MAIL_PASS`            | SMTP-Passwort für Magic-Link-Versand |
| `OAUTH_GOOGLE_SECRET`  | Google OAuth Client-Secret           |
| `OAUTH_APPLE_KEY`      | Apple Sign-In Private Key            |

---

## 7. Anwendungssicherheit

### 7.1 Input-Validierung

- **Zod-Schemas** an jeder API-Grenze (NestJS Pipe + `shared-types` Package).
- Kein blindes Vertrauen auf Client-Validierung.

### 7.2 Injection-Schutz

- **SQL Injection:** ausschliesslich Prisma + parametrisierte Statements.
  Kein Raw-SQL ohne explizite Begründung und Sanitisierung.
- **NoSQL / Redis:** nur einfache Key-Value-Operationen, keine User-Inputs als Keys
  ohne Prefix + Sanitisierung.

### 7.3 XSS

- Next.js / React Standard-Escape überall.
- `dangerouslySetInnerHTML` ist verboten ohne Code-Review-Annotation.
- **CSP-Header (Prod):**
  ```
  default-src 'self';
  img-src 'self' data: blob: *.maptiler.com *.arcgisonline.com;
  script-src 'self' 'unsafe-inline';
  connect-src 'self' api.klopilot.ch *.maptiler.com;
  style-src 'self' 'unsafe-inline';
  ```

### 7.4 CSRF

- SameSite-Lax-Cookies.
- Refresh-Token-Endpoint: `SameSite=Strict`.

### 7.5 CORS

Allowlist in `AppModule`:

```
klopilot.ch
www.klopilot.ch
api.klopilot.ch
localhost:3102  (dev)
```

### 7.6 Rate-Limiting

- Global: **60 req / IP / Minute** (Redis Token Bucket, `nestjs-throttler`).
- Schreibvorgänge: **10 req / User / Minute**.
- Magic-Link-Versand: **3 Mails / E-Mail / 10 Minuten** (Spam-Schutz).

### 7.7 Datei-Uploads

- MIME-Sniff serverseitig (Magic-Number-Check).
- Größenlimit: **10 MB** pro Datei.
- Bild-Re-Encoding via **Sharp** (entfernt EXIF, Steganografie, potenzielle
  Exploit-Payloads im Bild-Header).
- Nur `image/jpeg`, `image/png`, `image/webp` erlaubt.

### 7.8 Moderation

- **NSFW-Klassifikator** (intern oder Drittanbieter) als Vorab-Filter beim
  Upload — Fotos mit Score > Schwellwert landen in `pending`-Queue.
- Manuelle Review durch Moderatoren (Admin-Panel `/admin`).
- Profanitätsfilter auf Freitext-Felder (Name, Adresse, Beschreibung).

---

## 8. Admin-Panel-Sicherheit

- Route-Guard: `/admin` leitet Nicht-Admins / Nicht-Moderatoren sofort auf `/`
  weiter (client-seitig).
- API-Endpoints unter `/moderation/*` sind mit `@Roles('admin', 'moderator')`
  geschützt und prüfen JWT-Rolle.
- Alle Admin-Aktionen werden im Audit-Log erfasst (wer, was, wann).

---

## 9. Nutzer-Rechte (Auskunft, Löschung, Portabilität)

- Self-Service-Export aller eigenen Beiträge als JSON in den Account-Settings.
- Account-Löschung in 1 Klick: Cascade-Delete der Bewertungen, Anonymisierung
  von Berichten zur Erhaltung der Plattform-Integrität.
- Bearbeitungs-/Korrekturmöglichkeit für eigene Beiträge.
- Auskunftsfrist: 30 Tage (CH/EU). Anfragen an admin@4cpa.ch.

---

## 10. Datenschutz-Folgenabschätzung (DPIA)

- Vor Markteinführung in jeder neuen Region durchzuführen.
- Besonderer Fokus: Foto-Uploads (mögliche Personenabbildungen),
  Privat-Toiletten (Adressdaten Dritter).

---

## 11. Logging & Observability

- **Structured Logs** (JSON) ohne PII. Personenbezogene Felder werden gehasht
  oder weggelassen (E-Mail → Hash, IP → anonymisiert nach `/24`).
- **Sentry** für Error-Tracking — Source-Maps separat hochladen, nicht öffentlich.
- **Plausible Analytics** (cookielos, IP-anonym) — kein Google Analytics,
  keine Drittanbieter-Tracking-Cookies.
- **Audit-Log** für Admin-/Moderations-Aktionen, 1 Jahr Aufbewahrung.

---

## 12. Incident Response

- Kontakt: **admin@4cpa.ch** — auch für `security.txt` unter
  `https://klopilot.ch/.well-known/security.txt`.

| Severity | Beschreibung                      | Reaktionszeit |
| -------- | --------------------------------- | ------------- |
| S1       | RCE, vollständiger Datenleak      | 1 Stunde      |
| S2       | Auth-Bypass, Privilege Escalation | 4 Stunden     |
| S3       | Datenleak einzelner Nutzer, XSS   | 1 Werktag     |
| S4       | CSRF, Informationsleck            | 1 Woche       |

- Datenpannen-Meldung an EDÖB / zuständige Aufsicht innerhalb **72 Stunden**.
- Disclosure-Policy: 90 Tage Coordinated Disclosure für Sicherheitsforscher.

---

## 13. Drittanbieter

| Anbieter        | Zweck                        | Datenfluss            | Rechtsgrundlage           |
| --------------- | ---------------------------- | --------------------- | ------------------------- |
| MapTiler / Esri | Karten-Tiles                 | IP, Tile-Anfrage      | berechtigtes Interesse    |
| Google          | OAuth-Login, (optional Maps) | E-Mail                | Vertrag (Auftragsverarb.) |
| Apple           | OAuth-Login                  | E-Mail                | Vertrag (Auftragsverarb.) |
| Infomaniak (CH) | VPS-Hosting (CH)             | Alle Server-Daten     | Vertrag (Auftragsverarb.) |
| DeepL           | Übersetzung on demand        | Review-Text           | Einwilligung              |
| Sentry          | Fehler-Telemetrie            | Stacktrace ohne PII   | berechtigtes Interesse    |
| Plausible       | Analytics (anonym)           | aggregierte Statistik | berechtigtes Interesse    |

Auftragsverarbeitungs-Verträge (DPA) mit allen oben genannten Anbietern abzuschliessen.

---

## 14. Was wir **nicht** tun

- **Keine Werbung an Endnutzer** auf der Plattform.
- **Kein Verkauf von Nutzerdaten.**
- **Kein Tracking** über Drittanbieter-Cookies.
- **Kein Verfolgen** von Nutzern durch die App, wenn nicht aktiv genutzt.
- **Keine Klartext-Passwörter** — auch nicht gehasht ohne Pepper.

---

## 15. Continuous Security

- **Dependabot / Renovate** für automatische Dependency-Updates.
- **`pnpm audit`** im CI-Workflow (schlägt bei High/Critical fehl).
- **SAST:** GitHub CodeQL im PR-Workflow.
- **gitleaks** als Pre-Commit-Hook (Secret-Scanning).
- **Penetration-Test** vor Public Beta (P3) durch externes Team.

---

— Stand: v0.3.0 · 2026-05-25 · © 2026 Transivroom Division
