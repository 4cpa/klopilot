'use client';

import { useState, useEffect, useRef } from 'react';

/* ── Hilfe-Inhalte ─────────────────────────────────────────────────────────── */
const SECTIONS = [
  {
    icon: '🗺️',
    title: 'Karte',
    body: 'Tippe auf einen Marker, um Details zu sehen. Zoome mit Pinch-Geste oder dem Mausrad. Dein Standort wird mit einem blauen Punkt angezeigt — Standort-Zugriff ist optional.',
  },
  {
    icon: '🔍',
    title: 'Suche',
    body: 'Gib Name oder Adresse ein. Resultate erscheinen sofort, sortiert nach Distanz. Drücke Escape zum Schliessen.',
  },
  {
    icon: '🎛️',
    title: 'Filter',
    body: 'Die Chips unter dem Header filtern die Karte in Echtzeit: Gratis, Barrierefrei, oder nach Kategorie. Mehrere Filter sind kombinierbar.',
  },
  {
    icon: '🌸 / 🪰',
    title: 'Bewertungssystem',
    body: 'Vergib Blümchen 🌸 (positiv, 0–5) oder Fliegen 🪰 (negativ, 0–5) für 10 Kriterien. Score = Blümchen minus Fliegen. Je grüner, desto besser.',
  },
  {
    icon: '🚽',
    title: 'Toilette eintragen',
    body: 'Melde dich an, dann erscheint der «+ Eintragen»-Button oben. Gib Name, Kategorie und deinen Standort an. Bearbeitbar jederzeit im Profil.',
  },
  {
    icon: '♿',
    title: 'Barrierefreiheit',
    body: 'Filter «Barrierefrei» zeigt Toiletten mit Rollstuhlzugang oder stufenlosem Eingang. Weitere Details (Eurokey, Wickeltisch, Dusche) im Detail-Panel.',
  },
  {
    icon: '🔒',
    title: 'Datenschutz',
    body: 'Kein Konto nötig zum Stöbern. Fotos werden ohne GPS-Metadaten (EXIF) gespeichert. Private Toiletten sind auf der Karte nur für Eingeladene sichtbar.',
  },
  {
    icon: '🌍',
    title: 'Internationale Abdeckung',
    body: '39 Länder in Europa — von West- und Nordeuropa über Mittel- und Osteuropa und den ganzen Balkan — sowie die Küstenregionen des Mittelmeers. Daten stammen aus OpenStreetMap und der Community.',
  },
  {
    icon: '🗣️',
    title: 'Sprache wählen',
    body: 'Verfügbar in 31 Sprachen, inklusive Arabisch und Hebräisch mit Rechts-nach-links-Darstellung. Wechsle über das Sprachmenü oder direkt per Link, z. B. klopilot.ch/?lang=uk.',
  },
  {
    icon: '⌨️',
    title: 'Tastaturkürzel',
    body: 'Tab: Fokus bewegen · Enter/Leertaste: Aktion ausführen · Escape: Dialog schliessen · ←/→: Fotos blättern · ↑/↓: Karte zoomen (wenn Fokus auf Karte)',
  },
  {
    icon: '📩',
    title: 'Kontakt & Feedback',
    body: 'Fragen, Bugs oder Ideen? Schreib uns: admin@4cpa.ch — oder erstelle ein Issue auf GitHub: github.com/4cpa/klopilot',
  },
];

/* ── QuestionMarkIcon ──────────────────────────────────────────────────────── */
function QuestionMarkIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/* ── HelpButton + Overlay ──────────────────────────────────────────────────── */
export function HelpButton() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Focus auf ersten interaktiven Element beim Öffnen
  useEffect(() => {
    if (open) {
      // kleines Delay damit DOM ready ist
      const t = setTimeout(() => closeRef.current?.focus(), 50);
      return () => clearTimeout(t);
    } else {
      // Fokus zurück auf Trigger beim Schliessen
      triggerRef.current?.focus();
    }
  }, [open]);

  // Escape schliesst
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Hilfe & Bedienung"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Hilfe & Bedienung"
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: '1.5px solid var(--line)',
          background: 'var(--surface)',
          color: 'var(--muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--cream)';
          (e.currentTarget as HTMLElement).style.color = 'var(--ink)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
          (e.currentTarget as HTMLElement).style.color = 'var(--muted)';
        }}
      >
        <QuestionMarkIcon />
      </button>

      {/* Overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 58,
              background: 'rgba(11,19,43,0.25)',
            }}
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            id="help-overlay"
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 60,
              background: 'var(--paper)',
              borderRadius: '20px 20px 0 0',
              maxHeight: '80dvh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -8px 40px rgba(15,23,42,.22)',
              overflow: 'hidden',
            }}
          >
            {/* Drag handle */}
            <div
              style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center' }}
              aria-hidden
            >
              <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--line)' }} />
            </div>

            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 16px 12px',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <h2
                id="help-title"
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 800,
                  color: 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span aria-hidden>❓</span> Hilfe & Bedienung
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Hilfe schliessen"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--cream)',
                  border: '1px solid var(--line)',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 32px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 10,
                }}
              >
                {SECTIONS.map((s) => (
                  <div
                    key={s.title}
                    style={{
                      borderRadius: 12,
                      border: '1px solid var(--line)',
                      padding: '12px 14px',
                      background: 'var(--surface)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 18 }} aria-hidden>
                        {s.icon}
                      </span>
                      <strong style={{ fontSize: 14, color: 'var(--ink)' }}>{s.title}</strong>
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--muted)',
                        margin: 0,
                        lineHeight: 1.55,
                      }}
                    >
                      {s.body}
                    </p>
                  </div>
                ))}
              </div>

              {/* Version info */}
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  textAlign: 'center',
                  marginTop: 20,
                  opacity: 0.6,
                }}
              >
                klopilot.ch · kostenlos · ohne Werbung ·{' '}
                <a
                  href="https://github.com/4cpa/klopilot"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Open Source
                </a>
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
