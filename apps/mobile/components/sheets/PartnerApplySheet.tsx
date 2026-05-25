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
import { partnersApi } from '@/lib/api';
import { useThemeColors } from '@/lib/hooks';
import { BottomSheet, BottomSheetScrollView } from '@/components/ui/BottomSheet';

const PARTNER_TYPES = [
  'municipality',
  'restaurant',
  'mall',
  'transport',
  'hotel',
  'other',
] as const;
type PartnerType = (typeof PARTNER_TYPES)[number];

interface Props {
  onClose: () => void;
}

export function PartnerApplySheet({ onClose }: Props) {
  const c = useThemeColors();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [type, setType] = useState<PartnerType>('other');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert(t('errors.name_required'));
      return;
    }
    setSaving(true);
    try {
      await partnersApi.apply({
        name: name.trim(),
        type,
        website: website.trim() || undefined,
        contactEmail: email.trim() || undefined,
        description: description.trim() || undefined,
      });
      setSubmitted(true);
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('errors.generic'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      visible
      snapHeight={0.92}
      onClose={onClose}
      backgroundColor={c.surface}
      handleColor={c.line}
    >
      <View style={[styles.titleRow, { borderBottomColor: c.line }]}>
        <Text style={[styles.title, { color: c.ink }]}>{t('partner.title')}</Text>
        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: c.cream }]}>
          <Text style={{ color: c.muted }}>✕</Text>
        </TouchableOpacity>
      </View>

      {submitted ? (
        <View style={styles.successBox}>
          <Text style={{ fontSize: 56 }}>🤝</Text>
          <Text style={[styles.successTitle, { color: c.ink }]}>
            {t('partner.submitted_title')}
          </Text>
          <Text style={[styles.successMsg, { color: c.muted }]}>{t('partner.submitted_msg')}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.saveBtn, { backgroundColor: c.brandPrimary, marginTop: 24 }]}
          >
            <Text style={styles.saveBtnText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 }]}>
          <Text style={[styles.subtitle, { color: c.muted }]}>{t('partner.apply_subtitle')}</Text>

          {/* Name */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: c.ink }]}>{t('partner.name_label')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('partner.name_placeholder')}
              placeholderTextColor={c.muted}
              maxLength={120}
              style={[
                styles.input,
                { backgroundColor: c.cream, color: c.ink, borderColor: c.line },
              ]}
            />
          </View>

          {/* Typ */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: c.ink }]}>{t('partner.type_label')}</Text>
            <View style={styles.typeGrid}>
              {PARTNER_TYPES.map((key) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setType(key)}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: type === key ? c.brandPrimary : c.cream,
                      borderColor: c.line,
                    },
                  ]}
                >
                  <Text style={[styles.typeLabel, { color: type === key ? '#fff' : c.ink }]}>
                    {t(`partner.type_${key}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Website */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: c.ink }]}>{t('partner.website_label')}</Text>
            <TextInput
              value={website}
              onChangeText={setWebsite}
              placeholder="https://beispiel.ch"
              placeholderTextColor={c.muted}
              keyboardType="url"
              autoCapitalize="none"
              style={[
                styles.input,
                { backgroundColor: c.cream, color: c.ink, borderColor: c.line },
              ]}
            />
          </View>

          {/* Kontakt-E-Mail */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: c.ink }]}>{t('partner.email_label')}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="kontakt@beispiel.ch"
              placeholderTextColor={c.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[
                styles.input,
                { backgroundColor: c.cream, color: c.ink, borderColor: c.line },
              ]}
            />
          </View>

          {/* Beschreibung */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: c.ink }]}>{t('partner.desc_label')}</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder=""
              placeholderTextColor={c.muted}
              multiline
              numberOfLines={4}
              maxLength={1000}
              style={[
                styles.textarea,
                { backgroundColor: c.cream, color: c.ink, borderColor: c.line },
              ]}
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            style={[styles.saveBtn, { backgroundColor: c.brandPrimary, opacity: saving ? 0.6 : 1 }]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>{t('partner.submit')}</Text>
            )}
          </TouchableOpacity>
        </BottomSheetScrollView>
      )}
    </BottomSheet>
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
  content: { padding: 20, gap: 4 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  field: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  textarea: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1 },
  typeLabel: { fontSize: 13, fontWeight: '500' },
  saveBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  successTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  successMsg: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
