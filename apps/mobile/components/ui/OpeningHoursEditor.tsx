import { View, Text, TextInput, Switch, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { OpeningHours, DayKey } from '@klopilot/shared-types';
import { useThemeColors } from '@/lib/hooks';

const DAY_KEYS: DayKey[] = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'];

interface Props {
  value: OpeningHours;
  onChange: (v: OpeningHours) => void;
}

export function OpeningHoursEditor({ value, onChange }: Props) {
  const c = useThemeColors();
  const { t } = useTranslation();

  function toggleDay(key: DayKey, enabled: boolean) {
    onChange({
      ...value,
      [key]: enabled ? { open: '08:00', close: '20:00' } : null,
    });
  }

  function setTime(key: DayKey, field: 'open' | 'close', text: string) {
    const day = value[key];
    if (!day) return;
    onChange({ ...value, [key]: { ...day, [field]: text } });
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionLabel, { color: c.muted }]}>{t('hours.title')}</Text>
      {DAY_KEYS.map((key) => {
        const day = value[key];
        const isOpen = day !== null && day !== undefined;
        return (
          <View key={key} style={[styles.row, { borderBottomColor: c.line }]}>
            <Text style={[styles.dayName, { color: c.ink }]}>{t(`hours.days_short.${key}`)}</Text>
            <Switch
              value={isOpen}
              onValueChange={(v) => toggleDay(key, v)}
              trackColor={{ false: c.line, true: c.brandMint }}
              thumbColor="#fff"
            />
            {isOpen ? (
              <View style={styles.timePair}>
                <TextInput
                  value={day!.open}
                  onChangeText={(v) => setTime(key, 'open', v)}
                  placeholder="08:00"
                  placeholderTextColor={c.muted}
                  style={[
                    styles.timeInput,
                    { backgroundColor: c.cream, color: c.ink, borderColor: c.line },
                  ]}
                  maxLength={5}
                  keyboardType="numbers-and-punctuation"
                />
                <Text style={[styles.dash, { color: c.muted }]}>–</Text>
                <TextInput
                  value={day!.close}
                  onChangeText={(v) => setTime(key, 'close', v)}
                  placeholder="20:00"
                  placeholderTextColor={c.muted}
                  style={[
                    styles.timeInput,
                    { backgroundColor: c.cream, color: c.ink, borderColor: c.line },
                  ]}
                  maxLength={5}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            ) : (
              <Text style={[styles.closedLabel, { color: c.muted }]}>{t('hours.closed')}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  sectionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayName: { width: 28, fontSize: 13, fontWeight: '600' },
  timePair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  timeInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    width: 60,
    textAlign: 'center',
  },
  dash: { fontSize: 14 },
  closedLabel: { flex: 1, textAlign: 'right', fontSize: 13 },
});
