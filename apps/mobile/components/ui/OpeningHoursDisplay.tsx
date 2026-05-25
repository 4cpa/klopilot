import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { OpeningHours, DayKey } from '@klopilot/shared-types';
import { useThemeColors } from '@/lib/hooks';

const DAY_KEYS: DayKey[] = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'];

// 0=So, 1=Mo … 6=Sa  →  map to DayKey
const JS_DAY_TO_KEY: DayKey[] = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

function isOpenNow(hours: OpeningHours, todayKey: DayKey): boolean {
  const day = hours[todayKey];
  if (!day) return false;
  const now = new Date();
  const [oh, om] = day.open.split(':').map(Number);
  const [ch, cm] = day.close.split(':').map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= oh * 60 + om && mins < ch * 60 + cm;
}

interface Props {
  hours: OpeningHours;
}

export function OpeningHoursDisplay({ hours }: Props) {
  const c = useThemeColors();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const todayKey = JS_DAY_TO_KEY[new Date().getDay()];
  const todayHours = hours[todayKey];
  const openNow = isOpenNow(hours, todayKey);

  return (
    <View style={[styles.container, { borderTopColor: c.line }]}>
      <TouchableOpacity
        style={styles.headerRow}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <Text style={[styles.sectionLabel, { color: c.muted }]}>{t('hours.title')}</Text>
        <View style={styles.todayRow}>
          {todayHours ? (
            <>
              <Text style={[styles.todayTime, { color: c.ink }]}>
                {todayHours.open}–{todayHours.close}
              </Text>
              <View
                style={[styles.statusDot, { backgroundColor: openNow ? '#06D6A0' : '#EF4444' }]}
              />
              <Text style={[styles.statusText, { color: openNow ? '#06D6A0' : '#EF4444' }]}>
                {openNow ? t('hours.open_now') : t('hours.closed')}
              </Text>
            </>
          ) : (
            <Text style={[styles.closedText, { color: c.muted }]}>{t('hours.closed')}</Text>
          )}
          <Text style={[styles.chevron, { color: c.muted }]}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.weekGrid, { borderTopColor: c.line }]}>
          {DAY_KEYS.map((key) => {
            const isToday = key === todayKey;
            const day = hours[key];
            return (
              <View
                key={key}
                style={[styles.dayRow, isToday && { backgroundColor: c.cream, borderRadius: 8 }]}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    { color: isToday ? c.ink : c.muted, fontWeight: isToday ? '700' : '400' },
                  ]}
                >
                  {t(`hours.days_short.${key}`)}
                </Text>
                {day ? (
                  <Text style={[styles.dayTime, { color: c.ink }]}>
                    {day.open}–{day.close}
                  </Text>
                ) : (
                  <Text style={[styles.dayTime, { color: c.muted }]}>{t('hours.closed')}</Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  todayTime: { fontSize: 14, fontWeight: '600' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  closedText: { fontSize: 14 },
  chevron: { fontSize: 11, marginLeft: 4 },
  weekGrid: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 2 },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  dayLabel: { fontSize: 13, width: 32 },
  dayTime: { fontSize: 13 },
});
