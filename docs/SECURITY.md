# Sicherheit & Datenschutz — klopilot.ch

> **Vorrangiges Designprinzip.** Alle Funktionen werden gegen Sicherheits- und
> Datenschutzanforderungen abgewogen, bevor sie ausgerollt werden. Im Zweifel
> gilt: weniger Daten, mehr Schutz.

## 1. Geltende Rechtsrahmen

- **Schweiz:** revDSG (in Kraft seit 1. September 2023)
- **EU/EWR:** DSGVO (GDPR)
- **UK:** UK GDPR / Data Protection Act 2018
- weitere Regionen je nach Markteintritt (z. B. CCPA / CPRA in Kalifornien)

Verantwortliche Stelle: **Transivroom Division** · admin@4cpa.ch

## 2. Datenminimierung

- Anonymes Browsen ohne Account ist möglich.
- Account benötigt nur eine E-Mail (Magic Link) **oder** einen OAuth-Login.
- Kein verpflichtender Klarname, kein Geburtsdatum, keine Adresse.
- Standortdaten werden nur on-demand erfasst (Knopfdruck "in meiner Nähe") und
  nicht persistiert; serverseitig nur die explizit eingetragene Geo-Position der
  Toilette gespeichert.

## 3. Schutz öffentlich zugänglicher Toiletten-Daten

- Geo-Position öffentlicher Toiletten ist per Definition öffentlich.
- Bei privaten Toiletten **Pflicht-Blur:** Koordinaten werden vor Speicherung
  auf ~100 m Raster gerundet (PostGIS-Trigger). Exakte Adresse nur für
  Eigentümer und explizit eingeladene Nutzer.
- Toiletten-Fotos: **EXIF-Daten werden serverseitig vor Persistierung
  entfernt** (insbesondere GPS-Tags, Kameraserien­nummer, Original-Zeit).
- Personen auf Fotos: Gesichts-Blur empfohlen (manuelle Moderation), Hochladen
  von Personen ohne Einwilligung verboten — siehe Community-Richtlinien.

## 4. Authentifizierung & Autorisierung

- **Passwortlos** als Default (Magic Link). Wenn Passwort, dann Argon2id mit
  Pepper, Mindestlänge 12, kein erzwungener häufiger Wechsel.
- **MFA optional** für Nutzer, **erzwungen** für Moderatoren und Admins.
- **JWT** für API-Zugriffe: kurze TTL (15 min) + Refresh-Token (7 Tage,
  rotierend, in `httpOnly`-Cookie für Web).
- **OAuth-Provider:** Google, Apple. Nur die minimal nötigen Scopes
  (E-Mail, openid, profile).
- **Rollen:** `anon`, `user`, `verified`, `moderator`, `admin` — least privilege.

## 5. Transport- und Speicherverschlüsselung

- TLS 1.3 erzwungen (HSTS, `max-age=63072000; includeSubDomains; preload`).
- Datenbank: TDE/At-Rest-Verschlüsselung (Provider-Standard, z. B. LUKS bei
  Hetzner, native bei Exoscale).
- Object Storage: Server-Side Encryption (AES-256).
- Backups verschlüsselt, getrennte Region. RTO 4 h, RPO 24 h für MVP.

## 6. Geheimnisse

- Keine Secrets im Repo. `.env` in `.gitignore`. Pre-Commit-Hook mit
  `gitleaks` blockiert versehentliche Commits.
- Produktions-Secrets in **GitHub Actions Secrets** und im Hosting-Provider-
  Secret-Store (Hetzner / Fly.io / Doppler).
- Rotation: alle 90 Tage für API-Keys, jährlich für JWT-Pepper.

## 7. Anwendungssicherheit

- **Input-Validierung:** Zod-Schemas auf API-Grenze, kein blindes Vertrauen
  auf Client-Validierung.
- **SQL Injection:** ausschliesslich Prisma + parametrisierte Statements.
- **XSS:** Next.js / React Default-Escape, keine `dangerouslySetInnerHTML`
  ohne explizite Begründung. CSP-Header strikt:
  `default-src 'self'; img-src 'self' data: <maptile-host>; script-src 'self';`
