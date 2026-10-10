import { mountCitizen } from '@/entries/mount';
import { MapPage } from '@/pages/MapPage';
import { useIncidents, useResources } from '@/store';

export function MapScreen() {
  const [resources] = useResources();
  const [incidents] = useIncidents();
  return <MapPage resources={resources} incidents={incidents} />;
}

mountCitizen('map', <MapScreen />, true);
