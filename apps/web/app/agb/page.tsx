import type { Metadata } from 'next';
import { LegalPage } from '@/components/landing/LegalPage';

export const metadata: Metadata = { title: 'Allgemeine Geschäftsbedingungen — klopilot.ch' };

export default function AgbPage() {
  return (
    <LegalPage title="Allgemeine Geschäftsbedingungen">
      <div className="meta">
        Stand: Mai 2026 · Gültig für alle Nutzerinnen und Nutzer von klopilot.ch und der klopilot
        Mobile-App.
      </div>

      <h2>1. Geltungsbereich</h2>
      <p>
        Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Plattform
        klopilot.ch und der zugehörigen Mobile-App (nachfolgend „Plattform"), betrieben von
        Transivroom Division (nachfolgend „wir" oder „Betreiber").
      </p>

      <h2>2. Leistungsbeschreibung</h2>
      <p>
        klopilot ist eine Community-Plattform zur Bewertung und zum Auffinden öffentlich
        zugänglicher Toiletten. Die Plattform ist für Endnutzer kostenlos und werbefrei. Wir
        behalten uns vor, den Funktionsumfang jederzeit anzupassen.
      </p>

      <h2>3. Registrierung und Nutzerkonto</h2>
      <p>
        Die Nutzung der Grundfunktionen (Karte, Suche, Ansicht) ist ohne Registrierung möglich. Für
        das Abgeben von Bewertungen, das Eintragen von Toiletten und weitere Community-Funktionen
        ist ein kostenloses Konto erforderlich.
      </p>
      <p>
        Du bist verantwortlich für die Sicherheit deines Kontos. Teile deinen Magic Link nicht mit
        Dritten. Missbrauch melde bitte an <a href="mailto:admin@4cpa.ch">admin@4cpa.ch</a>.
      </p>

      <h2>4. Nutzerverhalten und verbotene Inhalte</h2>
      <p>Folgende Inhalte und Verhaltensweisen sind nicht gestattet:</p>
      <ul>
        <li>Falsche, irreführende oder diffamierende Bewertungen</li>
        <li>Spam, automatisierte Massenanfragen oder Scraping</li>
        <li>Einträge fiktiver oder nicht existierender Toiletten</li>
        <li>Unangemessene, beleidigende oder illegale Inhalte</li>
        <li>Fotos, die Personen ohne deren Einwilligung zeigen</li>
        <li>Umgehung von Sicherheitsmassnahmen oder Rate-Limits</li>
      </ul>
      <p>
        Wir behalten uns vor, gegen diese Regeln verstossende Inhalte ohne Vorankündigung zu
        entfernen und betroffene Konten zu sperren.
      </p>

      <h2>5. Nutzergenerierte Inhalte</h2>
      <p>
        Mit dem Hochladen von Inhalten (Bewertungen, Fotos, Beschreibungen) räumst du uns das
        nicht-exklusive, weltweite, unentgeltliche Recht ein, diese Inhalte für den Betrieb der
        Plattform zu nutzen, zu speichern und anzuzeigen.
      </p>
      <p>
        Du garantierst, dass du die erforderlichen Rechte an den eingestellten Inhalten besitzt und
        diese keine Rechte Dritter verletzen.
      </p>

      <h2>6. Datenschutz</h2>
      <p>
        Die Verarbeitung personenbezogener Daten erfolgt gemäss unserer{' '}
        <a href="/datenschutz">Datenschutzerklärung</a>.
      </p>

      <h2>7. Verfügbarkeit</h2>
      <p>
        Wir bemühen uns um eine hohe Verfügbarkeit der Plattform, übernehmen jedoch keine Garantie
        für unterbrechungsfreien Betrieb. Wartungsarbeiten, technische Störungen oder höhere Gewalt
        können zu temporären Unterbrechungen führen.
      </p>

      <h2>8. Haftungsbeschränkung</h2>
      <p>
        Die auf der Plattform bereitgestellten Informationen (insbesondere Bewertungen,
        Öffnungszeiten, Standorte) werden von der Community erstellt und können unvollständig oder
        veraltet sein. Wir übernehmen keine Haftung für die Richtigkeit oder Vollständigkeit
        nutzergenerierter Inhalte.
      </p>
      <p>
        Haftung für Schäden aus der Nutzung der Plattform ist, soweit gesetzlich zulässig,
        ausgeschlossen.
      </p>

      <h2>9. Änderungen der AGB</h2>
      <p>
        Wir behalten uns vor, diese AGB jederzeit anzupassen. Wesentliche Änderungen werden
        registrierten Nutzern per E-Mail mitgeteilt. Das Datum des letzten Updates ist oben
        angegeben.
      </p>

      <h2>10. Anwendbares Recht und internationale Nutzer</h2>
      <p>
        Diese AGB und die Nutzung der Plattform unterliegen ausschliesslich schweizerischem Recht
        unter Ausschluss des Kollisionsrechts und des UN-Kaufrechts (CISG). Bei Nutzerinnen und
        Nutzern, die als Verbraucher in einem anderen Staat ansässig sind, bleiben die zwingenden
        verbraucherschützenden Bestimmungen ihres Wohnsitzstaates unberührt; schweizerisches Recht
        gilt insoweit nur, als es diesen zwingenden Schutz nicht verkürzt.
      </p>

      <h2>11. Gerichtsstand und Streitbeilegung</h2>
      <p>
        Ausschliesslicher Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesen
        AGB ist — soweit gesetzlich zulässig — der Sitz des Betreibers in der Schweiz. Zwingende
        Gerichtsstände zugunsten von Verbrauchern bleiben unberührt.
      </p>
      <p>
        Vor Anrufung eines Gerichts streben die Parteien eine gütliche Einigung an (Kontakt:{' '}
        <a href="mailto:admin@4cpa.ch">admin@4cpa.ch</a>). Streitigkeiten, die keine
        Verbraucherstreitigkeiten sind, werden auf Wunsch einer Partei nach den Swiss Rules of
        International Arbitration des Swiss Arbitration Centre endgültig entschieden; Sitz des
        Schiedsgerichts ist Zürich, Verfahrenssprache Deutsch. Verbraucher in der EU können zudem
        die Online-Streitbeilegungs-Plattform der EU-Kommission nutzen:{' '}
        <a href="https://ec.europa.eu/consumers/odr" rel="noopener noreferrer" target="_blank">
          ec.europa.eu/consumers/odr
        </a>
        .
      </p>

      <h2>12. Internationale Verfügbarkeit, Sanktionen und Exportkontrolle</h2>
      <p>
        Die Plattform richtet sich an ein internationales Publikum, ist jedoch nicht für die Nutzung
        in Gebieten bestimmt, in denen dies gegen geltendes Recht verstösst. Nutzer sichern zu,
        anwendbare Sanktions-, Embargo- und Exportkontrollvorschriften (insbesondere der Schweiz,
        der EU und der UNO) einzuhalten. In von Sanktionen erfassten Gebieten (u. a. Russland,
        Belarus) wird die Plattform nicht aktiv angeboten.
      </p>

      <h2>13. Salvatorische Klausel</h2>
      <p>
        Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam sein oder werden,
        bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. An die Stelle der unwirksamen
        Bestimmung tritt eine Regelung, die dem verfolgten wirtschaftlichen Zweck am nächsten kommt.
      </p>

      <h2>14. Massgebliche Sprachfassung</h2>
      <p>
        Massgeblich ist die deutschsprachige Fassung dieser AGB. Übersetzungen dienen nur der
        besseren Verständlichkeit; bei Widersprüchen geht die deutsche Fassung vor.
      </p>

      <h2>15. Kontakt</h2>
      <p>
        Fragen zu diesen AGB: <a href="mailto:admin@4cpa.ch">admin@4cpa.ch</a>
      </p>
    </LegalPage>
  );
}
