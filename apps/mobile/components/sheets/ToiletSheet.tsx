import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Share,
} from 'react-native';
import { PhotoViewer } from '@/components/ui/PhotoViewer';
import { UserProfileSheet } from './UserProfileSheet';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import {
  toiletsApi,
  mediaApi,
  reportsApi,
  type Toilet,
  type Score,
  type Photo,
  type Rating,
} from '@/lib/api';
import { useAuth, useThemeColors } from '@/lib/hooks';
import { ScoreBar } from '@/components/ui/ScoreBar';
import { CriteriaBreakdown } from '@/components/ui/CriteriaBreakdown';
import { OpeningHoursDisplay } from '@/components/ui/OpeningHoursDisplay';
import { AccessibilityDisplay } from '@/components/ui/AccessibilityDisplay';
import { BottomSheet, BottomSheetScrollView } from '@/components/ui/BottomSheet';
import { CATEGORY_EMOJI, formatDistance, formatFee } from '@klopilot/shared-types';

type Detail = Toilet & { score: Score; photos: Photo[]; ratings: Rating[] };

interface Props {
  toiletId: string;
  onClose: () => void;
  onRate: (id: string, initialRating?: Rating) => void;
}

function ratingNet(r: Rating): number {
  return (
    r.flowersAccessibility -
    r.fliesAccessibility +
    (r.flowersCleanliness - r.fliesCleanliness) +
    (r.flowersHygiene - r.fliesHygiene) +
    (r.flowersStyle - r.fliesStyle) +
    (r.flowersAmenities - r.fliesAmenities) +
    (r.flowersSafety - r.fliesSafety) +
    (r.flowersInclusivity - r.fliesInclusivity) +
    (r.flowersCost - r.fliesCost) +
    (r.flowersWait - r.fliesWait) +
    (r.flowersKids - r.fliesKids)
  );
}

function relativeDate(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30);
  const years = Math.round(days / 365);

  // Intl.RelativeTimeFormat: negative Werte = Vergangenheit
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (seconds < 60) return rtf.format(-seconds, 'second');
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  if (hours < 24) return rtf.format(-hours, 'hour');
  if (days < 7) return rtf.format(-days, 'day');
  if (weeks < 5) return rtf.format(-weeks, 'week');
  if (months < 12) return rtf.format(-months, 'month');
  return rtf.format(-years, 'year');
}

function openMaps(lat: number, lng: number, name: string) {
  const label = encodeURIComponent(name);
  const url = Platform.select({
    ios: `maps://app?daddr=${lat},${lng}&q=${label}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    default: `https://maps.google.com/maps?daddr=${lat},${lng}`,
  });
  Linking.openURL(url!);
}

