# ADR-0003: OSM-Seed-Import & Karten-Clustering

- **Status:** Akzeptiert
- **Datum:** 2026-06-01

## Kontext

Eine Bewertungsplattform ist ohne Toiletten auf der Karte wertlos. Manuelles
Erfassen skaliert nicht. Gleichzeitig müssen bei europaweiter Abdeckung
zehntausende Marker performant dargestellt werden, ohne dass beim Zoomen die
Marker-Positionen „springen".

## Entscheidung

**Daten-Seed (`apps/api/prisma/seed-osm.ts`):**

- Import öffentlicher `amenity=toilets`-Daten aus **OpenStreetMap** (ODbL) je
  Region/Bounding-Box; bewusster Abstand zu Russland/Belarus.
- `--only=<substring>`-Filter für gezielten (Nach-)Import einzelner Regionen.
- Plausibilitäts-Filter (z. B. Gebühren-Clamp, Kategorie-Normalisierung), um
  OSM-Fehlklassifikationen abzufangen.
- Meilisearch-**Reindex** ist in den Seed-Lauf gebündelt (Voll-Resync).

**Karten-Darstellung (Web, MapLibre):**

- Geclusterte GeoJSON-Quelle (`cluster: true`) statt eines DOM-Markers pro
  Toilette; beim Rauszoomen halbtransparente Cluster-Bubbles mit Anzahl.
- Einzelmarker werden aus einem Pool **nach Toilet-ID** wiederverwendet →
  keine Positionsdrift; Sync auf `idle`-Event statt pro Frame → kein Flackern.
- Ergänzend serverseitige **Viewport-Aggregation** (`GET /toilets/viewport`)
  für exakte Anzahlen pro Bounding-Box/Zoom.

## Konsequenzen

- **+** Sofortige, dichte Abdeckung; reproduzierbarer, regional steuerbarer Seed.
- **+** Flüssiges Zoomen ohne Marker-Sprünge, auch bei ~167 000 Toiletten.
- **−** ODbL-Pflichten (Attribution/Share-Alike) bei Weitergabe abgeleiteter
  Datenbanken — dokumentiert in `LICENSE` / `LICENSE.md`.
- **−** OSM-Datenqualität schwankt regional (dünne Abdeckung z. B. in Teilen
  Nordafrikas); manuelle Community-Beiträge ergänzen das.
