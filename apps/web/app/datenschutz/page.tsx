import type { Metadata } from 'next';
import { LegalPage } from '@/components/landing/LegalPage';

export const metadata: Metadata = { title: 'Datenschutzerklärung — klopilot.ch' };

export default function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <div className="meta">
        Stand: Mai 2026 · Gültig für klopilot.ch und die klopilot Mobile-App. Rechtsgrundlage:
        revDSG (Schweiz) und DSGVO (EU).
      </div>

      <h2>1. Verantwortliche Stelle</h2>
      <p>
        Transivroom Division
        <br />
        E-Mail: <a href="mailto:admin@4cpa.ch">admin@4cpa.ch</a>
      </p>

      <h2>2. Welche Daten wir erheben</h2>
      <h3>2.1 Beim Besuch der Website</h3>
      <p>Unser Server verarbeitet bei jedem Zugriff vorübergehend folgende Daten:</p>
      <ul>
        <li>IP-Adresse (anonymisiert, nicht gespeichert)</li>
        <li>Datum und Uhrzeit des Zugriffs</li>
        <li>Aufgerufene URL, Referrer, verwendeter Browser und Betriebssystem</li>
      </ul>
      <p>
        Diese Daten werden ausschliesslich zur Fehleranalyse verwendet und nicht an Dritte
        weitergegeben.
      </p>

      <h3>2.2 Bei Registrierung / Anmeldung</h3>
      <p>Wenn du dich per Magic Link oder OAuth anmeldest, speichern wir:</p>
      <ul>
        <li>E-Mail-Adresse (für den Magic Link)</li>
        <li>Benutzername (Handle, selbst gewählt)</li>
        <li>Anmeldedatum und -methode</li>
      </ul>

      <h3>2.3 Bei Nutzung der Karte</h3>
      <ul>
        <li>
          Dein Standort wird nur im Browser verarbeitet und wird nicht an unsere Server übertragen,
          solange du keine Toilette eintragen oder suchen möchtest.
        </li>
        <li>
          Fotos: Alle hochgeladenen Bilder werden vor der Speicherung von EXIF-Metadaten (inkl.
          GPS-Koordinaten) bereinigt.
        </li>
        <li>Bewertungen sind mit deinem Benutzerkonto verknüpft.</li>
      </ul>

      <h2>3. Zweck der Datenverarbeitung</h2>
      <ul>
        <li>Betrieb und Verbesserung der Plattform</li>
        <li>Authentifizierung und Sicherheit</li>
        <li>Spam- und Missbrauchs-Prävention</li>
        <li>
          Datenschutzkonforme Analyse via <strong>Plausible Analytics</strong> (cookiefrei, keine
          IP-Speicherung, EU-Server)
        </li>
      </ul>

      <h2>4. Datenweitergabe</h2>
      <p>Wir verkaufen keine persönlichen Daten. Eine Weitergabe an Dritte erfolgt nur:</p>
      <ul>
        <li>
          An unsere Hosting-Anbieter (Hetzner, Schweiz/Deutschland) im Rahmen der
          Auftragsverarbeitung
        </li>
        <li>Bei gesetzlicher Verpflichtung</li>
      </ul>

      <h2>5. Cookies und Tracking</h2>
      <p>
        klopilot.ch verwendet <strong>keine</strong> Werbe-Cookies und kein Cross-Site-Tracking. Wir
        setzen einen technisch notwendigen Session-Cookie für die Anmeldung. Plausible Analytics
        arbeitet cookiefrei.
      </p>

      <h2>6. Speicherdauer</h2>
      <p>
        Nutzerdaten werden so lange gespeichert, wie dein Konto aktiv ist. Inaktive Konten (keine
        Anmeldung seit 3 Jahren) werden automatisch gelöscht. Bewertungen und eingetragene Toiletten
        können nach der Kontolöschung in anonymisierter Form verbleiben.
      </p>

      <h2>7. Deine Rechte</h2>
      <p>Du hast das Recht auf:</p>
      <ul>
        <li>Auskunft über deine gespeicherten Daten</li>
        <li>Berichtigung unrichtiger Daten</li>
        <li>Löschung deiner Daten ("Recht auf Vergessenwerden")</li>
        <li>Datenportabilität</li>
        <li>Widerruf erteilter Einwilligungen</li>
      </ul>
      <p>
        Anträge richte an <a href="mailto:admin@4cpa.ch">admin@4cpa.ch</a>. Wir antworten innerhalb
        von 30 Tagen.
      </p>

      <h2>8. Kontakt Datenschutz</h2>
      <p>
        Bei Fragen zum Datenschutz: <a href="mailto:admin@4cpa.ch">admin@4cpa.ch</a>
      </p>
    </LegalPage>
  );
}
