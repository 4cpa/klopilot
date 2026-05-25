import { useState, useEffect, useRef } from 'react';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { authStore } from './auth-store';
import { themeStore } from './theme-store';
import { changeLanguage } from './i18n';
import { registerPushToken } from './push-notifications';
import type { User } from './api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(authStore.getUser());
  const [loading, setLoading] = useState(authStore.isLoading());
  const registeredRef = useRef(false);

  useEffect(() => {
    const unsub = authStore.subscribe(() => {
      setUser(authStore.getUser());
      setLoading(authStore.isLoading());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (user && !registeredRef.current) {
      registeredRef.current = true;
      registerPushToken().catch(() => {});
    }
    if (!user) registeredRef.current = false;
  }, [user]);

  return { user, loading, logout: authStore.logout };
}

export function useLocale() {
  const { i18n } = useTranslation();
  return { locale: i18n.language, changeLanguage };
}

export function useThemeMode() {
  const [mode, setMode] = useState(themeStore.getMode());
  useEffect(() => themeStore.subscribe(() => setMode(themeStore.getMode())), []);
  return { mode, cycle: themeStore.cycle };
}

export function useThemeColors() {
  const scheme = useColorScheme();
  const [mode, setMode] = useState(themeStore.getMode());
  useEffect(() => themeStore.subscribe(() => setMode(themeStore.getMode())), []);
  const dark = mode === 'dark' || (mode === 'system' && scheme === 'dark');

  return {
    dark,
    paper: dark ? '#0E1117' : '#FFFBF2',
    cream: dark ? '#1F2630' : '#FFF3DC',
    surface: dark ? '#161B22' : '#FFFFFF',
    ink: dark ? '#F4EFE6' : '#0B132B',
    muted: dark ? '#9AA4B2' : '#6B7280',
    line: dark ? '#2A313C' : '#E7E0CF',
    brandPrimary: dark ? '#FF8B5C' : '#FF6B35',
    brandSecondary: dark ? '#FFE066' : '#FFD23F',
    brandMint: dark ? '#3FE8B7' : '#06D6A0',
    brandBerry: dark ? '#FF6B8A' : '#EF476F',
    brandSky: '#118AB2',
    rateFlower: dark ? '#FF7AB3' : '#E91E63',
    rateFlowerBg: dark ? '#3A1929' : '#FFE4EE',
    rateFly: dark ? '#9AA4B2' : '#374151',
    rateFlyBg: dark ? '#1F2630' : '#F3F4F6',
  };
}
