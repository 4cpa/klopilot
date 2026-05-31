# ADR-0002: Produktions-Hosting bei Infomaniak (CH)

- **Status:** Akzeptiert
- **Datum:** 2026-06-01

## Kontext

klopilot verarbeitet personenbezogene Daten (Konten, Bewertungen, Fotos) und
unterliegt revDSG (CH) und DSGVO (EU/EWR). Frühere Dokumente nannten Hetzner
(DE) als Hosting. Für maximale Datenschutz-Klarheit und ein einheitliches
Schutzniveau wurde ein rein schweizerischer Anbieter gewählt.

## Entscheidung

- Produktions-Hosting bei **Infomaniak Network SA** (Genf, Schweiz); Server und
  Daten **ausschliesslich in der Schweiz**.
- Deployment unverändert: GitHub Actions → GHCR → SSH-Deploy auf den VPS,
  Docker Compose (`docker-compose.prod.yml`), Traefik v3 + Let's Encrypt.
- Datenschutzrechtlich: Für EU/EWR-Nutzer greift der **Angemessenheitsbeschluss**
  der EU-Kommission für die Schweiz; SCC nur für etwaige Drittland-Ausnahmen.

## Konsequenzen

- **+** Einheitliches CH-Datenschutzniveau, einfache Argumentation in Impressum/
  Datenschutz, keine EU-Server-Sonderfälle.
- **+** Anbieter mit Schwerpunkt Datenschutz/Nachhaltigkeit (CH).
- **−** Produktnamen/Konsole unterscheiden sich von Hetzner (Doku angepasst:
  `manager.infomaniak.com`).
- Folge-Aufgabe: Backups/Object-Storage-Secondary auf Infomaniak Swiss Backup
  prüfen (siehe `DEPLOYMENT.md`).
