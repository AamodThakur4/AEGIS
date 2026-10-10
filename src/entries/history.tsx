import { mountCitizen } from '@/entries/mount';
import { HistoryPage } from '@/pages/HistoryPage';
import { useIncidents } from '@/store';

export function HistoryScreen() {
  const [incidents] = useIncidents();
  return <HistoryPage incidents={incidents} />;
}

mountCitizen('history', <HistoryScreen />);
