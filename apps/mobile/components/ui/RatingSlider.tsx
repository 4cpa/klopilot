import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '@/lib/hooks';

interface Props {
  label: string;
  flowers: number;
  flies: number;
  onChange: (flowers: number, flies: number) => void;
}

export function RatingSlider({ label, flowers, flies, onChange }: Props) {
  const c = useThemeColors();
  const mode: 'flowers' | 'flies' | 'none' = flowers > 0 ? 'flowers' : flies > 0 ? 'flies' : 'none';

  function switchMode(m: 'flowers' | 'flies' | 'none') {
    onChange(0, 0);
    // setState through parent - nächster render setzt den Modus
  }

  function handleValue(v: number) {
    const current = mode === 'flowers' ? flowers : flies;
    const val = v === current ? 0 : v;
    if (mode === 'flowers' || mode === 'none') onChange(val, 0);
    else onChange(0, val);
  }

  const current = mode === 'flowers' ? flowers : mode === 'flies' ? flies : 0;

  return (
    <View style={[styles.container, { backgroundColor: c.cream }]}>
      <View style={styles.topRow}>
        <Text style={[styles.label, { color: c.ink }]}>{label}</Text>
        <View style={styles.modeRow}>
          {(['flowers', 'flies', 'none'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => {
                if (m === 'flowers') onChange(current > 0 && mode === 'flowers' ? 0 : 1, 0);
                else if (m === 'flies') onChange(0, current > 0 && mode === 'flies' ? 0 : 1);
                else onChange(0, 0);
              }}
              style={[
                styles.modeBtn,
                {
                  backgroundColor:
                    mode === m
                      ? m === 'flowers'
                        ? c.rateFlower
                        : m === 'flies'
                          ? c.rateFly
                          : c.muted
                      : c.line,
                },
              ]}
            >
              <Text style={styles.modeBtnText}>
                {m === 'flowers' ? '🌸' : m === 'flies' ? '🪰' : '—'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {mode !== 'none' && (
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((v) => (
            <TouchableOpacity
              key={v}
              onPress={() => handleValue(v)}
              style={[
                styles.starBtn,
                {
                  backgroundColor:
                    v <= current ? (mode === 'flowers' ? c.rateFlower : c.rateFly) : c.line,
                },
              ]}
            >
              <Text style={styles.starText}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, padding: 12, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: '600', flex: 1 },
  modeRow: { flexDirection: 'row', gap: 4 },
  modeBtn: {
    width: 30,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnText: { fontSize: 12 },
  starsRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  starBtn: {
    width: 40,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
