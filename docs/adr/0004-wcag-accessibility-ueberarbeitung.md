# ADR-0004: WCAG-2.1-AA-Überarbeitung (Web)

- **Status:** Akzeptiert
- **Datum:** 2026-07-07

## Kontext

Ein Accessibility-Audit von `apps/web` deckte auf, dass `docs/DESIGN.md`
(Abschnitt 9) zwar WCAG 2.1 AA als Mindestanforderung dokumentierte, mehrere
dieser Punkte in der tatsächlichen Implementierung aber nicht eingehalten
wurden:

- Die Marken-/Bewertungsfarben (`--brand-primary`, `--brand-mint`,
  `--brand-secondary`, `--brand-berry`, `--brand-sky`) wurden direkt als
  Fliesstext und als Button-Hintergrund mit weisser Schrift verwendet —
  in Light-Mode teils nur 1.4–2.8:1 Kontrast statt der geforderten 4.5:1.
  Sogar der globale `:focus-visible`-Ring (`--brand-primary`) verfehlte die
  3:1-Regel für UI-Elemente.
- `/karte` deaktivierte Pinch-Zoom sitzweit (`maximumScale: 1,
userScalable: false`) als iOS-Workaround — blockierte damit jedes
  Vergrössern der UI für sehbeeinträchtigte Nutzer:innen, obwohl MapLibre
  die Geste über der Karte ohnehin selbst per CSS `touch-action` abfängt.
- Der Blümchen-/Fliegen-Bewertungsslider war eine Gruppe stummer Buttons ohne
  Gruppierungs- oder Auswahl-Semantik — ein direkter Bruch der eigenen
  Doku-Vorgabe ("Screenreader-Labels … 4 von 5 Blümchen").
- Dialoge/Sheets (Login, Bewerten, Toilette hinzufügen, Profil, Detail) hatten
  keine Fokus-Falle, keinen initialen Fokus und keine Fokus-Rückgabe; der
  Kartenhintergrund blieb während offener Dialoge per Tab erreichbar.
- Formularfehler waren nicht per `aria-describedby`/`role="alert"` mit ihrem
  Feld verknüpft — Screenreader-Nutzer:innen erfuhren nie automatisch von
  einem Fehler.
- Kartenmarker reagierten nur auf Enter (nicht auf die konventionelle
  Leertaste) und ihr `aria-label` enthielt nur den Namen, nicht Bewertung
  oder Zugänglichkeit — Informationen, die sehende Nutzer:innen aus
  Marker-Farbe/-Badges ablesen.
- Es gab **keine** nicht-räumliche Alternative, um Toiletten zu durchsuchen —
  Screenreader-Nutzer:innen konnten den Katalog auf `/karte` praktisch nicht
  browsen, nur gezielt per Name suchen.
- Kein automatisiertes Tooling (`eslint-plugin-jsx-a11y`, axe) hätte
  Regressionen dieser Art verhindert.

## Entscheidung

**Kontrast — zwei neue Token-Familien statt Umfärben der Marke:**

`apps/web/app/globals.css` bekommt `--score-{primary,secondary,mint,berry,sky}-text`
(freistehender Text, ≥4.5:1 auf `--paper`/`--surface`) und
`--score-{primary,secondary,mint,berry,sky}-solid` + `--btn-primary-bg`
(Flächen mit weisser Schrift, ≥4.5:1). Die ursprünglichen `--brand-*`-Tokens
bleiben für Grafik/Branding (Logo, Marker-Farbe als Fläche, grosse Gradient-
Flächen) unverändert — eine sitzweite Umfärbung der Marke wäre eine
Branding-Entscheidung jenseits dieses Scopes gewesen. `--error-text` bündelt
Fehlermeldungsfarbe. Der globale Fokus-Ring nutzt jetzt `--btn-primary-bg`.

**Pinch-Zoom:** `app/karte/layout.tsx` setzt kein `maximumScale`/`userScalable`
mehr — MapLibres `touch-action: none` auf dem Canvas-Container reicht.

**Rating-Widget:** `RatingSlider.tsx` nutzt jetzt `role="radiogroup"`/`role="radio"`
mit zusammengesetztem `aria-label` (Kriterium + Modus + Wert) und
Pfeiltasten-Navigation.

**Fokus-Management:** neuer, wiederverwendbarer Hook `apps/web/lib/useFocusTrap.ts`
(Fokus-Falle, initialer Fokus, Escape, Fokus-Rückgabe) — angewendet auf alle
Dialoge/Sheets. Der Kartenhintergrund wird über einen Ref + `element.inert`
unerreichbar geschaltet, solange ein Dialog offen ist (kein CSS-Trick, echtes
`inert`, funktioniert unabhängig vom DOM-Aufbau).

**Formularfehler:** durchgängig `id` + `role="alert"` auf der Fehlermeldung,
`aria-describedby`/`aria-invalid` auf dem zugehörigen Feld/Button.

**Kartenmarker:** Leertaste zusätzlich zu Enter als Aktivierungstaste;
`aria-label` fasst Name, Bewertung und Zugänglichkeit zusammen.

**Listenansicht:** neue Komponente `components/map/ToiletListPanel.tsx`,
umschaltbar über einen Button auf `/karte` — zeigt dieselben sichtbaren
Toiletten als gewöhnliche, per Tab navigierbare Liste. Kein Ersatz für die
Karte, sondern eine gleichwertige zweite Zugangsart.

**Tooling:** `eslint-plugin-jsx-a11y` im Root-`eslint.config.js` (scope
`apps/web/**/*.{ts,tsx}`, `recommended`-Regelsatz) + `@axe-core/playwright`
mit neuem Test `apps/web/e2e/a11y.spec.ts` (prüft `/` und `/karte` auf
`critical`/`serious`-Verstösse gegen WCAG 2.1 A/AA).

## Konsequenzen

- **+** Kontrastfehler und grobe ARIA-Fehler (z. B. `role="list"` mit falschen
  Kindern, ein `<img onClick>` ohne Tastaturpfad) werden jetzt automatisiert
  gefunden — beide Beispiele wurden während dieser Überarbeitung vom neuen
  axe-Test bzw. jsx-a11y-Lint aufgedeckt und behoben.
- **+** Die Marken-Akzentfarben bleiben visuell unverändert für Grafik/Branding;
  nur die konkret fehlerhaften Text-/Button-Verwendungen wurden umgestellt —
  kein Rebranding-Risiko.
- **−** Nicht behoben (bewusst zurückgestellt, siehe `docs/DESIGN.md` §9):
  SSR liefert `<html lang="de">` bis der Locale-Switch nach der Hydration
  greift (kurzes Flackern für RTL-Sprachen); ein vollständiger Sweep aller
  hardcodierten `left`/`right`-Inline-Styles auf logische CSS-Properties;
  echtes Roving-Tabindex (ein Tab-Stopp) für die Filter-Toolbar; sehr dichte
  Kartenausschnitte hängen weiterhin viele fokussierbare Marker in die
  Tab-Reihenfolge — die Listenansicht ist die Entlastung dafür, aber kein
  vollständiger Ersatz (z. B. keine Virtualisierung).
- **−** `eslint-plugin-jsx-a11y` und `@axe-core/playwright` sind neue
  Abhängigkeiten (Dev-only, kein Produktions-Bundle-Impact).
