import type { Metadata } from 'next';
import { LegalPage } from '@/components/landing/LegalPage';

export const metadata: Metadata = { title: 'Impressum — klopilot.ch' };

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum">
      <div className="meta">
        Stand: Mai 2026 · Diese Seite gilt als rechtlich verbindliches Impressum gemäss Art. 3 UWG
        (CH) und § 5 TMG (DE).
      </div>

      <h2>Betreiber</h2>
      <p>
        <strong>Transivroom Division</strong>
        <br />
        E-Mail: <a href="mailto:admin@4cpa.ch">admin@4cpa.ch</a>
        <br />
        Web: <a href="https://klopilot.ch">klopilot.ch</a>
      </p>

      <h2>Verantwortlich für den Inhalt</h2>
      <p>
        Transivroom Division, kontaktierbar unter <a href="mailto:admin@4cpa.ch">admin@4cpa.ch</a>.
      </p>

      <h2>Hosting</h2>
      <p>
        Diese Plattform wird gehostet bei der <strong>Infomaniak Network SA</strong>, Rue Eugène
        Marziano 25, 1227 Genf (Schweiz). Sämtliche Server und Daten befinden sich ausschliesslich
        in der Schweiz.
      </p>

      <h2>Nutzergenerierte Inhalte</h2>
      <p>
        Bewertungen, Kommentare und sonstige nutzergenerierte Inhalte auf klopilot.ch geben die
        Meinung der jeweiligen Verfasser wieder und nicht zwangsläufig die der Plattformbetreiber.
      </p>
      <p>
        Unangemessene Inhalte können über die Meldefunktion in der App oder per E-Mail an{' '}
        <a href="mailto:admin@4cpa.ch">admin@4cpa.ch</a> gemeldet werden. Wir entfernen gemeldete
        Inhalte so schnell wie möglich.
      </p>

      <h2>Haftungsausschluss für externe Links</h2>
      <p>
        Trotz sorgfältiger Kontrolle übernimmt Transivroom Division keine Haftung für Inhalte
        externer Links. Für den Inhalt der verlinkten Seiten sind ausschliesslich deren Betreiber
        verantwortlich.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        © 2026 Transivroom Division. Alle Rechte vorbehalten, soweit nicht anders angegeben.
        Nicht-kommerzielle Nutzung des Quellcodes ist mit Quellenangabe gestattet. Siehe{' '}
        <a href="/licence">LICENSE</a>.
      </p>

      <h2>Open Source</h2>
      <p>Der Quellcode von klopilot.ch ist öffentlich einsehbar auf GitHub:</p>
      <p>
        <a href="https://github.com/4cpa/klopilot" target="_blank" rel="noopener noreferrer">
          github.com/4cpa/klopilot
        </a>
      </p>
      <p>
        Beiträge sind willkommen — siehe{' '}
        <a
          href="https://github.com/4cpa/klopilot/blob/main/.github/CONTRIBUTING.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          CONTRIBUTING.md
        </a>
        . Die Nutzung unterliegt den Bedingungen gemäss <a href="/licence">LICENSE</a>.
      </p>

      <h2>Statistik-Report</h2>
      <p>
        Aktueller Bestands-Report (Toiletten nach Ländern und Rubriken, mit Datenquellen) als PDF:
      </p>
      <ul>
        <li>
          <a
            href="/reports/klopilot-statistik-2026-06-01.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Statistik-Report (Deutsch, PDF)
          </a>
        </li>
        <li>
          <a
            href="/reports/klopilot-statistics-2026-06-01.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Statistics Report (English, PDF)
          </a>
        </li>
      </ul>

      <h2>Streitbeilegung</h2>
      <p>
        Transivroom Division ist weder verpflichtet noch bereit, an einem Streitbeilegungsverfahren
        vor einer Verbraucherschlichtungsstelle teilzunehmen. Bei Fragen wende dich direkt an{' '}
        <a href="mailto:admin@4cpa.ch">admin@4cpa.ch</a>.
      </p>
    </LegalPage>
  );
}
