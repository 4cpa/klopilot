import '@/lib/i18n';
import { useEffect, useRef, useState } from 'react';
import { Stack, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { authStore } from '@/lib/auth-store';
import { initLanguage } from '@/lib/i18n';
import { ONBOARDED_KEY } from './onboarding';
import { ToiletSheet } from '@/components/sheets/ToiletSheet';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const scheme = useColorScheme();
  const [notifToiletId, setNotifToiletId] = useState<string | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    Promise.all([authStore.init(), initLanguage()])
      .then(async () => {
        const onboarded = await SecureStore.getItemAsync(ONBOARDED_KEY).catch(() => null);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!onboarded) router.replace('/onboarding' as any);
      })
      .finally(() => {
        SplashScreen.hideAsync().catch(() => {});
      });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data?.screen === 'toilet' && typeof data.toiletId === 'string') {
        router.navigate('/');
        setNotifToiletId(data.toiletId);
      }
    });

    return () => {
      responseListener.current?.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
      {notifToiletId && (
        <ToiletSheet
          toiletId={notifToiletId}
          onClose={() => setNotifToiletId(null)}
          onRate={() => setNotifToiletId(null)}
        />
      )}
    </GestureHandlerRootView>
  );
}
