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
    navigator.geolocation.getCurrentPosition(
      (p) => setPos([p.coords.longitude, p.coords.latitude]),
      () => setError('Standort nicht freigegeben'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  return { pos, error };
}
