import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usersApi, type PublicProfile, type UserStats } from '@/lib/api';
import { useThemeColors } from '@/lib/hooks';
import { BottomSheet, BottomSheetScrollView } from '@/components/ui/BottomSheet';

interface Props {
  userId: string;
  onClose: () => void;
}

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  admin: { label: '⚙️ Admin', color: '#EF476F' },
  moderator: { label: '🛡️ Mod', color: '#FF6B35' },
  verified: { label: '✓ Verifiziert', color: '#06D6A0' },
  user: { label: '👤 Nutzer', color: '#118AB2' },
  anon: { label: '👤 Anonym', color: '#8E8E93' },
};

export function UserProfileSheet({ userId, onClose }: Props) {
  const c = useThemeColors();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([usersApi.getPublicProfile(userId), usersApi.getStats(userId)])
      .then(([p, s]) => {
        setProfile(p);
        setStats(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const badge = profile ? (ROLE_BADGE[profile.role] ?? ROLE_BADGE.user) : null;

  return (
    <BottomSheet
      visible
      snapHeight={0.55}
      onClose={onClose}
      backgroundColor={c.surface}
      handleColor={c.line}
    >
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.brandPrimary} size="large" />
        </View>
      ) : !profile ? (
        <View style={styles.center}>
          <Text style={{ color: c.muted }}>Nutzer nicht gefunden</Text>
        </View>
      ) : (
        <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 }]}>
          {/* Close */}
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: c.cream }]}
          >
            <Text style={{ color: c.muted, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>

          {/* Avatar placeholder */}
          <View style={[styles.avatar, { backgroundColor: c.brandPrimary }]}>
            <Text style={styles.avatarText}>{profile.handle.slice(0, 2).toUpperCase()}</Text>
          </View>

          {/* Handle */}
          <Text style={[styles.handle, { color: c.ink }]}>@{profile.handle}</Text>

          {/* Role badge */}
          {badge && (
            <View style={[styles.roleBadge, { backgroundColor: badge.color + '22' }]}>
              <Text style={[styles.roleText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          )}

          {/* Points */}
          {stats && (
            <View style={[styles.pointsBox, { backgroundColor: c.cream, borderColor: c.line }]}>
              <Text style={[styles.pointsValue, { color: c.brandPrimary }]}>{stats.points}</Text>
              <Text style={[styles.pointsLabel, { color: c.muted }]}>{t('profile.points')}</Text>
            </View>
          )}

          {/* Stats row */}
          {stats && (
            <View style={styles.statsRow}>
              <StatCell label={t('profile.stat_toilets')} value={stats.toiletsCreated} colors={c} />
              <StatCell label={t('profile.stat_ratings')} value={stats.ratingsGiven} colors={c} />
              <StatCell label={t('profile.stat_photos')} value={stats.photosApproved} colors={c} />
            </View>
          )}

          {/* Badges */}
          {stats && stats.badges.length > 0 && (
            <View style={styles.badgesSection}>
              <Text style={[styles.badgesTitle, { color: c.ink }]}>Badges</Text>
              <View style={styles.badgesGrid}>
                {stats.badges.map((b) => (
                  <View
                    key={b.id}
                    style={[styles.badgeChip, { backgroundColor: c.cream, borderColor: c.line }]}
                  >
                    <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                    <Text style={[styles.badgeName, { color: c.ink }]}>{b.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </BottomSheetScrollView>
      )}
    </BottomSheet>
  );
}

function StatCell({
  label,
  value,
  colors,
}: {
  label: string;
  value: number;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={[styles.statCell, { backgroundColor: colors.cream, borderColor: colors.line }]}>
      <Text style={[styles.statValue, { color: colors.ink }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, alignItems: 'center' },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  handle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  roleBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16 },
  roleText: { fontSize: 13, fontWeight: '700' },

  pointsBox: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14,
    width: '100%',
  },
  pointsValue: { fontSize: 36, fontWeight: '800' },
  pointsLabel: { fontSize: 13, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20, width: '100%' },
  statCell: {
    flex: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    paddingVertical: 10,
  },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 2 },

  badgesSection: { width: '100%' },
  badgesTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeEmoji: { fontSize: 16 },
  badgeName: { fontSize: 13, fontWeight: '600' },
});
