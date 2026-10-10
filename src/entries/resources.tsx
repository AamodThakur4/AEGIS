import { useState } from 'react';
import { mountCitizen } from '@/entries/mount';
import { ResourcesPage } from '@/pages/ResourcesPage';
import { K_RESOURCE_FILTER, useResources } from '@/store';
import type { ResourceType } from '@/types';

export function ResourcesScreen() {
  const [resources] = useResources();

  const [initialType] = useState<ResourceType | 'all'>(() => {
    const saved = window.sessionStorage.getItem(K_RESOURCE_FILTER);
    window.sessionStorage.removeItem(K_RESOURCE_FILTER);
    return (saved as ResourceType | 'all') ?? 'all';
  });

  return <ResourcesPage resources={resources} initialType={initialType} />;
}

mountCitizen('resources', <ResourcesScreen />);
