# ADR-0001: i18n — 31 Sprachen mit RTL-Unterstützung

- **Status:** Akzeptiert
- **Datum:** 2026-06-01

## Kontext

klopilot startete mit DE/FR/IT/EN und wurde schrittweise auf ganz Europa,
den Balkan, Osteuropa und den Mittelmeerraum ausgeweitet. Damit entstand der
Bedarf nach Sprachen mit nicht-lateinischer Schrift und Rechts-nach-links-
Darstellung (Arabisch, Hebräisch). Die Übersetzungen sollen wartbar bleiben
und nicht stillschweigend auseinanderdriften.

## Entscheidung

- Clientseitiges **i18next + react-i18next**; Übersetzungen als JSON unter
  `packages/i18n/src/locales/<code>.json`, Single Source of Truth ist
  `de.json`.
- Sprachwahl: `?lang=`-Query > `localStorage` > Default `de`. Damit sind
  teilbare Vorschaulinks pro Sprache möglich.
- **RTL** über `RTL_LOCALES = ['ar', 'he']`; `<html dir/lang>` wird **nach der
  Hydration** im `I18nProvider`-Effect gesetzt, um Re-Konziliierung durch React
  zu vermeiden.
- Sprachabhängige Zähler (z. B. „N Sprachen") werden dynamisch aus
  `SUPPORTED_LOCALES.length` über `{{langCount}}` interpoliert — kein
  hartkodierter Wert.
- Ein Integritätstest erzwingt deckungsgleiche Schlüssel + Platzhalter.

## Konsequenzen

- **+** Neue Sprache = JSON-Datei + Registrierung; Zähler aktualisieren sich selbst.
- **+** Kaputte Übersetzungen (fehlender Schlüssel / Platzhalter) brechen das CI.
- **−** Clientseitige Übersetzung: Texte sind nicht serverseitig vorgerendert
  (für eine Marketing-/App-Seite akzeptabel).
- **−** RTL erfordert Layout-Disziplin (logische CSS-Eigenschaften statt left/right).

Siehe `docs/INTERNATIONALIZATION.md`.
