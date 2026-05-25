import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/lib/hooks';

export const ONBOARDED_KEY = 'klo_onboarded';

const SLIDES = ['welcome', 'map', 'rate', 'location'] as const;
type SlideKey = (typeof SLIDES)[number];

const SLIDE_EMOJI: Record<SlideKey, string> = {
  welcome: '🚽',
  map: '🗺️',
  rate: '🌸',
  location: '📍',
};

async function completeOnboarding() {
  await SecureStore.setItemAsync(ONBOARDED_KEY, '1').catch(() => {});
}

export default function OnboardingScreen() {
  const c = useThemeColors();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [locLoading, setLocLoading] = useState(false);
  const listRef = useRef<FlatList<SlideKey>>(null);

  const isLast = index === SLIDES.length - 1;

  function scrollTo(i: number) {
    listRef.current?.scrollToIndex({ index: i, animated: true });
    setIndex(i);
  }

  async function handleNext() {
    if (!isLast) {
      scrollTo(index + 1);
      return;
    }
    setLocLoading(true);
    await Location.requestForegroundPermissionsAsync().catch(() => {});
    setLocLoading(false);
    await completeOnboarding();
    router.replace('/');
  }

  async function handleSkip() {
    await completeOnboarding();
    router.replace('/');
  }

  return (
    <View style={[styles.root, { backgroundColor: c.paper }]}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{SLIDE_EMOJI[item]}</Text>
            <Text style={[styles.slideTitle, { color: c.ink }]}>
              {t(`onboarding.${item}_title`)}
            </Text>
            <Text style={[styles.slideBody, { color: c.muted }]}>
              {t(`onboarding.${item}_body`)}
            </Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: i === index ? c.brandPrimary : c.line }]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={[styles.footer, { paddingBottom: Platform.OS === 'ios' ? 48 : 28 }]}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={locLoading}
          style={[
            styles.nextBtn,
            { backgroundColor: c.brandPrimary, opacity: locLoading ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? t('onboarding.go') : t('onboarding.next')}
          </Text>
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: c.muted }]}>{t('onboarding.skip')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  emoji: { fontSize: 80 },
  slideTitle: { fontSize: 26, fontWeight: '800', textAlign: 'center', lineHeight: 34 },
  slideBody: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 24, gap: 8 },
  nextBtn: { borderRadius: 16, padding: 18, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  skipBtn: { alignItems: 'center', padding: 12 },
  skipText: { fontSize: 15 },
});
