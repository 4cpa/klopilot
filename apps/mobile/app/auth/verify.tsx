import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/lib/api';
import { authStore } from '@/lib/auth-store';
import { useAuth, useThemeColors } from '@/lib/hooks';

export default function VerifyScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  // Bereits eingeloggt — direkt weiterleiten (Expo Go re-öffnet Deep Links beim Reload)
  useEffect(() => {
    if (!loading && user && !done) {
      router.replace('/(tabs)');
    }
  }, [loading, user, done, router]);

  useEffect(() => {
    if (loading || done) return; // warten bis Auth-Init fertig
    if (user) return; // bereits eingeloggt, oben behandelt
    if (!token) {
      setStatus('error');
      setMsg(t('verify.no_token'));
      return;
    }

    setDone(true);
    authApi
      .verify(token)
      .then(({ accessToken, refreshToken }) => authStore.login(accessToken, refreshToken))
      .then(() => {
        setStatus('ok');
        setTimeout(() => router.replace('/(tabs)'), 1200);
      })
      .catch((e) => {
        setStatus('error');
        setMsg(e.message ?? t('verify.expired'));
      });
  }, [loading, user, token, done, router]);

  return (
    <View style={[styles.container, { backgroundColor: c.paper }]}>
      <Text style={styles.logo}>🚽</Text>
      <Text style={[styles.title, { color: c.ink }]}>klopilot</Text>

      {status === 'loading' && (
        <>
          <ActivityIndicator color={c.brandPrimary} size="large" style={styles.spinner} />
          <Text style={[styles.text, { color: c.muted }]}>{t('verify.loading')}</Text>
        </>
      )}

      {status === 'ok' && (
        <>
          <Text style={styles.emoji}>✅</Text>
          <Text style={[styles.text, { color: c.ink }]}>{t('verify.success')}</Text>
        </>
      )}

      {status === 'error' && (
        <>
          <Text style={styles.emoji}>❌</Text>
          <Text style={[styles.text, { color: c.brandBerry }]}>{msg}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  logo: { fontSize: 56 },
  title: { fontSize: 28, fontWeight: '700' },
  spinner: { marginTop: 16 },
  emoji: { fontSize: 48, marginTop: 16 },
  text: { fontSize: 16, textAlign: 'center', paddingHorizontal: 32 },
});
