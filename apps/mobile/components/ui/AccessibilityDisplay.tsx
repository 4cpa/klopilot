import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Accessibility } from '@klopilot/shared-types';
import { useThemeColors } from '@/lib/hooks';

type Feature = keyof Accessibility;

const FEATURES: { key: Feature; emoji: string }[] = [
  { key: 'wheelchair', emoji: '♿' },
  { key: 'baby_changing', emoji: '👶' },
  { key: 'euro_key', emoji: '🔑' },
  { key: 'gender_neutral', emoji: '🏳️' },
  { key: 'step_free', emoji: '🚶' },
  { key: 'shower', emoji: '🚿' },
];

interface Props {
  accessibility: Accessibility;
}

export function AccessibilityDisplay({ accessibility }: Props) {
  const c = useThemeColors();
  const { t } = useTranslation();

  const active = FEATURES.filter((f) => accessibility[f.key] === true);

  return (
    <View style={[styles.container, { borderTopColor: c.line }]}>
      <Text style={[styles.label, { color: c.muted }]}>{t('accessibility.title')}</Text>
      {active.length === 0 ? (
        <Text style={[styles.none, { color: c.muted }]}>{t('accessibility.none')}</Text>
      ) : (
        <View style={styles.chips}>
          {active.map((f) => (
            <View
              key={f.key}
              style={[styles.chip, { backgroundColor: c.cream, borderColor: c.line }]}
            >
              <Text style={styles.chipEmoji}>{f.emoji}</Text>
              <Text style={[styles.chipLabel, { color: c.ink }]}>
                {t(`accessibility.${f.key}`)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  none: { fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 13, fontWeight: '500' },
});