- **CSRF:** SameSite-Lax-Cookies + CSRF-Token für Web-Form-Actions.
- **CORS:** Allowlist (`klopilot.ch`, `*.klopilot.ch`).
- **Rate-Limits:** 60 req/IP/min global; 10 Schreibvorgänge/User/min.
- **Account-Lockout:** nach 5 fehlerhaften Logins exponentielles Backoff,
  nicht ganz sperren (DoS-Schutz).
- **Datei-Uploads:** MIME-Sniff serverseitig, Magic-Number-Check, Größenlimit
  10 MB, Bild-Re-Encoding (entfernt Exploits).
- **NSFW-Klassifikator** (Open-Source-Modell oder Drittanbieter) als Vorab-
  Filter; manuelle Moderation als zweite Stufe.

## 8. Nutzer-Rechte (Auskunft, Löschung, Portabilität)

- Self-Service-Export aller eigenen Beiträge als JSON in den Account-Settings.
- Account-Löschung in 1 Klick: Cascade-Delete der Bewertungen, Anonymisierung
  von Berichten zur Erhaltung der Plattform-Integrität.
- Bearbeitungs-/Korrekturmöglichkeit für eigene Beiträge.
- Auskunftsfrist: 30 Tage (CH/EU), Antwort über admin@4cpa.ch.

## 9. Datenschutz-Folgenabschätzung (DPIA)

- Vor Markteinführung in jeder neuen Region durchzuführen.
- Besonderer Fokus: Foto-Uploads (mögliche Personenabbildungen),
  Privat-Toiletten (Adressdaten Dritter).

## 10. Logging & Observability

- Structured Logs ohne PII. Personenbezogene Felder werden gehasht oder
  weggelassen.
- Sentry für Error-Tracking — Source-Maps separat hochladen, nicht öffentlich.
- Plausible Analytics (cookielose, IP-anonyme Statistik) — keine externen
  Tracker, kein Google Analytics.
- Audit-Log für Admin-/Moderations-Aktionen, 1 Jahr Aufbewahrung.

## 11. Incident Response

- Kontakt: admin@4cpa.ch — auch für `security.txt` unter
  `https://klopilot.ch/.well-known/security.txt`.
- Severity-Stufen S1–S4 mit Reaktionszeiten 1 h / 4 h / 1 Tag / 1 Woche.
- Disclosure-Policy: 90 Tage Coordinated Disclosure für Sicherheitsforscher.
- Datenpannen-Meldung an EDÖB / zuständige Aufsicht innerhalb 72 h.

## 12. Drittanbieter

| Anbieter | Zweck | Datenfluss | Rechtsgrundlage |
|---|---|---|---|
| MapTiler / Esri | Karten-Tiles | IP, Tile-Anfrage | berechtigtes Interesse |
| Google / Apple | OAuth-Login | E-Mail (vom Nutzer) | Vertrag (Auftragsverarb.) |
| DeepL | Übersetzung von Reviews on demand | Review-Text | Einwilligung |
| Sentry | Fehler-Telemetrie | Stacktrace ohne PII | berechtigtes Interesse |
| Plausible | Analytics (anonym) | aggregierte Statistik | berechtigtes Interesse |
| Cloudflare | CDN/WAF | IP, Request | berechtigtes Interesse |

Auftragsverarbeitungs-Verträge (DPA) mit allen oben genannten Anbietern.

## 13. Was wir **nicht** tun

- **Keine Werbung an Endnutzer** auf der Plattform.
- **Kein Verkauf von Nutzerdaten.**
- **Kein Tracking** über Drittanbieter-Cookies.
- **Kein Verfolgen** von Nutzern durch die App, wenn nicht aktiv genutzt.

## 14. Continuous Security

- Dependabot / Renovate für Dependency-Updates.
- `pnpm audit` im CI.
- SAST: `semgrep` oder GitHub CodeQL im PR-Workflow.
- Penetration-Test vor Public Beta (P3) durch externes Team.

— Stand: P1-Initial · v0.1.0 · © 2026 Transivroom Division
