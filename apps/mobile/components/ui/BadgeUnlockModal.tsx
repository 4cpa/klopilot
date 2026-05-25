import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Modal } from 'react-native';
import type { Badge } from '@/lib/api';
import { useThemeColors } from '@/lib/hooks';

interface Props {
  badges: Badge[];
  onClose: () => void;
}

export function BadgeUnlockModal({ badges, onClose }: Props) {
  const c = useThemeColors();
  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 14 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Modal transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: c.surface, shadowColor: '#000' },
            { transform: [{ scale }], opacity },
          ]}
        >
          <Text style={styles.headline}>🎉 Badge freigeschaltet!</Text>

          <View style={styles.badgesRow}>
            {badges.map((b) => (
              <View
                key={b.id}
                style={[styles.badgeChip, { backgroundColor: c.cream, borderColor: c.line }]}
              >
                <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                <Text style={[styles.badgeName, { color: c.ink }]}>{b.name}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.hint, { color: c.muted }]}>Tippe irgendwo zum Schliessen</Text>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    marginHorizontal: 32,
    width: '80%',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  headline: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeEmoji: { fontSize: 22 },
  badgeName: { fontSize: 14, fontWeight: '700' },
  hint: { fontSize: 12, marginTop: 4 },
});
