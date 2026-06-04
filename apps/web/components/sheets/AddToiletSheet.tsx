'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toilets } from '@/lib/api';

// Emoji + Kategorie-Wert; das Label kommt aus dem übersetzten `category.*`-Namespace
const CATEGORIES = [
  { value: 'public', emoji: '🚽' },
  { value: 'nette_toilette', emoji: '🤝' },
  { value: 'gastronomy', emoji: '🍽️' },
  { value: 'transport', emoji: '🚂' },
  { value: 'mall', emoji: '🏬' },
  { value: 'event', emoji: '🎪' },
  { value: 'private', emoji: '🔒' },
];

interface Props {
  defaultLng: number;
  defaultLat: number;
  /** true wenn Koordinaten per Karten-Klick gesetzt wurden */
  pickedFromMap?: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

export function AddToiletSheet({
  defaultLng,
  defaultLat,
  pickedFromMap = false,
  onClose,
  onCreated,
}: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('public');
  const [address, setAddress] = useState('');
  const [fee, setFee] = useState('');
  // Koordinaten direkt aus Props ableiten: pickedFromMap entscheidet ob Props dominieren
  const lngValue = pickedFromMap ? defaultLng.toFixed(6) : undefined;
  const latValue = pickedFromMap ? defaultLat.toFixed(6) : undefined;
  const [lng, setLng] = useState(String(defaultLng.toFixed(6)));
  const [lat, setLat] = useState(String(defaultLat.toFixed(6)));
  const [isAvailable, setIsAvailable] = useState(true);
  // Ausstattung / Zugänglichkeit
  const [wheelchair, setWheelchair] = useState(false);
  const [euroKey, setEuroKey] = useState(false);
  const [shower, setShower] = useState(false);
  const [babyChanging, setBabyChanging] = useState(false);
  const [genderNeutral, setGenderNeutral] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wenn ein neuer Karten-Klick kommt, Felder aktualisieren
  const displayLng = lngValue ?? lng;
  const displayLat = latValue ?? lat;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name ist Pflichtfeld');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const accessibilityData: Record<string, boolean> = {};
      if (wheelchair) accessibilityData.wheelchair = true;
      if (euroKey) accessibilityData.euro_key = true;
      if (shower) accessibilityData.shower = true;
      if (babyChanging) accessibilityData.baby_changing = true;
      if (genderNeutral) accessibilityData.gender_neutral = true;

      const toilet = await toilets.create({
        name: name.trim(),
        category,
        longitude: parseFloat(displayLng),
        latitude: parseFloat(displayLat),
        address: address.trim() || undefined,
        feeChf: fee ? parseFloat(fee) : undefined,
        isAvailable,
        accessibility: Object.keys(accessibilityData).length > 0 ? accessibilityData : undefined,
      });
      onCreated(toilet.id);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        setError('Sitzung abgelaufen — bitte erneut einloggen.');
      } else {
        setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="absolute inset-0 z-30" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t('contribute.title')}
        className="absolute bottom-0 left-0 right-0 z-40 rounded-t-2xl max-h-[90vh] flex flex-col"
        style={{ background: 'var(--surface)', boxShadow: '0 -8px 40px rgba(15,23,42,.18)' }}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--line)' }} />
        </div>

        <div className="px-5 py-2 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-[var(--ink)]">{t('contribute.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)]"
            style={{ background: 'var(--cream)' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
          {/* Name */}
          <div>
            <label
              className="block text-sm font-medium text-[var(--ink)] mb-1"
              htmlFor="toilet-name"
            >
              {t('contribute.name_label')}
            </label>
            <input
              id="toilet-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('contribute.name_placeholder')}
              maxLength={120}
              required
              className="w-full rounded-lg px-3 py-2 text-sm border border-[var(--line)] bg-[var(--cream)] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>

          {/* Kategorie */}
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              {t('contribute.category_label')}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  aria-pressed={category === c.value}
                  className={`text-sm py-2 px-3 rounded-lg text-left transition-all ${
                    category === c.value
                      ? 'text-white'
                      : 'bg-[var(--cream)] text-[var(--ink)] hover:bg-[var(--line)]'
                  }`}
                  style={
                    category === c.value
                      ? {
                          background:
                            c.value === 'private' ? 'var(--brand-berry)' : 'var(--brand-primary)',
                        }
                      : {}
                  }
                >
                  {c.emoji} {t(`category.${c.value}`)}
                </button>
              ))}
            </div>
            {category === 'private' && (
              <p
                className="mt-2 text-xs rounded-lg px-3 py-2"
                style={{ background: 'rgba(209,48,72,0.08)', color: 'var(--brand-berry)' }}
              >
                🔒 {t('contribute.private_note')}
              </p>
            )}
          </div>

          {/* Adresse */}
          <div>
            <label
              className="block text-sm font-medium text-[var(--ink)] mb-1"
              htmlFor="toilet-address"
            >
              {t('contribute.address_label')}
            </label>
            <input
              id="toilet-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('contribute.address_placeholder')}
              maxLength={300}
              className="w-full rounded-lg px-3 py-2 text-sm border border-[var(--line)] bg-[var(--cream)] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>

          {/* Koordinaten */}
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-1">
              {t('contribute.location_label')}
            </label>
            {pickedFromMap ? (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: '#E8F9F3',
                  border: '1px solid var(--brand-mint)',
                  color: '#006D52',
                }}
              >
                <span>📍</span>
                <span>
                  {parseFloat(displayLat).toFixed(5)}°N, {parseFloat(displayLng).toFixed(5)}°E
                </span>
                <span className="ml-auto text-xs opacity-70">{t('contribute.from_map_click')}</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'var(--cream)',
                  border: '1px solid var(--line)',
                  color: 'var(--muted)',
                }}
              >
                <span>📍</span>
                <span>{t('contribute.pick_on_map')}</span>
              </div>
            )}
            {/* Manuelle Eingabe als Fallback */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input
                id="toilet-lng"
                type="number"
                step="0.000001"
                value={displayLng}
                onChange={(e) => setLng(e.target.value)}
                placeholder={t('contribute.lng')}
                className="w-full rounded-lg px-3 py-2 text-xs border border-[var(--line)] bg-[var(--cream)] text-[var(--ink)] focus:outline-none focus:border-[var(--brand-primary)]"
              />
              <input
                id="toilet-lat"
                type="number"
                step="0.000001"
                value={displayLat}
                onChange={(e) => setLat(e.target.value)}
                placeholder={t('contribute.lat')}
                className="w-full rounded-lg px-3 py-2 text-xs border border-[var(--line)] bg-[var(--cream)] text-[var(--ink)] focus:outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
          </div>

          {/* Ausstattung & Zugänglichkeit */}
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-2">
              {t('accessibility.title')}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                {
                  key: 'wheelchair',
                  label: `♿ ${t('accessibility.wheelchair')}`,
                  value: wheelchair,
                  set: setWheelchair,
                },
                {
                  key: 'euroKey',
                  label: `🔑 ${t('accessibility.euro_key')}`,
                  value: euroKey,
                  set: setEuroKey,
                },
                {
                  key: 'shower',
                  label: `🚿 ${t('accessibility.shower')}`,
                  value: shower,
                  set: setShower,
                },
                {
                  key: 'babyChanging',
                  label: `👶 ${t('accessibility.baby_changing')}`,
                  value: babyChanging,
                  set: setBabyChanging,
                },
                {
                  key: 'genderNeutral',
                  label: `🚻 ${t('accessibility.gender_neutral')}`,
                  value: genderNeutral,
                  set: setGenderNeutral,
                },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => opt.set(!opt.value)}
                  aria-pressed={opt.value}
                  className={`text-sm py-2 px-3 rounded-lg text-left transition-all ${
                    opt.value
                      ? 'text-white'
                      : 'bg-[var(--cream)] text-[var(--ink)] hover:bg-[var(--line)]'
                  }`}
                  style={opt.value ? { background: 'var(--brand-mint)' } : {}}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gebühr */}
          <div>
            <label
              className="block text-sm font-medium text-[var(--ink)] mb-1"
              htmlFor="toilet-fee"
            >
              {t('contribute.fee_label')}
            </label>
            <input
              id="toilet-fee"
              type="number"
              step="0.10"
              min="0"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder={t('contribute.fee_placeholder')}
              className="w-full rounded-lg px-3 py-2 text-sm border border-[var(--line)] bg-[var(--cream)] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>

          {/* Verfügbarkeit */}
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-2">
              {t('contribute.availability')}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                {
                  value: true,
                  label: `✅ ${t('contribute.available')}`,
                  desc: t('contribute.available_desc'),
                },
                {
                  value: false,
                  label: `🚫 ${t('contribute.closed')}`,
                  desc: t('contribute.closed_desc'),
                },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setIsAvailable(opt.value)}
                  style={{
                    flex: 1,
                    padding: '9px 10px',
                    borderRadius: 10,
                    border: `1.5px solid ${isAvailable === opt.value ? 'var(--brand-primary)' : 'var(--line)'}`,
                    background:
                      isAvailable === opt.value ? 'rgba(255,107,53,0.08)' : 'var(--cream)',
                    color: isAvailable === opt.value ? 'var(--brand-primary)' : 'var(--muted)',
                    fontSize: 12,
                    fontWeight: isAvailable === opt.value ? 700 : 400,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 1 }}>{opt.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-[var(--brand-berry)]">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'var(--brand-primary)' }}
          >
            {saving ? t('contribute.submitting') : t('contribute.submit')}
          </button>
        </form>
      </aside>
    </>
  );
}
