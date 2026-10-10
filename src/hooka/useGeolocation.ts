import { useCallback, useEffect, useRef, useState } from 'react';

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy: number | null;
  at: number;
}

export type GeolocationStatus =
  | 'idle'
  | 'locating'
  | 'ready'
  | 'denied'
  | 'unsupported'
  | 'unavailable';

export interface GeolocationState {
  status: GeolocationStatus;
  coords: Coordinates | null;
  message: string | null;
}

function toCoordinates(pos: GeolocationPosition): Coordinates {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : null,
    at: pos.timestamp,
  };
}

export function isGeolocationAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator && window.isSecureContext;
}

const DENIED_MESSAGE =
  'Location is blocked for this site. Open the padlock icon in the address bar, set Location to Allow, then press Locate me — or tell the operator your area.';
const UNAVAILABLE_MESSAGE =
  'Could not get a location fix from this device. Press Locate me to try again.';

export function getCurrentCoordinates(timeoutMs = 8000): Promise<
  { coords: Coordinates; error?: undefined } | { coords?: undefined; error: string }
> {
  if (!isGeolocationAvailable()) {
    return Promise.resolve({ error: 'This browser does not support geolocation.' });
  }
  return new Promise((resolve) => {
    const attempt = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ coords: toCoordinates(pos) }),
        (err) => {
          if (err.code !== err.PERMISSION_DENIED && highAccuracy) {
            attempt(false);
            return;
          }
          resolve({
            error:
              err.code === err.PERMISSION_DENIED ? DENIED_MESSAGE : UNAVAILABLE_MESSAGE,
          });
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? timeoutMs : Math.max(timeoutMs, 20000),
          maximumAge: 0,
        },
      );
    };
    attempt(true);
  });
}

interface UseGeolocationOptions {
  autoStart?: boolean;
  watch?: boolean;
}

export function useGeolocation(
  { autoStart = false, watch = false }: UseGeolocationOptions = {},
): GeolocationState & { start: () => void } {
  const [state, setState] = useState<GeolocationState>({
    status: 'idle',
    coords: null,
    message: null,
  });
  const watchIdRef = useRef<number | null>(null);

  const start = useCallback(() => {
    if (!isGeolocationAvailable()) {
      setState({
        status: 'unsupported',
        coords: null,
        message: 'Geolocation needs a secure context — use https:// or localhost.',
      });
      return;
    }
    setState((prev) => ({ ...prev, status: prev.coords ? 'ready' : 'locating' }));

    const attach = (highAccuracy: boolean) => {
      const opts: PositionOptions = {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 10000 : 20000,
        maximumAge: 5000,
      };

      const onPos = (pos: GeolocationPosition) =>
        setState({ status: 'ready', coords: toCoordinates(pos), message: null });

      const onErr = (err: GeolocationPositionError) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState((prev) => ({
            status: 'denied',
            coords: prev.coords,
            message: DENIED_MESSAGE,
          }));
          return;
        }
        if (highAccuracy) {
          attach(false);
          return;
        }
        setState((prev) => ({
          status: 'unavailable',
          coords: prev.coords,
          message: UNAVAILABLE_MESSAGE,
        }));
      };

      if (watch) {
        if (watchIdRef.current !== null && 'geolocation' in navigator) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        watchIdRef.current = navigator.geolocation.watchPosition(onPos, onErr, opts);
      } else {
        navigator.geolocation.getCurrentPosition(onPos, onErr, opts);
      }
    };

    attach(true);
  }, [watch]);

  useEffect(() => {
    if (autoStart) start();
  }, [autoStart, start]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return { ...state, start };
}
