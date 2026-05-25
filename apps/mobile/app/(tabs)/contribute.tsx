import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { toiletsApi } from '@/lib/api';
import { useAuth, useThemeColors } from '@/lib/hooks';
import { OpeningHoursEditor } from '@/components/ui/OpeningHoursEditor';
import { AccessibilityEditor } from '@/components/ui/AccessibilityEditor';
import type { OpeningHours, Accessibility } from '@klopilot/shared-types';

const CATEGORY_KEYS = [
  'public',
  'nette_toilette',
  'gastronomy',
  'transport',
  'mall',
  'event',
  'private',
] as const;

export default function BeitragenTab() {
  const c = useThemeColors();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('public');
  const [address, setAddress] = useState('');
  const [fee, setFee] = useState('');
  const [lng, setLng] = useState('');
  const [lat, setLat] = useState('');
  const [hours, setHours] = useState<OpeningHours>({});
  const [access, setAccess] = useState<Accessibility>({});
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  function resetForm() {
    setName('');
    setAddress('');
    setFee('');
    setLng('');
    setLat('');
    setHours({});
    setAccess({});
    setCategory('public');
  }

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('errors.location_denied'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLng(pos.coords.longitude.toFixed(6));
      setLat(pos.coords.latitude.toFixed(6));
    } catch {
      Alert.alert(t('errors.location_failed'));
    } finally {
      setLocating(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert(t('errors.name_required'));
      return;
    }
    if (!lng || !lat) {
      Alert.alert(t('errors.coords_required'), t('errors.coords_hint'));
      return;
    }
    if (!user) {
      Alert.alert(t('errors.login_required_title'), t('errors.login_required'));
      return;
    }

    setSaving(true);
    try {
      const toilet = await toiletsApi.create({
        name: name.trim(),
        category,
        longitude: parseFloat(lng),
        latitude: parseFloat(lat),
        address: address.trim() || undefined,
        feeChf: fee ? parseFloat(fee) : undefined,
        visibility: category === 'private' ? 'private' : 'public',
        openingHours: Object.keys(hours).length > 0 ? hours : undefined,
        accessibility: Object.keys(access).length > 0 ? access : undefined,
      });
      Alert.alert(
        t('contribute.success_title'),
        t('contribute.success_message', { name: toilet.name }),
        [
          {
            text: t('contribute.go_to_map'),
            onPress: () => {
              resetForm();
              router.replace('/(tabs)');
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('errors.generic'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.paper }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: c.ink }]}>{t('contribute.title')}</Text>
      <Text style={[styles.subtitle, { color: c.muted }]}>{t('contribute.subtitle')}</Text>

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

      {/* Koordinaten */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: c.ink }]}>{t('contribute.location_label')}</Text>
        <TouchableOpacity
          onPress={useCurrentLocation}
          style={[styles.locBtn, { backgroundColor: c.brandPrimary }]}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.locBtnText}>{t('contribute.use_location')}</Text>
          )}
        </TouchableOpacity>
        {lng && lat && (
          <Text style={[styles.coords, { color: c.muted }]}>
            {parseFloat(lat).toFixed(5)}° N, {parseFloat(lng).toFixed(5)}° E
          </Text>
        )}
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
      <View
        style={[
          styles.field,
          styles.sectionCard,
          { backgroundColor: c.surface, borderColor: c.line },
        ]}
      >
        <OpeningHoursEditor value={hours} onChange={setHours} />
      </View>

      {/* Barrierefreiheit */}
      <View
        style={[
          styles.field,
          styles.sectionCard,
          { backgroundColor: c.surface, borderColor: c.line },
        ]}
      >
        <AccessibilityEditor value={access} onChange={setAccess} />
      </View>

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        style={[styles.saveBtn, { backgroundColor: c.brandPrimary, opacity: saving ? 0.6 : 1 }]}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>{t('contribute.submit')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 70, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 15, marginBottom: 24 },
  field: { marginBottom: 20 },
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
  locBtn: { borderRadius: 12, padding: 14, alignItems: 'center' },
  locBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  coords: { fontSize: 13, marginTop: 8, textAlign: 'center' },
  sectionCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  saveBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
