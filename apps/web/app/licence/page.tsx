import type { Metadata } from 'next';
import { LegalPage } from '@/components/landing/LegalPage';

export const metadata: Metadata = { title: 'Lizenz — klopilot.ch' };

export default function LicencePage() {
  return (
    <LegalPage title="Lizenz">
      <div className="meta">
        Copyright © 2026 Transivroom Division · Alle Rechte vorbehalten. · Stand: Mai 2026
      </div>

      <h2>Kurzfassung</h2>
      <p>klopilot ist ein Open-Source-Projekt mit eingeschränkter kommerzieller Nutzung:</p>
      <ul>
        <li>
          <strong>✅ Erlaubt:</strong> Nicht-kommerzielle Nutzung, Forken, Ansehen und Anpassen —
          mit Quellenangabe „klopilot.ch — Transivroom Division".
        </li>
        <li>
          <strong>❌ Verboten:</strong> Kommerzielle Nutzung, Weiterverkauf, Integration in
          kostenpflichtige Produkte oder Werbung — ohne schriftliche Genehmigung.
        </li>
        <li>
          <strong>📩 Ausnahmen:</strong> Schriftliche Genehmigung via{' '}
          <a href="mailto:admin@4cpa.ch">admin@4cpa.ch</a>.
        </li>
      </ul>

      <h2>Vollständiger Lizenztext</h2>
      <p>
        Die nicht-kommerzielle Nutzung, Verbreitung und Veränderung dieses Projekts ist gestattet,
        sofern folgende Bedingungen erfüllt sind:
      </p>

      <h3>1. Copyright-Hinweis</h3>
      <p>
        Der obige Copyright-Hinweis und diese Lizenzbedingungen müssen in allen Kopien oder
        wesentlichen Teilen der Software enthalten sein.
      </p>

      <h3>2. Quellenangabe</h3>
      <p>
        Die Quellenangabe <strong>„klopilot.ch — Transivroom Division"</strong> muss sichtbar
        vermerkt sein.
      </p>

      <h3>3. Kommerzielle Nutzung verboten</h3>
      <p>
        Kommerzielle Nutzung — einschliesslich, aber nicht beschränkt auf Weiterverkauf, Integration
        in kostenpflichtige Produkte oder die Nutzung für Werbezwecke — ist ohne schriftliche
        Genehmigung von Transivroom Division ausdrücklich untersagt.
      </p>

      <h2>Haftungsausschluss</h2>
      <p>
        Diese Software wird ohne Mängelgewähr und ohne jegliche ausdrückliche oder stillschweigende
        Gewährleistung bereitgestellt. Die Autoren übernehmen keine Haftung für Schäden, die durch
        die Verwendung dieser Software entstehen.
      </p>

      <h2>Quellcode</h2>
      <p>
        Der Quellcode ist öffentlich zugänglich auf{' '}
        <a href="https://github.com/4cpa/klopilot" target="_blank" rel="noopener noreferrer">
          github.com/4cpa/klopilot
        </a>
        .
      </p>

      <h2>Kontakt</h2>
      <p>
        Für kommerzielle Lizenzen oder Kooperationsanfragen:{' '}
        <a href="mailto:admin@4cpa.ch">admin@4cpa.ch</a>
      </p>
    </LegalPage>
  );
}
