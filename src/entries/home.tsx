import { mountCitizen } from '@/entries/mount';
import { HomePage } from '@/pages/HomePage';
import { alerts } from '@/data';
import { go } from '@/navigation';
import { useIncidents, useResources } from '@/store';

export function HomeScreen() {
  const [resources] = useResources();
  const [incidents] = useIncidents();
  return <HomePage alerts={alerts} resources={resources} incidents={incidents} onNavigate={go} />;
}

mountCitizen('home', <HomeScreen />, true);
