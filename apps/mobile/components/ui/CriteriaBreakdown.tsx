import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Rating } from '@/lib/api';
import { useThemeColors } from '@/lib/hooks';

type CriterionKey =
  | 'accessibility'
  | 'cleanliness'
  | 'hygiene'
  | 'style'
  | 'amenities'
  | 'safety'
  | 'inclusivity'
  | 'cost'
  | 'wait'
  | 'kids';

const CRITERIA: CriterionKey[] = [
  'accessibility',
  'cleanliness',
  'hygiene',
  'style',
  'amenities',
  'safety',
  'inclusivity',
  'cost',
  'wait',
  'kids',
];

const CRITERIA_EMOJI: Record<CriterionKey, string> = {
  accessibility: '♿',
  cleanliness: '🧹',
  hygiene: '🧼',
  style: '✨',
  amenities: '🧻',
  safety: '🔒',
  inclusivity: '🏳️‍🌈',
  cost: '💰',
  wait: '⏱️',
  kids: '👶',
};

function capitalize(k: string) {
  const cap = k.charAt(0).toUpperCase() + k.slice(1);
  return cap as Capitalize<typeof k>;
}

function computeBreakdown(ratings: Rating[]) {
  if (ratings.length === 0) return null;

  return CRITERIA.map((key) => {
    const flowersKey = `flowers${capitalize(key)}` as keyof Rating;
    const fliesKey = `flies${capitalize(key)}` as keyof Rating;

    const totalFlowers = ratings.reduce((s, r) => s + (r[flowersKey] as number), 0);
    const totalFlies = ratings.reduce((s, r) => s + (r[fliesKey] as number), 0);
    const avgFlowers = totalFlowers / ratings.length;
    const avgFlies = totalFlies / ratings.length;
    const net = avgFlowers - avgFlies;

    return { key, avgFlowers, avgFlies, net };
  });
}

interface Props {
  ratings: Rating[];
}

export function CriteriaBreakdown({ ratings }: Props) {
  const c = useThemeColors();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (ratings.length === 0) return null;

  const breakdown = computeBreakdown(ratings)!;
  const maxAbs = Math.max(...breakdown.map((b) => Math.max(b.avgFlowers, b.avgFlies, 0.1)));

  return (
    <View style={[styles.container, { borderTopColor: c.line, borderBottomColor: c.line }]}>
      <TouchableOpacity
        style={styles.toggle}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <Text style={[styles.toggleLabel, { color: c.ink }]}>{t('accessibility.title')}</Text>
        <Text style={[styles.chevron, { color: c.muted }]}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.rows}>
          {breakdown.map(({ key, avgFlowers, avgFlies, net }) => (
            <View key={key} style={styles.row}>
              {/* Label */}
              <View style={styles.labelCol}>
                <Text style={styles.criterionEmoji}>{CRITERIA_EMOJI[key]}</Text>
                <Text style={[styles.criterionLabel, { color: c.ink }]} numberOfLines={1}>
                  {t(`criteria.${key}`)}
                </Text>
              </View>

              {/* Bars */}
              <View style={styles.barsCol}>
                <MiniBar
                  value={avgFlowers}
                  max={maxAbs}
                  color={c.rateFlower}
                  bg={c.rateFlowerBg}
                  emoji="🌸"
                />
                <MiniBar
                  value={avgFlies}
                  max={maxAbs}
                  color={c.rateFly}
                  bg={c.rateFlyBg}
                  emoji="🪰"
                />
              </View>

              {/* Net */}
              <Text style={[styles.net, { color: net >= 0 ? c.rateFlower : c.rateFly }]}>
                {net >= 0 ? '+' : ''}
                {net.toFixed(1)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function MiniBar({
  value,
  max,
  color,
  bg,
  emoji,
}: {
  value: number;
  max: number;
  color: string;
  bg: string;
  emoji: string;
}) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={styles.miniBarRow}>
      <Text style={styles.miniEmoji}>{emoji}</Text>
      <View style={[styles.miniTrack, { backgroundColor: bg }]}>
        <View
          style={[styles.miniFill, { width: `${pct * 100}%` as any, backgroundColor: color }]}
        />
      </View>
      <Text style={[styles.miniVal, { color }]}>{value.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 2,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  chevron: { fontSize: 12 },

  rows: { paddingBottom: 8, gap: 10 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  labelCol: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 110 },
  criterionEmoji: { fontSize: 14, width: 20 },
  criterionLabel: { fontSize: 12, fontWeight: '500', flex: 1 },

  barsCol: { flex: 1, gap: 3 },

  miniBarRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniEmoji: { fontSize: 10, width: 14 },
  miniTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 3 },
  miniVal: { fontSize: 10, fontWeight: '700', width: 24, textAlign: 'right' },

  net: { fontSize: 13, fontWeight: '800', width: 36, textAlign: 'right' },
});
