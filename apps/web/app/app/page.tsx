import type { Metadata } from 'next';
import { AppComingSoon } from './AppComingSoon';

export const metadata: Metadata = {
  title: 'Mobile App — klopilot.ch',
  description:
    'klopilot für iOS und Android — Toiletten finden, bewerten und melden, überall dabei. In Kürze verfügbar.',
};

export default function AppPage() {
  return <AppComingSoon />;
}
