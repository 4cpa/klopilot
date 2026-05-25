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
import { toiletsApi, type Toilet } from '@/lib/api';
import type { OpeningHours, Accessibility } from '@klopilot/shared-types';
import { useThemeColors } from '@/lib/hooks';
import { BottomSheet, BottomSheetScrollView } from '@/components/ui/BottomSheet';
import { OpeningHoursEditor } from '@/components/ui/OpeningHoursEditor';
import { AccessibilityEditor } from '@/components/ui/AccessibilityEditor';

const CATEGORY_KEYS = [
  'public',
  'nette_toilette',
  'gastronomy',
  'transport',
  'mall',
  'event',
  'private',
] as const;

interface Props {
  toilet: Toilet;
  onClose: () => void;
  onSaved: (updated: Toilet) => void;
  onDeleted: (id: string) => void;
}

export function EditToiletSheet({ toilet, onClose, onSaved, onDeleted }: Props) {
  const c = useThemeColors();
  const { t } = useTranslation();

  const [name, setName] = useState(toilet.name);
  const [category, setCategory] = useState<string>(toilet.category);
  const [address, setAddress] = useState(toilet.address ?? '');
  const [fee, setFee] = useState(toilet.feeChf != null ? String(toilet.feeChf) : '');
  const [hours, setHours] = useState<OpeningHours>((toilet.openingHours as OpeningHours) ?? {});
  const [access, setAccess] = useState<Accessibility>(
    (toilet.accessibility as Accessibility) ?? {},
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleDelete() {
    Alert.alert(t('profile.delete_toilet'), t('profile.delete_toilet_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.delete_toilet_ok'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await toiletsApi.remove(toilet.id);
            onDeleted(toilet.id);
          } catch {
            Alert.alert(t('common.error'), t('profile.delete_toilet_error'));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert(t('errors.name_required'));
      return;
    }
    setSaving(true);
    try {
      const updated = await toiletsApi.update(toilet.id, {
        name: name.trim(),
        category,
        address: address.trim() || undefined,
        feeChf: fee ? parseFloat(fee) : null,
        openingHours: Object.keys(hours).length > 0 ? hours : null,
        accessibility: Object.keys(access).length > 0 ? access : null,
      });
      onSaved(updated);
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('profile.edit_error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      visible
      snapHeight={0.88}
      onClose={onClose}
      backgroundColor={c.surface}
      handleColor={c.line}
    >
      <View style={[styles.titleRow, { borderBottomColor: c.line }]}>
        <Text style={[styles.title, { color: c.ink }]}>{t('profile.edit_toilet')}</Text>
        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: c.cream }]}>
          <Text style={{ color: c.muted }}>✕</Text>
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 }]}>
        {/* Name */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: c.ink }]}>{t('contribute.name_label')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('contribute.name_placeholder')}
            placeholderTextColor={c.muted}
            maxLength={120}
            style={[styles.input, { backgroundColor: c.cream, color: c.ink, borderColor: c.line }]}
          />
        </View>

        {/* Kategorie */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: c.ink }]}>{t('contribute.category_label')}</Text>
          <View style={styles.catGrid}>
            {CATEGORY_KEYS.map((key) => (
              <TouchableOpacity
                key={key}
                onPress={() => setCategory(key)}
                style={[
                  styles.catBtn,
                  {
                    backgroundColor: category === key ? c.brandPrimary : c.cream,
                    borderColor: c.line,
                  },
                ]}
              >
                <Text style={[styles.catLabel, { color: category === key ? '#fff' : c.ink }]}>
                  {t(`category.${key}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Adresse */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: c.ink }]}>{t('contribute.address_label')}</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder={t('contribute.address_placeholder')}
            placeholderTextColor={c.muted}
            maxLength={300}
            style={[styles.input, { backgroundColor: c.cream, color: c.ink, borderColor: c.line }]}
          />
        </View>

        {/* Gebühr */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: c.ink }]}>{t('contribute.fee_label')}</Text>
          <TextInput
            value={fee}
            onChangeText={setFee}
            placeholder={t('contribute.fee_placeholder')}
            placeholderTextColor={c.muted}
            keyboardType="decimal-pad"
            style={[styles.input, { backgroundColor: c.cream, color: c.ink, borderColor: c.line }]}
          />
        </View>

        {/* Öffnungszeiten */}
        <View style={styles.field}>
          <OpeningHoursEditor value={hours} onChange={setHours} />
        </View>

        {/* Barrierefreiheit */}
        <View style={styles.field}>
          <AccessibilityEditor value={access} onChange={setAccess} />
        </View>

        {/* Standort-Hinweis */}
        <Text style={[styles.locationHint, { color: c.muted }]}>
          📍 {t('profile.edit_no_location')}
        </Text>

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
            <Text style={styles.saveBtnText}>{t('profile.edit_save')}</Text>
          )}
        </TouchableOpacity>

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
              {t('profile.delete_toilet')}
            </Text>
          )}
        </TouchableOpacity>
      </BottomSheetScrollView>
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
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1 },
  catLabel: { fontSize: 13, fontWeight: '500' },
  locationHint: { fontSize: 13, marginBottom: 16, textAlign: 'center' },
  saveBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
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
