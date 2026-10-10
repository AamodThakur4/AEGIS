import { StrictMode, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import '@/index.css';
import { LocationProvider } from '@/context/LocationContext';
import { CitizenShell } from '@/shell';
import type { CitizenPage } from '@/types';


type RootedElement = HTMLElement & { __aegisRoot?: Root };

function renderApp(node: ReactNode): void {
  const host = document.getElementById('root');
  if (!host) throw new Error('#root missing from this document');

  const rooted = host as RootedElement;
  rooted.__aegisRoot ??= createRoot(host);
  rooted.__aegisRoot.render(<StrictMode>{node}</StrictMode>);
}

export function mountCitizen(page: CitizenPage | null, content: ReactNode, locate = false): void {
  const body = <CitizenShell page={page}>{content}</CitizenShell>;
  renderApp(locate ? <LocationProvider>{body}</LocationProvider> : body);
}

export function mountLanding(content: ReactNode): void {
  mountCitizen(null, content, false);
}

export function mountCommand(content: ReactNode): void {
  renderApp(<LocationProvider>{content}</LocationProvider>);
}
