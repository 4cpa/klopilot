# Design-System klopilot.ch

> **Tonalität:** frech, farbenfroh, lebensbejahend — mit dunklen Akzenten, die
> Tiefe und Premium-Anmutung geben. Kein steriler Behörden-Look, kein knalliger
> Werbe-Trash. Selbstbewusst, augenzwinkernd, international anschlussfähig.

## 1. Designprinzipien

1. **Mut zur Farbe.** klopilot ist kein graues Tool — die Mission ist freundlich, also auch das UI.
2. **Dunkel-Modus first-class.** Dark-Theme ist gleichwertig, nicht nur "ausgegraut".
3. **Symbol vor Text, wenn möglich.** Blümchen und Fliegen tragen die Bewertung visuell.
4. **Karte hat Vorrang.** UI-Chrome darf die Satellitenkarte nie erschlagen.
5. **Barrierefrei.** WCAG 2.1 AA als Mindestanforderung, AAA wo möglich.
6. **International.** Keine kulturell engen Bilder oder Idiome.

## 2. Farb-Tokens

### Marken-Palette (Light)

| Token               | Hex       | Verwendung                                   |
| ------------------- | --------- | -------------------------------------------- |
| `--brand-primary`   | `#FF6B35` | Akzent, primäre Buttons, Marker              |
| `--brand-secondary` | `#FFD23F` | sekundär, Highlights, "Nette Toilette"-Badge |
| `--brand-deep`      | `#0B132B` | Headerschrift, dunkle Flächen                |
| `--brand-mint`      | `#06D6A0` | "frisch", positive States                    |
| `--brand-berry`     | `#EF476F` | Warnungen, Fliegen-Akzent                    |
| `--brand-sky`       | `#118AB2` | Info, sekundärer Karten-Akzent               |
| `--paper`           | `#FFFBF2` | App-Hintergrund                              |
| `--cream`           | `#FFF3DC` | Karten-Flächen                               |
| `--ink`             | `#0B132B` | Primärtext                                   |
| `--muted`           | `#6B7280` | Sekundärtext                                 |
| `--line`            | `#E7E0CF` | Trennlinien                                  |

### Marken-Palette (Dark)

| Token               | Hex       | Verwendung                         |
| ------------------- | --------- | ---------------------------------- |
| `--bg`              | `#0E1117` | App-Hintergrund                    |
| `--surface`         | `#161B22` | Karten, Sheets                     |
| `--surface-2`       | `#1F2630` | erhöhte Flächen                    |
| `--ink`             | `#F4EFE6` | Primärtext                         |
| `--muted`           | `#9AA4B2` | Sekundärtext                       |
| `--line`            | `#2A313C` | Trennlinien                        |
| `--brand-primary`   | `#FF8B5C` | aufgehellt für Kontrast auf Dunkel |
| `--brand-secondary` | `#FFE066` | aufgehellt                         |
| `--brand-mint`      | `#3FE8B7` | aufgehellt                         |
| `--brand-berry`     | `#FF6B8A` | aufgehellt                         |

### Bewertungs-Farben (beide Themes)

| Token              | Hex                                  | Bedeutung          |
| ------------------ | ------------------------------------ | ------------------ |
| `--rate-flower`    | `#E91E63` (Light) / `#FF7AB3` (Dark) | Blümchen-Symbol    |
| `--rate-flower-bg` | `#FFE4EE` / `#3A1929`                | Hintergrund-Tönung |
| `--rate-fly`       | `#374151` (Light) / `#9AA4B2` (Dark) | Fliege-Symbol      |
| `--rate-fly-bg`    | `#F3F4F6` / `#1F2630`                | Hintergrund-Tönung |

### Kontrastregeln

- Primärtext auf Hintergrund ≥ 7:1 (WCAG AAA Body), mind. 4.5:1.
- UI-Elemente und Buttons ≥ 3:1 zur Umgebung.
- **`--brand-primary`/`--brand-mint`/`--brand-secondary`/`--brand-berry`/`--brand-sky`
  sind Akzent-/Grafikfarben (Marker, Logo, grosse Flächen) — als Fliesstext oder
  als Button-Hintergrund mit weisser Schrift erreichen sie in Light-Mode
  **nicht** 4.5:1 (z. B. `--brand-primary` auf `--paper` nur 2.75:1).**
  Für diese zwei Fälle gibt es in `apps/web/app/globals.css` dedizierte,
  geprüfte Tokens:
  - `--score-*-text` (`primary`/`secondary`/`mint`/`berry`/`sky`) + `--rate-flower-text`
    — für freistehenden farbigen Text/Icons auf `--paper`/`--surface`.
  - `--score-*-solid` + `--btn-primary-bg` — für Flächen mit weisser Schrift
    (Buttons, Marker-Pins, Badges); bewusst themenunabhängig (ein Wert für
    Light/Dark), da Weiss-auf-Farbe kontrastseitig nicht vom Papierton abhängt.
  - `--error-text` — Fehlermeldungen (ersetzt direktes `--brand-berry`).
  - Der globale `:focus-visible`-Ring nutzt ebenfalls `--btn-primary-bg`
    (nicht `--brand-primary`), da auch der Fokus-Ring selbst die 3:1-Regel
    für UI-Elemente erfüllen muss.

