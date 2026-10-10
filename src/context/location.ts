import { createContext, useContext } from 'react';
import type { Coordinates, GeolocationStatus } from '@/hooks/useGeolocation';

export interface LocationValue {
  status: GeolocationStatus;
  coords: Coordinates | null;
  message: string | null;
  start: () => void;
}

export const LocationContext = createContext<LocationValue | null>(null);

export function useLocation(): LocationValue {
  const value = useContext(LocationContext);
  if (!value) {
    throw new Error('useLocation must be used inside <LocationProvider>');
  }
  return value;
}

export function useOptionalLocation(): LocationValue | null {
  return useContext(LocationContext);
}

export function formatCoords(coords: Coordinates | null): string | null {
  if (!coords) return null;
  return `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
}
