import { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { toiletsApi, type Toilet, type Rating } from '@/lib/api';
import { useThemeColors } from '@/lib/hooks';
import { useMapTarget } from '@/lib/map-target';
import { MapScreen } from '@/components/map/MapScreen';
import { ToiletSheet } from '@/components/sheets/ToiletSheet';
import { RatingSheet } from '@/components/sheets/RatingSheet';
import { CATEGORY_EMOJI } from '@klopilot/shared-types';

const FILTER_CATS = [
  'public',
  'nette_toilette',
  'gastronomy',
  'transport',
  'mall',
  'event',
] as const;

const RADIUS_OPTIONS = [
  { value: 500, label: '500 m' },
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
] as const;

export default function KarteTab() {
  const c = useThemeColors();
  const { t } = useTranslation();
  const { target: mapTarget, setTarget: setMapTarget } = useMapTarget();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [fetchCenter, setFetchCenter] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [cameraTarget, setCameraTarget] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'none' | 'detail' | 'rate'>('none');
  const [initialRating, setInitialRating] = useState<Rating | undefined>(undefined);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [freeOnly, setFreeOnly] = useState(false);
  const [accessOnly, setAccessOnly] = useState(false);
  const [radius, setRadius] = useState(2000);
  const [focusTick, setFocusTick] = useState(0);
  const [offline, setOffline] = useState(false);
  const callIdRef = useRef(0);
  const CACHE_KEY = 'klo_cache_toilets';

  useEffect(() => {
    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (status !== 'granted') return;
        return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      })
      .then((pos) => {
        if (pos) setLocation(pos.coords);
      })
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (mapTarget) {
        setCameraTarget({ ...mapTarget });
        setFetchCenter({ ...mapTarget });
        setMapTarget(null);
      }
      setFocusTick((t) => t + 1);
    }, [mapTarget, setMapTarget]),
  );

  useEffect(() => {
    const callId = ++callIdRef.current;
    const center = fetchCenter ?? location;
    const lng = center?.longitude ?? 7.4474;
    const lat = center?.latitude ?? 46.9481;
    toiletsApi
      .nearby(lng, lat, radius, activeFilters.length ? activeFilters : undefined)
      .then((t) => {
        if (callIdRef.current !== callId) return;
        setToilets(t);
        setOffline(false);
        SecureStore.setItemAsync(CACHE_KEY, JSON.stringify(t.slice(0, 100))).catch(() => {});
      })
      .catch(async () => {
        if (callIdRef.current !== callId) return;
        const cached = await SecureStore.getItemAsync(CACHE_KEY).catch(() => null);
        if (cached) {
          setToilets(JSON.parse(cached) as Toilet[]);
          setOffline(true);
        }
      });
    // focusTick ist gewollte Abhängigkeit
     
  }, [location, fetchCenter, activeFilters, radius, focusTick]);

  const visibleToilets = toilets.filter(
    (t) => (!freeOnly || !t.feeChf) && (!accessOnly || t.accessibility?.wheelchair === true),
  );

  function toggleFilter(cat: string) {
    setActiveFilters((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setSheet('detail');
  }, []);

  const handleRate = useCallback((id: string, rating?: Rating) => {
    setSelectedId(id);
    setInitialRating(rating);
    setSheet('rate');
  }, []);

  const handleClose = useCallback(() => setSheet('none'), []);

  const handleRatingSaved = useCallback(() => {
    setFocusTick((t) => t + 1);
    setSheet('detail');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: c.paper }]}>
      <MapScreen
        toilets={visibleToilets}
        userLocation={location}
        cameraTarget={cameraTarget}
        onSelectToilet={handleSelect}
      />

      {offline && (
        <View style={[styles.offlineBanner, { backgroundColor: '#FF6B35' }]}>
          <Text style={styles.offlineText}>📡 Offline — letzte gespeicherte Toiletten</Text>
        </View>
      )}

      <View
        style={[styles.filterBar, { backgroundColor: c.surface + 'EE', top: offline ? 86 : 54 }]}
      >
        {/* Kategorie- + Extra-Filter-Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_CATS.map((cat) => {
            const active = activeFilters.includes(cat);
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => toggleFilter(cat)}
                style={[
                  styles.chip,
                  { borderColor: c.line, backgroundColor: active ? c.brandPrimary : c.cream },
                ]}
                activeOpacity={0.7}
              >
                <Text style={styles.chipEmoji}>{CATEGORY_EMOJI[cat]}</Text>
                <Text style={[styles.chipLabel, { color: active ? '#fff' : c.ink }]}>
                  {t(`category.${cat}`)}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={[styles.chipDivider, { backgroundColor: c.line }]} />

          <TouchableOpacity
            onPress={() => setFreeOnly((v) => !v)}
            style={[
              styles.chip,
              { borderColor: c.line, backgroundColor: freeOnly ? c.brandMint : c.cream },
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.chipEmoji}>🆓</Text>
            <Text style={[styles.chipLabel, { color: freeOnly ? '#fff' : c.ink }]}>
              {t('filter.free')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setAccessOnly((v) => !v)}
            style={[
              styles.chip,
              { borderColor: c.line, backgroundColor: accessOnly ? c.brandMint : c.cream },
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.chipEmoji}>♿</Text>
            <Text style={[styles.chipLabel, { color: accessOnly ? '#fff' : c.ink }]}>
              {t('filter.accessible')}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Radius-Picker */}
        <View style={[styles.radiusRow, { borderTopColor: c.line }]}>
          <Text style={[styles.radiusLabel, { color: c.muted }]}>{t('filter.radius')}</Text>
          <View style={styles.radiusSegment}>
            {RADIUS_OPTIONS.map((opt) => {
              const active = radius === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setRadius(opt.value)}
                  style={[
                    styles.radiusBtn,
                    {
                      backgroundColor: active ? c.brandPrimary : 'transparent',
                      borderColor: active ? c.brandPrimary : c.line,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.radiusBtnText, { color: active ? '#fff' : c.muted }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {sheet === 'detail' && selectedId && (
        <ToiletSheet toiletId={selectedId} onClose={handleClose} onRate={handleRate} />
      )}

      {sheet === 'rate' && selectedId && (
        <RatingSheet
          toiletId={selectedId}
          initialRating={initialRating}
          onClose={() => setSheet('detail')}
          onSaved={handleRatingSaved}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  offlineBanner: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    paddingVertical: 6,
    alignItems: 'center',
    zIndex: 20,
  },
  offlineText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  filterBar: { position: 'absolute', left: 0, right: 0 },
  filterScroll: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 12, fontWeight: '600' },
  chipDivider: { width: 1, height: 24, alignSelf: 'center', marginHorizontal: 4 },

  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  radiusLabel: { fontSize: 11, fontWeight: '600' },
  radiusSegment: { flexDirection: 'row', flex: 1, borderRadius: 10, overflow: 'hidden', gap: 4 },
  radiusBtn: { flex: 1, alignItems: 'center', paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  radiusBtnText: { fontSize: 11, fontWeight: '700' },
});