## 3. Typografie

- **Display / Headlines:** _Fraunces_ (Variable, italic optisch erlaubt) — frech, charakterstark.
- **UI / Body:** _Inter_ (Variable) — neutrale, sehr gute Lesbarkeit.
- **Mono:** _JetBrains Mono_ — Codeblöcke, technische Werte.

Skalen:

| Stufe     | Größe        | Zeilenhöhe | Anwendung           |
| --------- | ------------ | ---------- | ------------------- |
| `display` | 56 / 44 / 36 | 1.05       | Hero-Titel          |
| `h1`      | 32           | 1.15       | Seitentitel         |
| `h2`      | 24           | 1.2        | Abschnitte          |
| `h3`      | 20           | 1.3        | Karten-Titel        |
| `body-lg` | 18           | 1.5        | Hauptlesetext mobil |
| `body`    | 16           | 1.5        | Lesetext            |
| `caption` | 13           | 1.4        | Meta, Labels        |
| `mono`    | 14           | 1.45       | Codeblöcke          |

## 4. Spacing, Radius, Schatten

- Spacing-Skala (px): 2, 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Radius: `xs=4`, `sm=8`, `md=12`, `lg=16`, `xl=24`, `pill=999`.
- Schatten Light: `0 6px 24px rgba(15, 23, 42, .06)` für Karten, etwas tiefer für Sheets.
- Schatten Dark: `0 6px 24px rgba(0, 0, 0, .35)`.

## 5. Komponenten-Inventar (MVP)

- AppBar / NavBar (Web + Mobile-Tabs)
- MapView mit Marker-Clustern
- ToiletCard (Listenitem mit Mini-Score)
- RatingControl (Blümchen/Fliegen-Slider 0–5 pro Kriterium)
- ScoreBar (gestapelter Balken: Blümchen vs. Fliegen)
- PhotoUploader (mit EXIF-Strip-Hinweis)
- FilterSheet (Bottom-Sheet mit Chips)
- ReportButton (Meldung)
- LocaleSwitcher
- ThemeSwitch (Light / Dark / System)
- ToastsToasts, EmptyStates, Skeletons

## 6. Symbol-Sprache

- 🌸 **Blümchen:** stilisiertes 5-blättriges Blütensymbol, Mark `flower-icon.svg`. Farbverlauf rosa→koralle.
- 🪰 **Fliege:** stilisiert, asymmetrisch, leicht augenzwinkernd. Farbe Anthrazit; im Dark Theme leicht aufgehellt.
- Marker auf Karte: runder Pin in `--brand-primary` mit Score-Zahl, Cluster in `--brand-deep`.
- "Nette Toilette"-Badge: gelbes Schleifchen mit Häkchen.

## 7. Tonality der Texte

- **Direkt, knapp, freundlich.** "Wir" statt formelles "Sie" (auf Deutsch optional je Locale-Setting).
- Kein Toiletten-Humor unter der Gürtellinie. Augenzwinkern ja, peinlich nein.
- Mehrsprachig konsistent — niemals ein Idiom, das nur in einer Sprache funktioniert.

## 8. Beispiel-Tokens als CSS / Tailwind

Datei `packages/ui/tokens.css` (extrahiert von Web-Build und Mobile via `unistyles`):

