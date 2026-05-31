'use client';

import { useState, useEffect, useCallback } from 'react';
import { authStore, type User } from './auth-store';

export function useAuth() {
  const [user, setUser] = useState<User | null>(authStore.getUser());
  const [loading, setLoading] = useState(authStore.isLoading());

  useEffect(() => {
    const unsub = authStore.subscribe(() => {
      setUser(authStore.getUser());
      setLoading(authStore.isLoading());
    });
    return () => {
      unsub();
    };
  }, []);

  return { user, loading, logout: authStore.logout };
}

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    const saved = (localStorage.getItem('klo-theme') as 'light' | 'dark' | 'system') ?? 'system';
    setTheme(saved);
  }, []);

  const apply = useCallback((t: 'light' | 'dark' | 'system') => {
    setTheme(t);
    localStorage.setItem('klo-theme', t);
    const dark =
      t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, []);

  return { theme, setTheme: apply };
}

export function useGeoLocation() {
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation nicht verfügbar');
      return;
    }
    const onOk = (p: GeolocationPosition) => setPos([p.coords.longitude, p.coords.latitude]);

    // Erst grobe, schnelle Ortung (WLAN/IP — funktioniert auch ohne GPS, z. B.
    // auf Desktops). Bei Fehler/Timeout ein Versuch mit hoher Genauigkeit.
    navigator.geolocation.getCurrentPosition(
      onOk,
      () => {
        navigator.geolocation.getCurrentPosition(
          onOk,
          (e) =>
            setError(
              e.code === e.PERMISSION_DENIED
                ? 'Standort nicht freigegeben'
                : 'Standort nicht verfügbar',
            ),
          { enableHighAccuracy: true, timeout: 10000 },
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }, []);

  return { pos, error };
}