export function ToiletSheet({ toiletId, onClose, onRate }: Props) {
  const c = useThemeColors();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  useEffect(() => {
    toiletsApi
      .get(toiletId)
      .then((d) => setDetail(d as Detail))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [toiletId]);

  function openReportAlert(targetType: 'toilet' | 'rating' | 'photo', targetId: string) {
    const reasons = [
      t('toilet.report_reasons.not_exists'),
      t('toilet.report_reasons.closed'),
      t('toilet.report_reasons.wrong_category'),
      t('toilet.report_reasons.inappropriate'),
      t('toilet.report_reasons.duplicate'),
    ];
    Alert.alert(t('toilet.report_title'), t('toilet.report_prompt'), [
      ...reasons.map((reason) => ({
        text: reason,
        onPress: async () => {
          setReporting(true);
          try {
            await reportsApi.create(targetType, targetId, reason);
            Alert.alert(t('toilet.report_thanks_title'), t('toilet.report_thanks_msg'));
          } catch {
            Alert.alert(t('common.error'), t('toilet.report_error'));
          } finally {
            setReporting(false);
          }
        },
      })),
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }

  const handleReport = useCallback(() => {
    if (!detail) return;
    openReportAlert('toilet', detail.id);
  }, [detail]);

  const handleUploadPhoto = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      await mediaApi.upload(asset.uri, asset.mimeType ?? 'image/jpeg', toiletId);
      const refreshed = await toiletsApi.get(toiletId);
      setDetail(refreshed as Detail);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload fehlgeschlagen';
      Alert.alert(t('common.error'), msg);
    } finally {
      setUploading(false);
    }
  }, [toiletId]);

  return (
    <>
      <BottomSheet
        visible
        snapHeight={0.75}
        onClose={onClose}
        backgroundColor={c.surface}
        handleColor={c.line}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={c.brandPrimary} size="large" />
          </View>
        ) : !detail ? null : (
          <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: c.ink }]}>{detail.name}</Text>
                  {detail.verified && (
                    <View style={[styles.verifiedBadge, { backgroundColor: c.brandMint }]}>
                      <Text style={styles.badgeText}>✓ {t('toilet.verified')}</Text>
                    </View>
                  )}
                  {detail.partner && (
                    <View style={[styles.verifiedBadge, { backgroundColor: c.brandPrimary }]}>
                      <Text style={styles.badgeText}>🤝 {detail.partner.name}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.metaRow}>
                  <Text style={{ fontSize: 16 }}>{CATEGORY_EMOJI[detail.category] ?? '🚻'}</Text>
                  <Text style={[styles.metaText, { color: c.muted }]}>
                    {t(`category.${detail.category}`)}
                  </Text>
                  {detail.distanceM != null && (
                    <Text style={[styles.metaText, { color: c.muted }]}>
                      · {formatDistance(detail.distanceM)}
                    </Text>
                  )}
                  {detail.feeChf != null && (
                    <Text style={[styles.metaText, { color: c.muted }]}>
                      · {formatFee(detail.feeChf)}
                    </Text>
                  )}
                </View>
                {detail.address && (
                  <Text style={[styles.address, { color: c.muted }]}>📍 {detail.address}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: c.cream }]}
              >
                <Text style={{ color: c.muted, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Score */}
            <ScoreBar score={detail.score} />

            {/* Kriterien-Breakdown */}
            <CriteriaBreakdown ratings={detail.ratings} />

            {/* Öffnungszeiten */}
            {detail.openingHours && Object.keys(detail.openingHours).length > 0 && (
              <OpeningHoursDisplay hours={detail.openingHours} />
            )}

            {/* Barrierefreiheit */}
            {detail.accessibility && <AccessibilityDisplay accessibility={detail.accessibility} />}

            {/* Fotos */}
            {detail.photos.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.photosRow}
              >
                {detail.photos.map((p, i) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setViewerIndex(i)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: mediaApi.url(p.s3Key) }} style={styles.photo} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Navigation + Teilen */}
            <View style={styles.navRow}>
              <TouchableOpacity
                style={[styles.navBtn, { backgroundColor: c.cream, borderColor: c.line, flex: 1 }]}
                onPress={() => openMaps(detail.latitude, detail.longitude, detail.name)}
              >
                <Text style={[styles.navBtnText, { color: c.ink }]}>{t('toilet.navigate')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navBtn, { backgroundColor: c.cream, borderColor: c.line }]}
                onPress={() =>
                  Share.share({
                    title: detail.name,
                    message: `${detail.name} — https://klopilot.ch/toilets/${detail.id}`,
                    url: `https://klopilot.ch/toilets/${detail.id}`,
                  })
                }
              >
                <Text style={[styles.navBtnText, { color: c.ink }]}>{t('toilet.share')}</Text>
              </TouchableOpacity>
            </View>

            {/* Aktions-Buttons */}
            {user ? (
              <View style={styles.actionsCol}>
                <View style={styles.actions}>
                  {(() => {
                    const myRating = detail.ratings.find((r) => r.userId === user.id);
                    return (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: c.brandPrimary }]}
                        onPress={() => onRate(detail.id, myRating)}
                      >
                        <Text style={styles.actionBtnText}>
                          {detail.ratings.find((r) => r.userId === user.id)
                            ? t('toilet.rate_edit')
                            : t('toilet.rate')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })()}
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: c.cream, borderWidth: 1, borderColor: c.line },
                    ]}
                    onPress={handleUploadPhoto}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <ActivityIndicator color={c.brandPrimary} size="small" />
                    ) : (
                      <Text style={[styles.actionBtnText, { color: c.ink }]}>
                        {t('toilet.photo')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Moderator-Verify-Button */}
                {(user.role === 'admin' || user.role === 'moderator') && (
                  <TouchableOpacity
                    style={[
                      styles.verifyBtn,
                      { borderColor: detail.verified ? c.brandBerry : c.brandMint },
                    ]}
                    onPress={async () => {
                      try {
                        const updated = detail.verified
                          ? await toiletsApi.unverify(detail.id)
                          : await toiletsApi.verify(detail.id);
                        setDetail((prev) =>
                          prev ? { ...prev, verified: updated.verified } : prev,
                        );
                      } catch (e) {
                        Alert.alert(
                          t('common.error'),
                          e instanceof Error ? e.message : t('errors.generic'),
                        );
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.verifyBtnText,
                        { color: detail.verified ? c.brandBerry : c.brandMint },
                      ]}
                    >
                      {detail.verified ? t('toilet.unverify') : t('toilet.verify')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <Text style={[styles.loginHint, { color: c.muted }]}>{t('toilet.login_hint')}</Text>
            )}

            {/* Bewertungsliste */}
            <View style={[styles.ratingsSection, { borderTopColor: c.line }]}>
              <Text style={[styles.ratingsTitle, { color: c.ink }]}>
                {t('toilet.ratings_title')}
                {detail.ratings.length > 0 && (
                  <Text style={[styles.ratingsCount, { color: c.muted }]}>
                    {' '}
                    ({detail.ratings.length})
                  </Text>
                )}
              </Text>

              {detail.ratings.length === 0 ? (
                <View style={styles.emptyRatings}>
                  <Text style={{ fontSize: 32 }}>🌸</Text>
                  <Text style={[styles.emptyText, { color: c.muted }]}>
                    {t('toilet.no_ratings')}
                  </Text>
                  <Text style={[styles.emptyHint, { color: c.muted }]}>{t('toilet.be_first')}</Text>
                </View>
              ) : (
                detail.ratings.map((r) => {
                  const net = ratingNet(r);
                  const hasComment = !!r.comment?.trim();
                  return (
                    <View
                      key={r.id}
                      style={[styles.ratingCard, { backgroundColor: c.cream, borderColor: c.line }]}
                    >
                      <View style={styles.ratingHeader}>
                        <TouchableOpacity
                          disabled={!r.userId}
                          onPress={() => r.userId && setProfileUserId(r.userId)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Text
                            style={[
                              styles.ratingHandle,
                              { color: r.userId ? c.brandPrimary : c.ink },
                            ]}
                          >
                            @{r.user?.handle ?? t('toilet.anonymous')}
                          </Text>
                        </TouchableOpacity>
                        <View
                          style={[
                            styles.netBadge,
                            {
                              backgroundColor:
                                net >= 0 ? 'rgba(6,214,160,0.15)' : 'rgba(239,68,68,0.12)',
                            },
                          ]}
                        >
                          <Text
                            style={[styles.netText, { color: net >= 0 ? '#06D6A0' : '#EF4444' }]}
                          >
                            {net >= 0 ? `🌸 +${net}` : `🪰 ${net}`}
                          </Text>
                        </View>
                        <Text style={[styles.ratingDate, { color: c.muted }]}>
                          {relativeDate(r.createdAt, i18n.language)}
                        </Text>
                        {user && r.userId !== user.id && (
                          <TouchableOpacity
                            onPress={() => openReportAlert('rating', r.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={[styles.ratingReportBtn, { color: c.muted }]}>⚑</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {hasComment && (
                        <Text style={[styles.ratingComment, { color: c.ink }]}>{r.comment}</Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>

            {/* Melden */}
            <TouchableOpacity onPress={handleReport} disabled={reporting} style={styles.reportBtn}>
              <Text style={[styles.reportText, { color: c.muted }]}>
                {reporting ? t('toilet.sending') : t('toilet.report')}
              </Text>
            </TouchableOpacity>
          </BottomSheetScrollView>
        )}
      </BottomSheet>

      {viewerIndex !== null && detail && (
        <PhotoViewer
          photos={detail.photos.map((p) => ({ id: p.id, uri: mediaApi.url(p.s3Key) }))}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onReport={(photoId) => openReportAlert('photo', photoId)}
        />
      )}

      {profileUserId && (
        <UserProfileSheet userId={profileUserId} onClose={() => setProfileUserId(null)} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  name: { fontSize: 20, fontWeight: '700' },
  verifiedBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14 },
  address: { fontSize: 13, marginTop: 4 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photosRow: { marginTop: 14, marginHorizontal: -20, paddingHorizontal: 20 },
  photo: { width: 120, height: 90, borderRadius: 10, marginRight: 8 },
  navRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  navBtnText: { fontSize: 15, fontWeight: '600' },
  actionsCol: { marginTop: 10, gap: 8 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  verifyBtn: { borderRadius: 12, borderWidth: 1.5, padding: 12, alignItems: 'center' },
  verifyBtnText: { fontSize: 14, fontWeight: '700' },
  loginHint: { textAlign: 'center', marginTop: 16, fontSize: 14 },

  ratingsSection: { marginTop: 24, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth },
  ratingsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  ratingsCount: { fontSize: 14, fontWeight: '400' },

  emptyRatings: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  emptyHint: { fontSize: 13 },

  ratingCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    marginBottom: 10,
  },
  ratingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  ratingHandle: { fontSize: 13, fontWeight: '600', flex: 1 },
  netBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  netText: { fontSize: 12, fontWeight: '700' },
  ratingDate: { fontSize: 11 },
  ratingComment: { fontSize: 14, lineHeight: 20 },

  reportBtn: { alignSelf: 'center', marginTop: 20, padding: 8 },
  reportText: { fontSize: 13 },
  ratingReportBtn: { fontSize: 14 },
});