```css
:root {
  --brand-primary: #ff6b35;
  --brand-secondary: #ffd23f;
  --brand-deep: #0b132b;
  --brand-mint: #06d6a0;
  --brand-berry: #ef476f;
  --brand-sky: #118ab2;
  --paper: #fffbf2;
  --cream: #fff3dc;
  --ink: #0b132b;
  --muted: #6b7280;
  --line: #e7e0cf;
  --rate-flower: #e91e63;
  --rate-flower-bg: #ffe4ee;
  --rate-fly: #374151;
  --rate-fly-bg: #f3f4f6;
  --radius-md: 12px;
  --radius-lg: 16px;
  --shadow-card: 0 6px 24px rgba(15, 23, 42, 0.06);
}
:root[data-theme='dark'] {
  --paper: #0e1117;
  --cream: #161b22;
  --ink: #f4efe6;
  --muted: #9aa4b2;
  --line: #2a313c;
  --brand-primary: #ff8b5c;
  --brand-secondary: #ffe066;
  --brand-mint: #3fe8b7;
  --brand-berry: #ff6b8a;
  --rate-flower: #ff7ab3;
  --rate-flower-bg: #3a1929;
  --rate-fly: #9aa4b2;
  --rate-fly-bg: #1f2630;
  --shadow-card: 0 6px 24px rgba(0, 0, 0, 0.35);
}
```

## 9. Accessibility-Checkliste

- [x] Alle interaktiven Elemente haben einen sichtbaren `:focus-visible`-Stil
      (kontrastgeprüft, ≥ 3:1 — siehe Kontrastregeln oben).
- [x] Mindest-Touch-Target 44×44 px (WCAG 2.5.5) für Dialog-Schliessen-Buttons
      und die Blümchen/Fliegen-Wertetasten. Kleinere, eng gepackte Toolbar-Icons
      (Theme-Switch, Hilfe-Button, Karten-Kompass) liegen bei 24–42 px — WCAG
      2.5.8 (AA, ≥24 px) ist erfüllt, AAA (44 px) hier bewusst noch offen
      (Layout-Risiko in dicht gepackten Leisten).
- [x] Kein "Nur-Farbe"-Status — Symbole oder Text begleiten jede Farbsignal.
- [x] Reduzierte Bewegung: `prefers-reduced-motion` respektieren (keine grossen Animationen).
- [x] Screenreader-Labels für Blümchen-/Fliegen-Slider ("Sauberkeit, Blümchen, 4 von 5"),
      als echte `role="radiogroup"`/`role="radio"`-Struktur mit Pfeiltasten-Navigation
      (`components/ui/RatingSlider.tsx`).
- [x] Sprache der Seite per `<html lang="...">` und Locale-Switch (client-seitig
      nach Hydration — SSR liefert immer `lang="de"` bis der Locale-Switch greift;
      bekannte Lücke, siehe ADR-0004).
- [x] Fokus-Falle + Fokus-Rückgabe + Escape für alle Dialoge/Sheets
      (`apps/web/lib/useFocusTrap.ts`); Kartenhintergrund wird per `inert`
      unerreichbar, solange ein Dialog offen ist.
- [x] Formularfehler sind per `aria-describedby`/`aria-invalid`/`role="alert"`
      mit ihrem Feld verknüpft und werden angekündigt.
- [x] Kartenmarker/-cluster per Tab **und** Leertaste bedienbar (nicht nur Enter);
      `aria-label` enthält Name, Bewertung und Zugänglichkeit, nicht nur den Namen.
- [x] Listenansicht (📋 auf `/karte`) als vollwertige, nicht-räumliche Alternative
      zum Kartenbrowsing für Screenreader-Nutzer:innen (`ToiletListPanel.tsx`).
- [x] Pinch-Zoom auf `/karte` bleibt erlaubt (kein `maximumScale`/`userScalable`-Hack) —
      MapLibre blockt die Geste über der Karte selbst per `touch-action`.
- [x] `eslint-plugin-jsx-a11y` (Projekt-Lint) + automatisierter axe-Test
      (`apps/web/e2e/a11y.spec.ts`) fangen Regressionen ab.
- [ ] Vollständiger RTL-Sweep aller hardcodierten `left`/`right`-Inline-Styles auf
      logische CSS-Properties (`insetInlineStart`/`-End`) — bisher nur punktuell
      gemacht (Foto-Lightbox, Karten-Stilwechsler).
- [ ] Echtes Roving-Tabindex (ein Tab-Stopp, Pfeiltasten bewegen Fokus) für die
      Filter-Toolbar — aktuell nur Pfeiltasten-Navigation zusätzlich zu den
      nativen Tab-Stopps auf jedem Chip.

Details/Kontext zur Überarbeitung: `docs/adr/0004-wcag-accessibility-ueberarbeitung.md`.

— Stand: 2026-07-07 · v0.2.0 (Accessibility-Überarbeitung) · © 2026 Transivroom Division
