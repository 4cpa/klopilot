import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ratingsApi, gamificationApi, type RatingInput, type Rating, type Badge } from '@/lib/api';
import { useThemeColors } from '@/lib/hooks';
import { RatingSlider } from '@/components/ui/RatingSlider';
import { BottomSheet, BottomSheetScrollView } from '@/components/ui/BottomSheet';
import { BadgeUnlockModal } from '@/components/ui/BadgeUnlockModal';
import { CRITERIA_KEYS } from '@klopilot/shared-types';

type ScoreMap = Partial<Record<string, { flowers: number; flies: number }>>;

function ratingToScoreMap(r: Rating): ScoreMap {
  return {
    accessibility: { flowers: r.flowersAccessibility, flies: r.fliesAccessibility },
    cleanliness: { flowers: r.flowersCleanliness, flies: r.fliesCleanliness },
    hygiene: { flowers: r.flowersHygiene, flies: r.fliesHygiene },
    style: { flowers: r.flowersStyle, flies: r.fliesStyle },
    amenities: { flowers: r.flowersAmenities, flies: r.fliesAmenities },
    safety: { flowers: r.flowersSafety, flies: r.fliesSafety },
    inclusivity: { flowers: r.flowersInclusivity, flies: r.fliesInclusivity },
    cost: { flowers: r.flowersCost, flies: r.fliesCost },
    wait: { flowers: r.flowersWait, flies: r.fliesWait },
    kids: { flowers: r.flowersKids, flies: r.fliesKids },
  };
}

interface Props {
  toiletId: string;
  initialRating?: Rating;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
}

export function RatingSheet({ toiletId, initialRating, onClose, onSaved, onDeleted }: Props) {
  const c = useThemeColors();
  const { t, i18n } = useTranslation();
  const isEdit = !!initialRating;

  const [scores, setScores] = useState<ScoreMap>(
    initialRating ? ratingToScoreMap(initialRating) : {},
  );
  const [comment, setComment] = useState(initialRating?.comment ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);

  function handleScore(key: string, flowers: number, flies: number) {
    setScores((prev) => ({ ...prev, [key]: { flowers, flies } }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const input: RatingInput = {
        scores: Object.fromEntries(
          Object.entries(scores).filter(
            ([, v]) => v !== undefined && ((v.flowers ?? 0) > 0 || (v.flies ?? 0) > 0),
          ),
        ) as RatingInput['scores'],
        comment: comment.trim() || undefined,
        language: i18n.language ?? 'de',
      };

      const [statsBefore] = await Promise.allSettled([gamificationApi.myStats()]);
      await ratingsApi.upsert(toiletId, input);
      const statsAfter = await gamificationApi.myStats().catch(() => null);

      if (statsBefore.status === 'fulfilled' && statsAfter) {
        const before = new Set(statsBefore.value.badges.map((b) => b.id));
        const unlocked = statsAfter.badges.filter((b) => !before.has(b.id));
        if (unlocked.length > 0) {
          setNewBadges(unlocked);
          return; // BadgeUnlockModal ruft onSaved via onClose auf
        }
      }

      onSaved();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('rating.save_error'));
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(t('rating.delete'), t('rating.delete_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('rating.delete_ok'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await ratingsApi.remove(toiletId);
            onDeleted?.();
            onSaved();
          } catch {
            Alert.alert(t('common.error'), t('rating.delete_error'));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  return (
    <>
      {newBadges.length > 0 && (
        <BadgeUnlockModal
          badges={newBadges}
          onClose={() => {
            setNewBadges([]);
            onSaved();
          }}
        />
      )}
      <BottomSheet
        visible
        snapHeight={0.88}
        onClose={onClose}
        backgroundColor={c.surface}
        handleColor={c.line}
      >
        <View style={[styles.titleRow, { borderBottomColor: c.line }]}>
          <Text style={[styles.title, { color: c.ink }]}>
            {isEdit ? t('rating.title_edit') : t('rating.title')}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: c.cream }]}
          >
            <Text style={{ color: c.muted }}>✕</Text>
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 }]}>
          {CRITERIA_KEYS.map((key) => (
            <RatingSlider
              key={key}
              label={t(`criteria.${key}`)}
              flowers={scores[key]?.flowers ?? 0}
              flies={scores[key]?.flies ?? 0}
              onChange={(f, l) => handleScore(key, f, l)}
            />
          ))}

          <View style={styles.commentField}>
            <Text style={[styles.commentLabel, { color: c.ink }]}>{t('rating.comment_label')}</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder={t('rating.comment_placeholder')}
              placeholderTextColor={c.muted}
              multiline
              numberOfLines={3}
              maxLength={2000}
              style={[
                styles.commentInput,
                { backgroundColor: c.cream, color: c.ink, borderColor: c.line },
              ]}
            />
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || deleting}
            style={[
              styles.saveBtn,
              { backgroundColor: c.brandPrimary, opacity: saving || deleting ? 0.6 : 1 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>
                {isEdit ? t('rating.save_edit') : t('rating.save')}
              </Text>
            )}
          </TouchableOpacity>

          {isEdit && (
            <TouchableOpacity
              onPress={handleDelete}
              disabled={saving || deleting}
              style={[
                styles.deleteBtn,
                { borderColor: c.brandBerry, opacity: saving || deleting ? 0.5 : 1 },
              ]}
            >
              {deleting ? (
                <ActivityIndicator color={c.brandBerry} size="small" />
              ) : (
                <Text style={[styles.deleteBtnText, { color: c.brandBerry }]}>
                  {t('rating.delete')}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '700' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 16, gap: 10 },
  commentField: { marginTop: 8 },
  commentLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  commentInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteBtn: {
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1.5,
  },
  deleteBtnText: { fontSize: 15, fontWeight: '600' },
});
