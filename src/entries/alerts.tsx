import { mountCitizen } from '@/entries/mount';
import { AlertsPage } from '@/pages/AlertsPage';
import { alerts } from '@/data';
import { useIncidents, useResources } from '@/store';

export function AlertsScreen() {
  const [resources] = useResources();
  const [incidents] = useIncidents();
  return <AlertsPage alerts={alerts} resources={resources} incidents={incidents} />;
}

mountCitizen('alerts', <AlertsScreen />);
