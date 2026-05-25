import { View, Text, Switch, StyleSheet } from 'react-native';
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
  value: Accessibility;
  onChange: (v: Accessibility) => void;
}

export function AccessibilityEditor({ value, onChange }: Props) {
  const c = useThemeColors();
  const { t } = useTranslation();

  function toggle(key: Feature, on: boolean) {
    onChange({ ...value, [key]: on });
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: c.ink }]}>{t('accessibility.title')}</Text>
      {FEATURES.map(({ key, emoji }) => (
        <View key={key} style={[styles.row, { borderBottomColor: c.line }]}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={[styles.featureLabel, { color: c.ink }]}>{t(`accessibility.${key}`)}</Text>
          <Switch
            value={!!value[key]}
            onValueChange={(v) => toggle(key, v)}
            trackColor={{ false: c.line, true: c.brandMint }}
            thumbColor="#fff"
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  emoji: { fontSize: 18, width: 28 },
  featureLabel: { flex: 1, fontSize: 14 },
});
