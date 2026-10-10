import type { CitizenPage, ResourceType } from '@/types';
import { K_RESOURCE_FILTER } from '@/store';

export const PAGE_URL: Record<CitizenPage, string> = {
  home: '/home.html',
  map: '/map.html',
  resources: '/resources.html',
  alerts: '/alerts.html',
  history: '/history.html',
};

export const LANDING_URL = '/index.html';
export const COMMAND_URL = '/command.html';

export function go(page: string, type?: ResourceType): void {
  if (type) window.sessionStorage.setItem(K_RESOURCE_FILTER, type);
  else if (page === 'resources') window.sessionStorage.removeItem(K_RESOURCE_FILTER);
  window.location.assign(PAGE_URL[page as CitizenPage] ?? LANDING_URL);
}
