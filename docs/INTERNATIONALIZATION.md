# Internationalisierung (i18n) — klopilot.ch

> klopilot ist in **31 Sprachen** verfügbar, inklusive zweier Rechts-nach-links-
> Sprachen (Arabisch, Hebräisch). Diese Datei beschreibt, wie das i18n-System
> aufgebaut ist und wie man eine Sprache hinzufügt oder ändert.

---

## 1. Überblick

| Aspekt              | Umsetzung                                                              |
| ------------------- | ---------------------------------------------------------------------- |
| Bibliothek          | [i18next](https://www.i18next.com/) + `react-i18next` (clientseitig)   |
| Quelle der Wahrheit | `packages/i18n/src/locales/<code>.json` + `packages/i18n/src/index.ts` |
| Referenz-Locale     | `de.json` (Deutsch) — alle anderen müssen deckungsgleich sein          |
| Default / Fallback  | `de`                                                                   |
| Persistenz          | `localStorage["klo-language"]`                                         |
| Deep-Links          | `?lang=<code>` (bzw. `?lng=`) hat Vorrang vor localStorage             |
| RTL                 | `RTL_LOCALES = ['ar', 'he', 'ckb', 'sdh', 'hac']` → `<html dir="rtl">` |

### Unterstützte Sprachen (37)

`de` `fr` `it` `en` `es` `pt` `da` `sv` `no` `fi` `nl` `is` `el`
`pl` `cs` `sk` `hu` `ro` `bg` `et` `lv` `lt` `uk` `mk` `sl` `hr` `sr` `bs` `sq`
`tr`
`kmr` (Kurmancî) `zza` (Zazakî) — Latein/LTR
**`ar`** **`he`** **`ckb`** (Soranî) **`sdh`** (Südkurdisch) **`hac`** (Goranî) (RTL)

> Hinweis: Codes sind meist 2-stellig (ISO 639-1), die kurdischen Varietäten
> 3-stellig (ISO 639-3). Das Frontend nutzt dafür `normalizeLocale()` aus
> `@klopilot/i18n` (voller Code → 2-Buchstaben-Präfix → Default) statt fester
> `slice(0, 2)`-Logik. `zza`/`sdh`/`hac` sind aktuell von der nächsten
> verlässlichen Varietät (`kmr` bzw. `ckb`) abgeleitet — Native-Review offen.

Die geografische Abdeckung der importierten Toiletten-Daten reicht von West-/
Nordeuropa über Mittel-/Osteuropa und den Balkan bis zum Mittelmeerraum
(Nordafrika-Küste, Levante, Israel).

---

## 2. Dateien

```
packages/i18n/src/
├── index.ts                 # Exporte: alle Locales, SUPPORTED_LOCALES,
│                            #          RTL_LOCALES, Locale-Typ, DEFAULT_LOCALE
└── locales/
    ├── de.json              # Referenz
    ├── en.json
    └── … (31 Dateien)
```

`apps/web/lib/i18n.ts` initialisiert i18next mit allen Ressourcen und enthält
`detectInitialLang()` (URL → localStorage → Default) sowie `applyDir()` für das
`<html dir/lang>`-Attribut. `apps/web/components/ui/I18nProvider.tsx` ruft
`applyDir()` **nach der Hydration** (im Effect) und bei `languageChanged` auf —
sonst überschreibt React das `<html>`-Element wieder.

---

## 3. Eine Sprache hinzufügen

1. **Locale-Datei anlegen:** `packages/i18n/src/locales/<code>.json` als Kopie von
   `de.json` erstellen und alle Werte übersetzen. **Schlüssel und `{{platzhalter}}`
   müssen exakt erhalten bleiben** (z. B. `{{query}}`, `{{langCount}}`).
2. **In `index.ts` registrieren:** Import + Re-Export ergänzen, den Code zu
   `Locale`, `SUPPORTED_LOCALES`, `LOCALES`, `OG_LOCALES` (und bei RTL zu
   `RTL_LOCALES`) hinzufügen. Bei arabischer Schrift zusätzlich zu
   `OG_STATIC_LOCALES` (siehe Schritt 5).
3. **In `apps/web/lib/i18n.ts`** den Import + den `resources`-Eintrag ergänzen.
4. **Sprach-Picker:** Eintrag in `apps/web/components/landing/Navbar.tsx`
   (`LANG_OPTIONS`) und `Footer.tsx` (`LANGS`) hinzufügen.
5. **OG-Vorschaubild:** Latein-/Kyrillisch-/Griechisch-/Hebräisch-Schrift rendert
   dynamisch über `app/api/og` — nichts zu tun. **Arabische Schrift** crasht in
   Satori; den Code zu `OG_STATIC_LOCALES` hinzufügen und
   `node apps/web/scripts/generate-og-static.mjs` ausführen (erzeugt
   `public/og/og-<code>.png`).
6. **Test ausführen:** `pnpm --filter api test -- src/common/i18n-locales.spec.ts`
   — schlägt fehl, sobald Schlüssel oder Platzhalter abweichen.

> Die Sprachenzahl auf der Landing-Page ist dynamisch (`SUPPORTED_LOCALES.length`)
> und muss **nicht** manuell angepasst werden.

---

## 4. RTL (Arabisch / Hebräisch)

- Ein Code in `RTL_LOCALES` setzt `document.documentElement.dir = 'rtl'`.
- Tailwind-/CSS-Layouts sollten möglichst logische Eigenschaften nutzen
  (`margin-inline`, `padding-inline`) statt fixer `left/right`-Werte.
- Marken-Token wie `klopilot.ch` bleiben LTR und werden innerhalb des
  RTL-Containers korrekt dargestellt.

---

## 5. Integritätstest

`apps/api/src/common/i18n-locales.spec.ts` stellt sicher, dass

- es für jede `SUPPORTED_LOCALE` genau eine Locale-Datei gibt (und keine Waisen),
- jede Locale **dieselbe Schlüsselmenge** wie `de.json` besitzt,
- die `{{platzhalter}}` je Schlüssel identisch sind,
- `RTL_LOCALES` eine Teilmenge von `SUPPORTED_LOCALES` ist.

Der Test läuft im normalen `pnpm test` / CI mit.

---

— Stand: v0.6.0 · 2026-06-01 · © 2026 Transivroom Division
