import type { Metadata } from 'next';
import { LegalPage } from '@/components/landing/LegalPage';

export const metadata: Metadata = { title: 'Partner-Programm — klopilot.ch' };

export default function PartnerPage() {
  return (
    <LegalPage title="Partner-Programm 🤝">
      <div className="meta">
        Stand: Mai 2026 · Das Partnerprogramm ist in Phase P3 geplant (ab Q3 2026). Bewerbungen sind
        bereits möglich — wir nehmen Kontakt auf, sobald das Programm startet.
      </div>

      <h2>Was ist ein klopilot-Partner?</h2>
      <p>
        Partner sind Betreiber öffentlich zugänglicher Toiletten — Restaurants, Cafés, Hotels,
        Einkaufszentren, Gemeinden oder Kultureinrichtungen —, die ihre Toiletten aktiv der
        Community zur Verfügung stellen. Das entspricht dem Konzept der{' '}
        <strong>„Nette Toilette"</strong>: kostenlos zugänglich, für alle offen.
      </p>
      <p>
        Partner erhalten auf klopilot.ch ein verifiziertes Badge und eine erhöhte Sichtbarkeit auf
        der Karte — ohne Werbung, ohne Kosten.
      </p>

      <h2>Vorteile für Partner</h2>
      <ul>
        <li>
          🌸 <strong>Partner-Badge</strong> auf der Karte und im Toiletten-Profil
        </li>
        <li>
          🔝 <strong>Erhöhte Sichtbarkeit</strong> in den Suchergebnissen
        </li>
        <li>
          📊 <strong>Statistiken</strong> — wie oft wurde Ihre Toilette gefunden und bewertet?
        </li>
        <li>
          🏅 <strong>Verifizierter Eintrag</strong> — klopilot prüft und bestätigt die Angaben
        </li>
        <li>
          📣 <strong>Erwähnung</strong> in Kommunikation und Social Media (auf Wunsch)
        </li>
      </ul>

      <h2>Voraussetzungen</h2>
      <ul>
        <li>
          Die Toilette ist für die Öffentlichkeit zugänglich — kostenlos oder günstig (max. CHF
          0.50)
        </li>
        <li>Sie sind für den Betrieb verantwortlich (Eigentümer, Pächter, Gemeinde)</li>
        <li>Die Toilette entspricht einem Mindeststandard (sauber, funktionsfähig)</li>
        <li>Sie stimmen den klopilot-Nutzungsbedingungen zu</li>
      </ul>

      <h2>Was kostet das?</h2>
      <p>
        <strong>Nichts.</strong> Das Partnerprogramm ist für Betreiber kostenlos — klopilot
        finanziert sich ausschliesslich über B2B-Dienste (Geotag-Lizenzierung, API-Zugang) und
        akzeptiert keine Endnutzer-Werbung. Kein Bezahlmodell für Partner geplant.
      </p>

      <h2>So bewerben Sie sich</h2>
      <p>Senden Sie eine E-Mail an</p>
      <p>
        📧 <a href="mailto:admin@4cpa.ch">admin@4cpa.ch</a>
      </p>
      <p>mit folgenden Angaben:</p>
      <ul>
        <li>Name und Adresse der Toilette(n)</li>
        <li>Öffnungszeiten und Zugangsbedingungen</li>
        <li>Ihr Name und Ihre Rolle (Betreiber, Gemeinde, etc.)</li>
        <li>Optional: Foto der Toilette</li>
      </ul>

      <h2>Fragen?</h2>
      <p>
        Für Rückfragen steht das klopilot-Team unter{' '}
        <a href="mailto:admin@4cpa.ch">admin@4cpa.ch</a> zur Verfügung.
      </p>
    </LegalPage>
  );
}
