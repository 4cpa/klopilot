import type { Metadata } from 'next';
import { LegalPage } from '@/components/landing/LegalPage';

export const metadata: Metadata = { title: 'Disclaimer — klopilot.ch' };

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer">
      <div className="meta">
        Stand: Mai 2026 · Haftungsausschluss für klopilot.ch und die klopilot Mobile-App.
      </div>

      <h2>Inhaltliche Haftung</h2>
      <p>
        Die Inhalte auf klopilot.ch werden mit grösster Sorgfalt erstellt und gepflegt. Für die
        Richtigkeit, Vollständigkeit und Aktualität der Inhalte — insbesondere nutzergenerierter
        Bewertungen, Standortangaben und Öffnungszeiten — kann jedoch keine Gewähr übernommen
        werden.
      </p>
      <p>
        klopilot ist eine Community-Plattform. Einträge und Bewertungen werden von Nutzerinnen und
        Nutzern erstellt und können Fehler enthalten, veraltet oder sachlich unrichtig sein. Vor dem
        Aufsuchen einer Toilette empfehlen wir, die Angaben vor Ort zu verifizieren.
      </p>

      <h2>Haftung für externe Links</h2>
      <p>
        Unsere Plattform kann Links zu externen Websites enthalten. Auf den Inhalt dieser Seiten
        haben wir keinen Einfluss und übernehmen keine Haftung dafür. Für den Inhalt der verlinkten
        Seiten sind ausschliesslich deren Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung
        wurden die Seiten auf mögliche Rechtsverstösse geprüft; eine dauerhafte inhaltliche
        Kontrolle ist ohne konkreten Hinweis auf einen Rechtsverstoß nicht zumutbar.
      </p>

      <h2>Kein Ersatz für offizielle Quellen</h2>
      <p>
        Die auf klopilot.ch bereitgestellten Informationen stellen keine offizielle Auskunft dar und
        ersetzen nicht die direkten Angaben der jeweiligen Betreiber einer Toilette oder
        öffentlicher Stellen.
      </p>

      <h2>Verfügbarkeit</h2>
      <p>
        Transivroom Division übernimmt keine Garantie für die ununterbrochene Verfügbarkeit der
        Plattform. Technische Störungen, Wartungsarbeiten oder Umstände höherer Gewalt können zu
        vorübergehenden Unterbrechungen führen.
      </p>

      <h2>Gesundheit und Sicherheit</h2>
      <p>
        Bewertungen zu Hygiene, Sicherheit oder Barrierefreiheit basieren auf subjektiver
        Nutzererfahrung und können von der tatsächlichen Situation abweichen. Personen mit
        besonderen Bedürfnissen (z.B. Rollstuhlnutzende) sollten sich im Zweifelsfall direkt beim
        Betreiber einer Einrichtung informieren.
      </p>

      <h2>Kontakt</h2>
      <p>
        Bei Fragen oder Beanstandungen: <a href="mailto:admin@4cpa.ch">admin@4cpa.ch</a>
      </p>
    </LegalPage>
  );
}
