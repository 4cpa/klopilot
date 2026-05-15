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

| Token | Hex | Verwendung |
|---|---|---|
| `--brand-primary` | `#FF6B35` | Akzent, primäre Buttons, Marker |
| `--brand-secondary` | `#FFD23F` | sekundär, Highlights, "Nette Toilette"-Badge |
| `--brand-deep` | `#0B132B` | Headerschrift, dunkle Flächen |
| `--brand-mint` | `#06D6A0` | "frisch", positive States |
| `--brand-berry` | `#EF476F` | Warnungen, Fliegen-Akzent |
| `--brand-sky` | `#118AB2` | Info, sekundärer Karten-Akzent |
| `--paper` | `#FFFBF2` | App-Hintergrund |
| `--cream` | `#FFF3DC` | Karten-Flächen |
| `--ink` | `#0B132B` | Primärtext |
| `--muted` | `#6B7280` | Sekundärtext |
| `--line` | `#E7E0CF` | Trennlinien |

### Marken-Palette (Dark)

| Token | Hex | Verwendung |
|---|---|---|
| `--bg` | `#0E1117` | App-Hintergrund |
| `--surface` | `#161B22` | Karten, Sheets |
| `--surface-2` | `#1F2630` | erhöhte Flächen |
| `--ink` | `#F4EFE6` | Primärtext |
| `--muted` | `#9AA4B2` | Sekundärtext |
| `--line` | `#2A313C` | Trennlinien |
| `--brand-primary` | `#FF8B5C` | aufgehellt für Kontrast auf Dunkel |
| `--brand-secondary` | `#FFE066` | aufgehellt |
| `--brand-mint` | `#3FE8B7` | aufgehellt |
| `--brand-berry` | `#FF6B8A` | aufgehellt |

### Bewertungs-Farben (beide Themes)

| Token | Hex | Bedeutung |
|---|---|---|
| `--rate-flower` | `#E91E63` (Light) / `#FF7AB3` (Dark) | Blümchen-Symbol |
| `--rate-flower-bg` | `#FFE4EE` / `#3A1929` | Hintergrund-Tönung |
| `--rate-fly` | `#374151` (Light) / `#9AA4B2` (Dark) | Fliege-Symbol |
| `--rate-fly-bg` | `#F3F4F6` / `#1F2630` | Hintergrund-Tönung |

### Kontrastregeln

- Primärtext auf Hintergrund ≥ 7:1 (WCAG AAA Body), mind. 4.5:1.
- UI-Elemente und Buttons ≥ 3:1 zur Umgebung.
- `--brand-primary` auf weiss erfüllt 4.5:1 — für kleine Schrift `--brand-deep` nutzen.

## 3. Typografie

- **Display / Headlines:** *Fraunces* (Variable, italic optisch erlaubt) — frech, charakterstark.
- **UI / Body:** *Inter* (Variable) — neutrale, sehr gute Lesbarkeit.
- **Mono:** *JetBrains Mono* — Codeblöcke, technische Werte.

Skalen:

| Stufe | Größe | Zeilenhöhe | Anwendung |
|---|---|---|---|
| `display` | 56 / 44 / 36 | 1.05 | Hero-Titel |
| `h1` | 32 | 1.15 | Seitentitel |
| `h2` | 24 | 1.2 | Abschnitte |
| `h3` | 20 | 1.3 | Karten-Titel |
| `body-lg` | 18 | 1.5 | Hauptlesetext mobil |
| `body` | 16 | 1.5 | Lesetext |
| `caption` | 13 | 1.4 | Meta, Labels |
| `mono` | 14 | 1.45 | Codeblöcke |

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
  --brand-primary: #FF6B35;
  --brand-secondary: #FFD23F;
  --brand-deep: #0B132B;
  --brand-mint: #06D6A0;
  --brand-berry: #EF476F;
  --brand-sky: #118AB2;
  --paper: #FFFBF2;
  --cream: #FFF3DC;
  --ink: #0B132B;
  --muted: #6B7280;
  --line: #E7E0CF;
  --rate-flower: #E91E63;
  --rate-flower-bg: #FFE4EE;
  --rate-fly: #374151;
  --rate-fly-bg: #F3F4F6;
  --radius-md: 12px;
  --radius-lg: 16px;
  --shadow-card: 0 6px 24px rgba(15,23,42,.06);
}
:root[data-theme="dark"] {
  --paper: #0E1117;
  --cream: #161B22;
  --ink: #F4EFE6;
  --muted: #9AA4B2;
  --line: #2A313C;
  --brand-primary: #FF8B5C;
  --brand-secondary: #FFE066;
  --brand-mint: #3FE8B7;
  --brand-berry: #FF6B8A;
  --rate-flower: #FF7AB3;
  --rate-flower-bg: #3A1929;
  --rate-fly: #9AA4B2;
  --rate-fly-bg: #1F2630;
  --shadow-card: 0 6px 24px rgba(0,0,0,.35);
}
```

## 9. Accessibility-Checkliste

- Alle interaktiven Elemente haben einen sichtbaren `:focus-visible`-Stil.
- Mindest-Touch-Target 44×44 px (WCAG 2.5.5).
- Kein "Nur-Farbe"-Status — Symbole oder Text begleiten jede Farbsignal.
- Reduzierte Bewegung: `prefers-reduced-motion` respektieren (keine grossen Animationen).
- Screenreader-Labels für Blümchen-/Fliegen-Slider ("Bewertung Sauberkeit, 4 von 5 Blümchen").
- Sprache der Seite per `<html lang="...">` und Locale-Switch.

— Stand: P1-Initial · v0.1.0 · © 2026 Transivroom Division
