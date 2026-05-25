import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  authApi,
  toiletsApi,
  gamificationApi,
  type Toilet,
  type UserStats,
  type LeaderboardEntry,
} from '@/lib/api';
import { useAuth, useThemeColors, useThemeMode, useLocale } from '@/lib/hooks';
import { ToiletSheet } from '@/components/sheets/ToiletSheet';
import { EditToiletSheet } from '@/components/sheets/EditToiletSheet';
import { PartnerApplySheet } from '@/components/sheets/PartnerApplySheet';
import { LeaderboardSheet } from '@/components/sheets/LeaderboardSheet';
import { CATEGORY_EMOJI } from '@klopilot/shared-types';

type Step = 'idle' | 'email' | 'sent' | 'loading';

const VISIBILITY_EMOJI: Record<string, string> = {
  public: '🌍',
  nette_toilette: '🌸',
  private: '🔒',
};

const THEME_ICON: Record<string, string> = { system: '🔆', light: '☀️', dark: '🌙' };

export default function ProfilTab() {
  const c = useThemeColors();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { mode: themeMode, cycle: cycleTheme } = useThemeMode();
  const { locale, changeLanguage } = useLocale();
  const [step, setStep] = useState<Step>('idle');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [myToilets, setMyToilets] = useState<Toilet[]>([]);
  const [privateToilets, setPrivateToilets] = useState<Toilet[]>([]);
  const [inviteToiletId, setInviteToiletId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editToilet, setEditToilet] = useState<Toilet | null>(null);
  const [showPartner, setShowPartner] = useState(false);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [boardLoading, setBoardLoading] = useState(false);

  const loadData = useCallback(() => {
    if (!user) return;
    toiletsApi
      .mine()
      .then(setMyToilets)
      .catch(() => {});
    toiletsApi
      .private()
      .then(setPrivateToilets)
      .catch(() => {});
    gamificationApi
      .myStats()
      .then(setStats)
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleInvite(toiletId: string) {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await toiletsApi.invite(toiletId, inviteEmail.trim());
      Alert.alert(t('profile.invite_sent_title'), t('profile.invite_sent_msg'));
      setInviteEmail('');
      setInviteToiletId(null);
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('errors.generic'));
    } finally {
      setInviting(false);
    }
  }

  async function handleRequestLink() {
    if (!email.trim()) {
      Alert.alert(t('errors.email_required'));
      return;
    }
    setStep('loading');
    setError(null);
    try {
      await authApi.requestMagicLink(email.trim());
      setStep('sent');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
      setStep('email');
    }
  }

  if (user) {
    return (
      <>
        <ScrollView
          style={[styles.container, { backgroundColor: c.paper }]}
          contentContainerStyle={styles.content}
        >
          <Text style={[styles.title, { color: c.ink }]}>{t('profile.title')}</Text>

          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
            <Text style={[styles.cardTitle, { color: c.muted }]}>{t('profile.handle')}</Text>
            <Text style={[styles.cardValue, { color: c.ink }]}>@{user.handle}</Text>
          </View>

          {user.email && (
            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
              <Text style={[styles.cardTitle, { color: c.muted }]}>{t('profile.email')}</Text>
              <Text style={[styles.cardValue, { color: c.ink }]}>{user.email}</Text>
            </View>
          )}

          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
            <Text style={[styles.cardTitle, { color: c.muted }]}>{t('profile.role')}</Text>
            <Text style={[styles.cardValue, { color: c.ink }]}>{user.role}</Text>
          </View>

          {/* Gamification Stats */}
          {stats && (
            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
              <Text style={[styles.cardTitle, { color: c.muted }]}>{t('profile.points')}</Text>
              <Text style={[styles.pointsValue, { color: c.brandPrimary }]}>
                {stats.points} pts
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: c.ink }]}>{stats.toiletsCreated}</Text>
                  <Text style={[styles.statLabel, { color: c.muted }]}>
                    {t('profile.stat_toilets')}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: c.ink }]}>{stats.ratingsGiven}</Text>
                  <Text style={[styles.statLabel, { color: c.muted }]}>
                    {t('profile.stat_ratings')}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: c.ink }]}>{stats.photosApproved}</Text>
                  <Text style={[styles.statLabel, { color: c.muted }]}>
                    {t('profile.stat_photos')}
                  </Text>
                </View>
              </View>
              {stats.badges.length > 0 && (
                <View style={styles.badgeRow}>
                  {stats.badges.map((b) => (
                    <View
                      key={b.id}
                      style={[styles.badge, { backgroundColor: c.cream, borderColor: c.line }]}
                    >
                      <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                      <Text style={[styles.badgeName, { color: c.ink }]}>{b.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Rangliste */}
          <TouchableOpacity
            style={[styles.leaderboardBtn, { backgroundColor: c.cream, borderColor: c.line }]}
            onPress={() => {
              setShowLeaderboard(true);
              if (board.length === 0) {
                setBoardLoading(true);
                gamificationApi
                  .leaderboard()
                  .then(setBoard)
                  .catch(() => {})
                  .finally(() => setBoardLoading(false));
              }
            }}
            activeOpacity={0.75}
          >
            <Text style={[styles.leaderboardBtnText, { color: c.ink }]}>
              {t('profile.leaderboard')}
            </Text>
            <Text style={{ color: c.muted }}>›</Text>
          </TouchableOpacity>

          {/* Meine Toiletten */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.ink }]}>
              {t('profile.my_toilets')} {myToilets.length > 0 && `(${myToilets.length})`}
            </Text>
            {myToilets.length === 0 ? (
              <Text style={[styles.emptyText, { color: c.muted }]}>
                {t('profile.my_toilets_empty')}
              </Text>
            ) : (
              myToilets.map((toilet) => {
                const isPrivate = toilet.visibility === 'private';
                return (
                  <TouchableOpacity
                    key={toilet.id}
                    onPress={() => setSelectedId(toilet.id)}
                    style={[styles.toiletRow, { backgroundColor: c.surface, borderColor: c.line }]}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.toiletEmoji}>
                      {CATEGORY_EMOJI[toilet.category] ?? '🚻'}
                    </Text>
                    <View style={styles.toiletInfo}>
                      <Text style={[styles.toiletName, { color: c.ink }]} numberOfLines={1}>
                        {toilet.name}
                      </Text>
                      <View style={styles.toiletMeta}>
                        <Text style={[styles.toiletMetaText, { color: c.muted }]}>
                          {VISIBILITY_EMOJI[toilet.visibility]}{' '}
                          {t(
                            `profile.visibility_${toilet.visibility === 'nette_toilette' ? 'nette' : toilet.visibility}`,
                          )}
                        </Text>
                        {toilet.verified && (
                          <Text style={[styles.verifiedChip, { color: c.brandMint }]}>✓</Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setEditToilet(toilet)}
                      style={[styles.editBtn, { backgroundColor: c.cream, borderColor: c.line }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={[styles.editBtnText, { color: c.ink }]}>✏️</Text>
                    </TouchableOpacity>
                    {isPrivate && (
                      <TouchableOpacity
                        onPress={() =>
                          setInviteToiletId(inviteToiletId === toilet.id ? null : toilet.id)
                        }
                        style={[styles.inviteBtn, { backgroundColor: c.brandPrimary }]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.inviteBtnText}>{t('profile.invite')}</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })
            )}

            {/* Einladungs-Box für private Toiletten */}
            {inviteToiletId && privateToilets.some((t) => t.id === inviteToiletId) && (
              <View style={[styles.inviteBox, { backgroundColor: c.cream, borderColor: c.line }]}>
                <TextInput
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  placeholder={t('profile.invite_email_placeholder')}
                  placeholderTextColor={c.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[
                    styles.input,
                    { backgroundColor: c.surface, color: c.ink, borderColor: c.line },
                  ]}
                />
                <TouchableOpacity
                  onPress={() => handleInvite(inviteToiletId)}
                  disabled={inviting}
                  style={[
                    styles.btn,
                    { backgroundColor: c.brandPrimary, opacity: inviting ? 0.6 : 1, marginTop: 8 },
                  ]}
                >
                  {inviting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>{t('profile.invite_send')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Partner-Programm */}
          <TouchableOpacity
            onPress={() => setShowPartner(true)}
            style={[styles.btn, { backgroundColor: c.brandMint, marginTop: 16 }]}
          >
            <Text style={styles.btnText}>{t('partner.apply')}</Text>
          </TouchableOpacity>

          {/* Sprach-Umschalter */}
          <View style={[styles.langRow, { backgroundColor: c.surface, borderColor: c.line }]}>
            {(['de', 'fr', 'it', 'en'] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => changeLanguage(lang)}
                style={[
                  styles.langBtn,
                  {
                    backgroundColor: locale.startsWith(lang) ? c.brandPrimary : c.cream,
                    borderColor: c.line,
                  },
                ]}
              >
                <Text
                  style={[styles.langBtnText, { color: locale.startsWith(lang) ? '#fff' : c.ink }]}
                >
                  {lang.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Theme Toggle */}
          <TouchableOpacity
            onPress={cycleTheme}
            style={[styles.themeRow, { backgroundColor: c.surface, borderColor: c.line }]}
            activeOpacity={0.7}
          >
            <Text style={styles.themeIcon}>{THEME_ICON[themeMode]}</Text>
            <Text style={[styles.themeLabel, { color: c.ink }]}>
              {t(`profile.theme_${themeMode}`)}
            </Text>
            <Text style={[styles.themeHint, { color: c.muted }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={logout}
            style={[styles.btn, { backgroundColor: c.brandBerry, marginTop: 8 }]}
          >
            <Text style={styles.btnText}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ToiletSheet als Overlay */}
        {selectedId && (
          <ToiletSheet
            toiletId={selectedId}
            onClose={() => setSelectedId(null)}
            onRate={() => setSelectedId(null)}
          />
        )}

        {/* EditToiletSheet als Overlay */}
        {showPartner && <PartnerApplySheet onClose={() => setShowPartner(false)} />}

        {showLeaderboard && (
          <LeaderboardSheet
            entries={board}
            loading={boardLoading}
            currentHandle={user?.handle}
            onClose={() => setShowLeaderboard(false)}
          />
        )}

        {editToilet && (
          <EditToiletSheet
            toilet={editToilet}
            onClose={() => setEditToilet(null)}
            onSaved={(updated) => {
              setMyToilets((prev) =>
                prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
              );
              setEditToilet(null);
            }}
            onDeleted={(id) => {
              setMyToilets((prev) => prev.filter((t) => t.id !== id));
              setEditToilet(null);
            }}
          />
        )}
      </>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.paper }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: c.ink }]}>{t('profile.login_title')}</Text>
        <Text style={[styles.subtitle, { color: c.muted }]}>{t('profile.login_subtitle')}</Text>

        {(step === 'idle' || step === 'email' || step === 'loading') && (
          <>
            <View style={styles.field}>
              <Text style={[styles.label, { color: c.ink }]}>{t('profile.email_label')}</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t('profile.email_placeholder')}
                placeholderTextColor={c.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={[
                  styles.input,
                  { backgroundColor: c.cream, color: c.ink, borderColor: c.line },
                ]}
              />
            </View>

            {error && <Text style={[styles.errorText, { color: c.brandBerry }]}>{error}</Text>}

            <TouchableOpacity
              onPress={handleRequestLink}
              disabled={step === 'loading'}
              style={[
                styles.btn,
                { backgroundColor: c.brandPrimary, opacity: step === 'loading' ? 0.6 : 1 },
              ]}
            >
              {step === 'loading' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>{t('profile.send_magic_link')}</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {step === 'sent' && (
          <View style={styles.sentBox}>
            <Text style={{ fontSize: 56 }}>📬</Text>
            <Text style={[styles.sentText, { color: c.ink }]}>
              {t('profile.sent_text', { email })
                .split('\n')
                .map((line, i) =>
                  i === 1 ? (
                    <Text key={i} style={{ fontWeight: '700' }}>
                      {line}
                    </Text>
                  ) : (
                    line
                  ),
                )}
            </Text>
            <Text style={[styles.hintText, { color: c.muted }]}>{t('profile.sent_hint')}</Text>
            <TouchableOpacity
              onPress={() => {
                setStep('idle');
                setEmail('');
              }}
              style={[styles.btnOutline, { borderColor: c.line }]}
            >
              <Text style={[styles.btnOutlineText, { color: c.muted }]}>
                {t('profile.use_other_email')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20, paddingTop: 70 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 15, marginBottom: 28, lineHeight: 22 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  btn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnOutline: {
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
  },
  btnOutlineText: { fontSize: 14 },
  errorText: { fontSize: 14, marginBottom: 8 },
  card: { borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1 },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardValue: { fontSize: 16, fontWeight: '500' },
  sentBox: { alignItems: 'center', gap: 16, paddingTop: 24 },
  sentText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  hintText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  section: { marginTop: 20 },
  emptyText: { fontSize: 14, marginTop: 8, marginBottom: 4 },

  toiletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  toiletEmoji: { fontSize: 22 },
  toiletInfo: { flex: 1 },
  toiletName: { fontSize: 15, fontWeight: '600' },
  toiletMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  toiletMetaText: { fontSize: 12 },
  verifiedChip: { fontSize: 13, fontWeight: '700' },

  editBtn: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1 },
  editBtnText: { fontSize: 14 },
  inviteBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  inviteBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  inviteBox: { marginTop: 8, borderRadius: 12, borderWidth: 1, padding: 12 },

  pointsValue: { fontSize: 28, fontWeight: '800', marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statItem: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 2 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeEmoji: { fontSize: 14 },
  badgeName: { fontSize: 12, fontWeight: '600' },
  leaderboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 4,
  },
  leaderboardBtnText: { fontSize: 15, fontWeight: '600' },

  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 8,
  },
  themeIcon: { fontSize: 20 },
  themeLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  themeHint: { fontSize: 18 },

  langRow: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginTop: 8,
  },
  langBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  langBtnText: { fontSize: 13, fontWeight: '700' },
});
