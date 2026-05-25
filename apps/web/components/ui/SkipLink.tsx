'use client';

/**
 * Skip-to-content Link — WCAG 2.1 Erfordernis (Erfolgskriterium 2.4.1)
 * Sichtbar nur bei Tastaturfokus (Focus-Visible). Springt direkt zum Hauptinhalt,
 * damit Tastatur- und Screenreader-Nutzer die Navigation überspringen können.
 */
export function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Zum Hauptinhalt springen
    </a>
  );
}
