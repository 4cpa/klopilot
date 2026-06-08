# i18n Korrektur-PDFs

Erzeugt pro Sprache ein **interaktives PDF-Formular** zum Korrekturlesen der
sichtbaren UI-Texte und liest die ausgefüllten Bögen wieder ein.

Das Dokument ist **vollständig in der zu korrigierenden Sprache** erläutert
(Einleitung und alle Bedien-Labels); **Deutsch (DE)** und **Englisch (EN)** dienen
je Eintrag als Vergleichssprachen, gefolgt von der zu korrigierenden Übersetzung.

Jeder Eintrag zeigt:

- den i18n-Key,
- den **deutschen Originaltext** (DE) als Vergleich,
- den **englischen Text** (EN) als Vergleich,
- die **zu korrigierende Übersetzung** (korrekt geshaped, RTL für AR/HE,
  Latein-Fallback für eingebettete Markennamen/Ziffern),
- Ankreuzfelder **✗ falsch** und **\~ besser** (in der Zielsprache beschriftet),
- ein beschreibbares **Korrektur**-Feld in der Zielsprache.

Die Feldnamen kodieren den Key (`cor##help__DOT__map__DOT__title` …), daher lässt
sich ein zurückgeschicktes PDF eindeutig auf die Translation-Keys zurückführen.

Quelle der Texte: `packages/i18n/src/locales/<code>.json` (Vergleich: `de.json`
und `en.json`), alle 31 Sprachen aus `locales-meta.mjs`. Bedien-/Anleitungstexte
pro Sprache in `ui-strings.mjs`.

## Setup (einmalig, überlebt Reboots)

Die PDF-Abhängigkeiten stehen bewusst nicht in einer `package.json` des Monorepos.
`npm install` direkt in diesem Ordner scheitert an der pnpm-Workspace-Umgebung
(npm läuft hoch in die `node_modules/.pnpm`-Struktur). Daher außerhalb installieren
und das `node_modules` einmalig hereinkopieren — es bleibt persistent im Tool-Ordner
(über dessen `.gitignore` ausgeschlossen), kein erneuter Schritt nach Reboots:

```bash
scratch=$(mktemp -d)
( cd "$scratch" && npm install pdf-lib @pdf-lib/fontkit fontkit arabic-persian-reshaper )
cp -r "$scratch/node_modules" tools/i18n-review/node_modules
```

Benötigt die System-Schriften `Noto Sans`, `Noto Sans Arabic`, `Noto Sans Hebrew`
(Pfade in `locales-meta.mjs`).

## Erzeugen

```bash
node generate-review-pdf.mjs            # alle 31 Sprachen → out/
node generate-review-pdf.mjs fr,it,ar   # nur ausgewählte
```

## Zurücklesen / Anwenden

```bash
# Zusammenfassung + out/corrections-<code>.json schreiben
node parse-review-pdf.mjs out/klopilot-i18n-fr.pdf

# Ganzes Verzeichnis mit zurückgeschickten PDFs
node parse-review-pdf.mjs ~/Downloads/zurueck/

# Korrekturen direkt in die Locale-JSONs eintragen
node parse-review-pdf.mjs out/klopilot-i18n-fr.pdf --apply
```

`--apply` trägt nur nicht-leere **Korrektur**-Felder ein; reine „falsch/besser“-Haken
ohne Text bleiben als Hinweis im `corrections-*.json` stehen.

## Hinweise

- RTL (AR/HE): Wortreihenfolge + arabische Verbindung werden für die *Anzeige* der
  bestehenden Übersetzung gerendert (Mini-Bidi). Eingebettete Latein-Tokens können in
  Mischzeilen visuell vertauscht erscheinen — die DE-Referenz und der Key sind maßgeblich.
  Das **Eingabefeld** ist rechtsbündig; das RTL-Tippen übernimmt der PDF-Viewer.
- Die Korrektur-Eingabeschrift ist pro PDF die Zielsprachen-Schrift (vollständig
  eingebettet, nicht subset), damit beliebige Zeichen tippbar sind.
