import { type ReactNode } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { LocationContext, type LocationValue } from './location';

export function LocationProvider({ children }: { children: ReactNode }) {
  const value: LocationValue = useGeolocation({ autoStart: true, watch: true });
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}
