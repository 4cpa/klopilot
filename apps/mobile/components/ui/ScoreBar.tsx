import { View, Text, StyleSheet } from 'react-native';
import type { Score } from '@/lib/api';
import { useThemeColors } from '@/lib/hooks';

interface Props {
  score: Score;
}

export function ScoreBar({ score }: Props) {
  const c = useThemeColors();

  if (score.count === 0) {
    return <Text style={[styles.empty, { color: c.muted }]}>Noch keine Bewertungen</Text>;
  }

  const flowerPct = Math.min(1, score.flowers / 5);
  const flyPct = Math.min(1, score.flies / 5);

  return (
    <View style={styles.container}>
      <BarRow
        emoji="🌸"
        pct={flowerPct}
        value={score.flowers}
        color={c.rateFlower}
        bg={c.rateFlowerBg}
      />
      <BarRow emoji="🪰" pct={flyPct} value={score.flies} color={c.rateFly} bg={c.rateFlyBg} />
      <Text style={[styles.count, { color: c.muted }]}>
        {score.count} Bewertung{score.count !== 1 ? 'en' : ''}
      </Text>
    </View>
  );
}

function BarRow({
  emoji,
  pct,
  value,
  color,
  bg,
}: {
  emoji: string;
  pct: number;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={[styles.track, { backgroundColor: bg }]}>
        <View style={[styles.fill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.val, { color }]}>{value.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  empty: { fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emoji: { fontSize: 18, width: 24 },
  track: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  val: { fontSize: 13, fontWeight: '700', width: 28, textAlign: 'right' },
  count: { fontSize: 12, textAlign: 'right', marginTop: 2 },
});
