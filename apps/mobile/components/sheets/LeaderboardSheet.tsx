import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { type LeaderboardEntry } from '@/lib/api';
import { useThemeColors } from '@/lib/hooks';
import { BottomSheet, BottomSheetScrollView } from '@/components/ui/BottomSheet';
import { UserProfileSheet } from './UserProfileSheet';

interface Props {
  entries: LeaderboardEntry[];
  loading: boolean;
  currentHandle?: string;
  onClose: () => void;
}

const PODIUM_COLOR = ['#FFD700', '#C0C0C0', '#CD7F32'] as const;
const PODIUM_EMOJI = ['🥇', '🥈', '🥉'] as const;

export function LeaderboardSheet({ entries, loading, currentHandle, onClose }: Props) {
  const c = useThemeColors();
  const { t } = useTranslation();
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const myEntry = entries.find((e) => e.handle === currentHandle);
  const myInTop = myEntry ? myEntry.rank <= entries.length : false;

  return (
    <>
      <BottomSheet
        visible
        snapHeight={0.88}
        onClose={onClose}
        backgroundColor={c.surface}
        handleColor={c.line}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.line }]}>
          <Text style={[styles.title, { color: c.ink }]}>{t('profile.leaderboard')}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: c.cream }]}
          >
            <Text style={{ color: c.muted, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={c.brandPrimary} size="large" />
          </View>
        ) : (
          <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Podium Top-3 */}
            {podium.length === 3 && (
              <View style={[styles.podiumRow, { borderBottomColor: c.line }]}>
                {/* Silver (#2) left */}
                <PodiumCard
                  entry={podium[1]}
                  color={PODIUM_COLOR[1]}
                  emoji={PODIUM_EMOJI[1]}
                  isSelf={podium[1].handle === currentHandle}
                  colors={c}
                  onPress={() => setProfileUserId(podium[1].id)}
                />
                {/* Gold (#1) center — taller */}
                <PodiumCard
                  entry={podium[0]}
                  color={PODIUM_COLOR[0]}
                  emoji={PODIUM_EMOJI[0]}
                  isSelf={podium[0].handle === currentHandle}
                  colors={c}
                  tall
                  onPress={() => setProfileUserId(podium[0].id)}
                />
                {/* Bronze (#3) right */}
                <PodiumCard
                  entry={podium[2]}
                  color={PODIUM_COLOR[2]}
                  emoji={PODIUM_EMOJI[2]}
                  isSelf={podium[2].handle === currentHandle}
                  colors={c}
                  onPress={() => setProfileUserId(podium[2].id)}
                />
              </View>
            )}

            {/* Ranks 4–20 */}
            <View style={styles.list}>
              {rest.map((entry) => (
                <BoardRow
                  key={entry.id}
                  entry={entry}
                  isSelf={entry.handle === currentHandle}
                  colors={c}
                  onPress={() => setProfileUserId(entry.id)}
                />
              ))}
            </View>

            {/* Eigene Position falls ausserhalb Top-20 */}
            {myEntry && !myInTop && (
              <View
                style={[
                  styles.myRankBanner,
                  { backgroundColor: c.brandPrimary + '18', borderColor: c.brandPrimary },
                ]}
              >
                <Text style={[styles.myRankLabel, { color: c.brandPrimary }]}>Dein Rang</Text>
                <BoardRow
                  entry={myEntry}
                  isSelf
                  colors={c}
                  onPress={() => setProfileUserId(myEntry.id)}
                />
              </View>
            )}
          </BottomSheetScrollView>
        )}
      </BottomSheet>

      {profileUserId && (
        <UserProfileSheet userId={profileUserId} onClose={() => setProfileUserId(null)} />
      )}
    </>
  );
}

function PodiumCard({
  entry,
  color,
  emoji,
  isSelf,
  colors,
  tall,
  onPress,
}: {
  entry: LeaderboardEntry;
  color: string;
  emoji: string;
  isSelf: boolean;
  colors: ReturnType<typeof useThemeColors>;
  tall?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.podiumCard, tall && styles.podiumCardTall]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={styles.podiumEmoji}>{emoji}</Text>
      <View style={[styles.podiumAvatar, { backgroundColor: color + '33', borderColor: color }]}>
        <Text style={[styles.podiumInitials, { color }]}>
          {entry.handle.slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <Text
        style={[styles.podiumHandle, { color: isSelf ? colors.brandPrimary : colors.ink }]}
        numberOfLines={1}
      >
        @{entry.handle}
      </Text>
      <Text style={[styles.podiumPts, { color }]}>{entry.points} pts</Text>
      {entry.badges.length > 0 && (
        <Text style={styles.podiumBadges}>
          {entry.badges
            .slice(0, 2)
            .map((b) => b.emoji)
            .join('')}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function BoardRow({
  entry,
  isSelf,
  colors,
  onPress,
}: {
  entry: LeaderboardEntry;
  isSelf: boolean;
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.boardRow,
        {
          borderColor: colors.line,
          backgroundColor: isSelf ? colors.brandPrimary + '12' : colors.surface,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.boardRank, { color: colors.muted }]}>#{entry.rank}</Text>
      <View style={[styles.boardAvatar, { backgroundColor: colors.cream }]}>
        <Text style={[styles.boardInitials, { color: colors.ink }]}>
          {entry.handle.slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <Text
        style={[styles.boardHandle, { color: isSelf ? colors.brandPrimary : colors.ink }]}
        numberOfLines={1}
      >
        @{entry.handle}
      </Text>
      <Text style={styles.boardBadges}>
        {entry.badges
          .slice(0, 3)
          .map((b) => b.emoji)
          .join('')}
      </Text>
      <Text style={[styles.boardPts, { color: colors.brandPrimary }]}>{entry.points} pts</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: '700' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },

  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  podiumCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
  },
  podiumCardTall: { paddingTop: 20 },
  podiumEmoji: { fontSize: 24 },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  podiumInitials: { fontSize: 16, fontWeight: '800' },
  podiumHandle: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  podiumPts: { fontSize: 12, fontWeight: '700' },
  podiumBadges: { fontSize: 14 },

  list: { paddingHorizontal: 16, paddingTop: 8, gap: 6 },

  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  boardRank: { fontSize: 13, fontWeight: '600', width: 30 },
  boardAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardInitials: { fontSize: 11, fontWeight: '700' },
  boardHandle: { flex: 1, fontSize: 14, fontWeight: '600' },
  boardBadges: { fontSize: 14 },
  boardPts: { fontSize: 13, fontWeight: '700' },

  myRankBanner: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
  },
  myRankLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, paddingHorizontal: 2 },
});
