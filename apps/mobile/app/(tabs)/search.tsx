import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { searchApi, type Toilet, type Rating } from '@/lib/api';
import { useThemeColors } from '@/lib/hooks';
import { useMapTarget } from '@/lib/map-target';
import { ToiletSheet } from '@/components/sheets/ToiletSheet';
import { RatingSheet } from '@/components/sheets/RatingSheet';
import { CATEGORY_EMOJI, formatDistance, formatFee, scoreNetColor } from '@klopilot/shared-types';

const FILTER_CATS = [
  'public',
  'nette_toilette',
  'gastronomy',
  'transport',
  'mall',
  'event',
] as const;
const RECENT_KEY = 'klo_recent_searches';
const MAX_RECENT = 6;

async function loadRecent(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function saveRecent(q: string) {
  const trimmed = q.trim();
  if (!trimmed) return;
  const prev = await loadRecent();
  const next = [trimmed, ...prev.filter((s) => s !== trimmed)].slice(0, MAX_RECENT);
  await SecureStore.setItemAsync(RECENT_KEY, JSON.stringify(next)).catch(() => {});
}

function HighlightText({
  text,
  query,
  style,
  highlightColor,
}: {
  text: string;
  query: string;
  style: object;
  highlightColor: string;
}) {
  const q = query.trim().toLowerCase();
  if (!q) return <Text style={style}>{text}</Text>;
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return <Text style={style}>{text}</Text>;
  return (
    <Text style={style}>
      {text.slice(0, idx)}
      <Text style={{ fontWeight: '900', color: highlightColor }}>
        {text.slice(idx, idx + q.length)}
      </Text>
      {text.slice(idx + q.length)}
    </Text>
  );
}

export default function SucheTab() {
  const c = useThemeColors();
  const { t } = useTranslation();
  const { setTarget } = useMapTarget();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Toilet[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'none' | 'detail' | 'rate'>('none');
  const [initialRating, setInitialRating] = useState<Rating | undefined>(undefined);

  const locationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadRecent().then(setRecent);
    Location.getLastKnownPositionAsync()
      .then((pos) => {
        if (pos) locationRef.current = pos.coords;
      })
      .catch(() => {});
  }, []);

  const runSearch = useCallback(async (q: string, cats: string[]) => {
    setLoading(true);
    setSearched(true);
    try {
      const loc = locationRef.current ?? undefined;
      const { results: hits } = await searchApi.search(
        q.trim(),
        cats.length ? cats : undefined,
        loc,
      );
      setResults(hits);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (text.trim() || activeFilters.length) runSearch(text, activeFilters);
    }, 320);
  }

  async function handleSubmit() {
    if (query.trim()) await saveRecent(query);
    loadRecent().then(setRecent);
    runSearch(query, activeFilters);
  }

  function handleRecentTap(q: string) {
    setQuery(q);
    setFocused(false);
    runSearch(q, activeFilters);
  }

  function handleClear() {
    setQuery('');
    setResults([]);
    setSearched(false);
  }

  function toggleFilter(cat: string) {
    const next = activeFilters.includes(cat)
      ? activeFilters.filter((c) => c !== cat)
      : [...activeFilters, cat];
    setActiveFilters(next);
    if (query.trim() || next.length) runSearch(query, next);
  }

  const showRecent = focused && query.length === 0 && recent.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: c.paper }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.surface, borderBottomColor: c.line }]}>
        <Text style={[styles.title, { color: c.ink }]}>{t('search.title')}</Text>

        {/* Suchfeld */}
        <View
          style={[
            styles.searchRow,
            { backgroundColor: c.cream, borderColor: focused ? c.brandPrimary : c.line },
          ]}
        >
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            style={[styles.input, { color: c.ink }]}
            placeholder={t('search.placeholder')}
            placeholderTextColor={c.muted}
            value={query}
            onChangeText={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Text style={{ color: c.muted, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Suchverlauf */}
        {showRecent && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentScroll}
            keyboardShouldPersistTaps="always"
          >
            <Text style={[styles.recentLabel, { color: c.muted }]}>{t('search.recent')}</Text>
            {recent.map((q) => (
              <TouchableOpacity
                key={q}
                onPress={() => handleRecentTap(q)}
                style={[styles.recentChip, { backgroundColor: c.cream, borderColor: c.line }]}
              >
                <Text style={[styles.recentChipText, { color: c.ink }]}>🕐 {q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Kategorie-Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          keyboardShouldPersistTaps="always"
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
        </ScrollView>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={c.brandPrimary} size="large" />
        </View>
      )}

      {!loading && searched && results.length === 0 && (
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>🚽</Text>
          <Text style={[styles.emptyText, { color: c.muted }]}>
            {query ? t('search.no_results', { query }) : t('search.no_results_generic')}
          </Text>
        </View>
      )}

      {!loading && !searched && (
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>🔍</Text>
          <Text style={[styles.emptyText, { color: c.muted }]}>{t('search.hint')}</Text>
        </View>
      )}

      {sheet === 'detail' && selectedId && (
        <ToiletSheet
          toiletId={selectedId}
          onClose={() => setSheet('none')}
          onRate={(id, rating) => {
            setSelectedId(id);
            setInitialRating(rating);
            setSheet('rate');
          }}
        />
      )}
      {sheet === 'rate' && selectedId && (
        <RatingSheet
          toiletId={selectedId}
          initialRating={initialRating}
          onClose={() => setSheet('detail')}
          onSaved={() => setSheet('detail')}
        />
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}
            onPress={() => {
              setSelectedId(item.id);
              setSheet('detail');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.cardRow}>
              <Text style={{ fontSize: 24 }}>{CATEGORY_EMOJI[item.category] ?? '🚻'}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.cardNameRow}>
                  <HighlightText
                    text={item.name}
                    query={query}
                    style={[styles.cardName, { color: c.ink }]}
                    highlightColor={c.brandPrimary}
                  />
                  {item.verified && (
                    <Text style={[styles.verifiedTag, { color: c.brandMint }]}>✓</Text>
                  )}
                  {item.partner && <Text style={styles.partnerTag}>🤝</Text>}
                </View>
                <Text style={[styles.cardMeta, { color: c.muted }]} numberOfLines={1}>
                  {t(`category.${item.category}`, { defaultValue: item.category })}
                  {item.distanceM != null ? ` · ${formatDistance(item.distanceM)}` : ''}
                  {item.feeChf != null ? ` · ${formatFee(item.feeChf)}` : ''}
                  {item.address ? ` · ${item.address}` : ''}
                </Text>
              </View>
              {item.score && item.score.count > 0 && (
                <View style={[styles.scoreBadge, { backgroundColor: scoreNetColor(item.score) }]}>
                  <Text style={styles.scoreText}>{item.score.net.toFixed(1)}</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => {
                  setTarget({ latitude: item.latitude, longitude: item.longitude });
                  router.navigate('/');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.mapBtn}
              >
                <Text style={{ fontSize: 18 }}>🗺️</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 1 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 10 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 6,
  },
  input: { flex: 1, fontSize: 16 },
  recentScroll: { paddingVertical: 4, gap: 6, paddingBottom: 4, alignItems: 'center' },
  recentLabel: { fontSize: 12, fontWeight: '600', marginRight: 2 },
  recentChip: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  recentChipText: { fontSize: 13 },
  filterScroll: { paddingVertical: 4, gap: 8, paddingBottom: 8 },
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15 },
  card: { borderRadius: 12, padding: 12, borderWidth: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  cardName: { fontSize: 15, fontWeight: '600' },
  verifiedTag: { fontSize: 13, fontWeight: '800' },
  partnerTag: { fontSize: 13 },
  cardMeta: { fontSize: 12, marginTop: 1 },
  scoreBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: { color: 'white', fontSize: 12, fontWeight: '700' },
  mapBtn: { padding: 4 },
});
