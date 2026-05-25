'use client';

import { useEffect, useState, useCallback, useRef, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { toilets as toiletsApi, media, type Toilet, type Score, type Rating } from '@/lib/api';
import { useAuth } from '@/lib/hooks';

interface Props {
  toiletId: string | null;
  onClose: () => void;
  onRate: (toiletId: string) => void;
}

type Detail = Toilet & {
  score: Score;
  photos: { id: string; s3Key: string; url?: string; userId: string }[];
  ratings: Rating[];
};

/* ── Score colour ─────────────────────────────────────────────────────────── */
function netColor(net: number) {
  if (net > 1) return 'var(--brand-mint)';
  if (net > 0) return 'var(--brand-secondary)';
  if (net > -1) return 'var(--brand-primary)';
  return 'var(--brand-berry)';
}

/* ── Photo lightbox ───────────────────────────────────────────────────────── */
function PhotoLightbox({
  urls,
  startIndex,
  onClose,
}: {
  urls: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);

  const prev = useCallback(() => setIdx((i) => (i - 1 + urls.length) % urls.length), [urls.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % urls.length), [urls.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
      >
        {/* img statt next/image: lightbox braucht dynamische Dimensionen */}
        <img
          src={urls[idx]}
          alt={`Foto ${idx + 1}`}
          style={{
            maxWidth: '90vw',
            maxHeight: '82vh',
            objectFit: 'contain',
            borderRadius: 12,
            display: 'block',
          }}
        />
        {/* Counter */}
        <span
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 999,
          }}
        >
          {idx + 1} / {urls.length}
        </span>
        {urls.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Vorheriges Foto"
              style={{
                position: 'absolute',
                left: -44,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.18)',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                cursor: 'pointer',
                fontSize: 18,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Nächstes Foto"
              style={{
                position: 'absolute',
                right: -44,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.18)',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                cursor: 'pointer',
                fontSize: 18,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ›
            </button>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Schliessen"
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(255,255,255,0.18)',
          border: 'none',
          borderRadius: '50%',
          width: 36,
          height: 36,
          cursor: 'pointer',
          fontSize: 20,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ✕
      </button>
    </div>
  );
}

/* ── Criteria breakdown ───────────────────────────────────────────────────── */
const CRITERIA_KEYS = [
  'accessibility',
  'cleanliness',
  'hygiene',
  'style',
  'amenities',
  'safety',
  'inclusivity',
  'cost',
  'wait',
  'kids',
] as const;

function CriteriaBreakdown({ detail }: { detail: Detail }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const rows = CRITERIA_KEYS.map((k) => {
    const rec = detail as unknown as Record<string, number>;
    const flowers = rec[`flowers${k.charAt(0).toUpperCase()}${k.slice(1)}`] ?? 0;
    const flies = rec[`flies${k.charAt(0).toUpperCase()}${k.slice(1)}`] ?? 0;
    const net = flowers - flies;
    return { key: k, flowers, flies, net };
  }).filter((r) => r.flowers > 0 || r.flies > 0);

  if (rows.length === 0) return null;

  const maxVal = Math.max(...rows.flatMap((r) => [r.flowers, r.flies]), 1);

  return (
    <div style={{ borderRadius: 12, border: '1px solid var(--line)', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '11px 14px',
          background: 'var(--cream)',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--ink)',
        }}
      >
        <span>📊 {t('toilet.criteria_breakdown')}</span>
        <span
          style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'none',
            color: 'var(--muted)',
            fontSize: 11,
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {rows.map(({ key, flowers, flies, net }) => (
            <div key={key}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
                  {t(`criteria.${key}`)}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: netColor(net) }}>
                  {net > 0 ? '+' : ''}
                  {net.toFixed(1)}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {flowers > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, width: 16 }}>🌸</span>
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 999,
                        background: 'var(--line)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${(flowers / maxVal) * 100}%`,
                          background: 'var(--brand-mint)',
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <span
                      style={{ fontSize: 11, color: 'var(--muted)', width: 20, textAlign: 'right' }}
                    >
                      {flowers}
                    </span>
                  </div>
                )}
                {flies > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, width: 16 }}>🪰</span>
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 999,
                        background: 'var(--line)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${(flies / maxVal) * 100}%`,
                          background: 'var(--brand-berry)',
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <span
                      style={{ fontSize: 11, color: 'var(--muted)', width: 20, textAlign: 'right' }}
                    >
                      {flies}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Accessibility badges ─────────────────────────────────────────────────── */
function AccessBadge({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 999,
        background: 'var(--cream)',
        border: '1px solid var(--line)',
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--ink)',
      }}
    >
      {emoji} {label}
    </span>
  );
}

/* ── ToiletSheet ──────────────────────────────────────────────────────────── */
export function ToiletSheet({ toiletId, onClose, onRate }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<{ urls: string[]; idx: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const fileInputId = useId();

  useEffect(() => {
    if (!toiletId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    toiletsApi
      .get(toiletId)
      .then((d) => setDetail(d as unknown as Detail))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [toiletId]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleShare = useCallback(async () => {
    const url = window.location.origin + `/karte?t=${toiletId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: detail?.name, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [toiletId, detail?.name]);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !toiletId) return;
      setUploading(true);
      setUploadErr(null);
      try {
        await media.upload(file, toiletId);
        // Detail neu laden um neues Foto anzuzeigen
        const updated = await toiletsApi.get(toiletId);
        setDetail(updated as unknown as Detail);
      } catch (err) {
        setUploadErr(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
      } finally {
        setUploading(false);
        e.target.value = ''; // Input zurücksetzen
      }
    },
    [toiletId],
  );

  const handleDeletePhoto = useCallback(
    async (photoId: string) => {
      if (!confirm('Foto wirklich löschen?')) return;
      try {
        await media.delete(photoId);
        const updated = await toiletsApi.get(toiletId!);
        setDetail(updated as unknown as Detail);
      } catch {
        /* ignorieren */
      }
    },
    [toiletId],
  );

  const handleNavigate = useCallback(() => {
    if (!detail) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${detail.latitude},${detail.longitude}`,
      '_blank',
      'noopener',
    );
  }, [detail]);

  if (!toiletId) return null;

  const score = detail?.score;
  const net = score?.net ?? 0;
  const photos = detail?.photos ?? [];
  const photoUrls = photos.map((p) => p.url ?? media.url(p.s3Key));

  const acc = detail?.accessibility;
  const accBadges: { emoji: string; label: string }[] = [];
  if (acc?.wheelchair) accBadges.push({ emoji: '♿', label: t('accessibility.wheelchair') });
  if (acc?.step_free) accBadges.push({ emoji: '🛗', label: t('accessibility.step_free') });
  if (acc?.baby_changing) accBadges.push({ emoji: '👶', label: t('accessibility.baby_changing') });
  if (acc?.gender_neutral)
    accBadges.push({ emoji: '⚧️', label: t('accessibility.gender_neutral') });
  if (acc?.euro_key) accBadges.push({ emoji: '🔑', label: t('accessibility.euro_key') });
  if (acc?.shower) accBadges.push({ emoji: '🚿', label: t('accessibility.shower') });

  return (
    <>
      {lightbox && (
        <PhotoLightbox
          urls={lightbox.urls}
          startIndex={lightbox.idx}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 38, background: 'rgba(11,19,43,0.2)' }}
        className="toilet-backdrop"
      />

      {/* Sheet / Panel */}
      <aside
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Toiletten-Detail"
        className="toilet-sheet"
        style={{ background: 'var(--paper)', zIndex: 40 }}
      >
        {/* Drag handle (mobile only) */}
        <div className="toilet-handle">
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 999,
              background: 'var(--line)',
              margin: '0 auto',
            }}
          />
        </div>

        {/* Header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px 0',
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handleNavigate}
              title={t('toilet.navigate')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'var(--cream)',
                border: '1px solid var(--line)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              🧭 {t('toilet.navigate')}
            </button>
            <button
              type="button"
              onClick={handleShare}
              title={t('toilet.share')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 8,
                background: copied ? 'var(--brand-mint)' : 'var(--cream)',
                border: '1px solid var(--line)',
                fontSize: 12,
                fontWeight: 600,
                color: copied ? '#fff' : 'var(--ink)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {copied ? '✓ Kopiert' : `🔗 ${t('toilet.share')}`}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--cream)',
              border: '1px solid var(--line)',
              cursor: 'pointer',
              fontSize: 16,
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {loading && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 0',
            }}
          >
            <div
              className="animate-spin"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '2px solid var(--brand-primary)',
                borderTopColor: 'transparent',
              }}
            />
          </div>
        )}

        {!loading && detail && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 24px' }}>
            {/* ── Title row ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              {/* Score bubble */}
              {score && score.count > 0 ? (
                <div
                  style={{
                    flexShrink: 0,
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: netColor(net),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 14px ${netColor(net)}44`,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                    {net > 0 ? '+' : ''}
                    {net.toFixed(1)}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      color: 'rgba(255,255,255,0.8)',
                      lineHeight: 1,
                      marginTop: 2,
                    }}
                  >
                    {score.count}×
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    flexShrink: 0,
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'var(--cream)',
                    border: '1px solid var(--line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  ?
                </div>
              )}

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: 'var(--ink)',
                      margin: 0,
                      lineHeight: 1.25,
                    }}
                  >
                    {detail.name}
                  </h2>
                  {detail.verified && (
                    <span
                      title="Verifiziert"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '1px 7px',
                        borderRadius: 999,
                        background: '#FFF3CD',
                        border: '1px solid #FFD700',
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#A67C00',
                      }}
                    >
                      ⭐ {t('toilet.verified')}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                  <span
                    style={{
                      padding: '2px 9px',
                      borderRadius: 999,
                      background: 'var(--brand-secondary)',
                      color: 'var(--brand-deep)',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {t(`category.${detail.category}`) || detail.category}
                  </span>
                  {(detail.feeChf == null || detail.feeChf === 0) && (
                    <span
                      style={{
                        padding: '2px 9px',
                        borderRadius: 999,
                        background: '#E8F9F3',
                        border: '1px solid var(--brand-mint)',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#006D52',
                      }}
                    >
                      💸 {t('filter.free')}
                    </span>
                  )}
                  {detail.feeChf != null && detail.feeChf > 0 && (
                    <span
                      style={{
                        padding: '2px 9px',
                        borderRadius: 999,
                        background: 'var(--cream)',
                        border: '1px solid var(--line)',
                        fontSize: 11,
                        color: 'var(--muted)',
                      }}
                    >
                      CHF {Number(detail.feeChf).toFixed(2)}
                    </span>
                  )}
                  {(acc?.wheelchair || acc?.step_free) && (
                    <span
                      style={{
                        padding: '2px 9px',
                        borderRadius: 999,
                        background: '#EEF3FF',
                        border: '1px solid #93C5FD',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#1D4ED8',
                      }}
                    >
                      ♿ {t('filter.accessible')}
                    </span>
                  )}
                </div>
                {detail.address && (
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      margin: '6px 0 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    📍 {detail.address}
                    {detail.distanceM != null && (
                      <span style={{ fontWeight: 600 }}>
                        ·{' '}
                        {detail.distanceM < 1000
                          ? `${detail.distanceM} m`
                          : `${(detail.distanceM / 1000).toFixed(1)} km`}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* ── Photo gallery ── */}
            {photoUrls.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  overflowX: 'auto',
                  marginBottom: 14,
                  scrollbarWidth: 'none',
                }}
              >
                {photos.map((photo, i) => {
                  const url = photoUrls[i];
                  const canDelete =
                    user &&
                    (photo.userId === user.id || ['admin', 'moderator'].includes(user.role));
                  return (
                    <div
                      key={photo.id}
                      style={{ position: 'relative', flexShrink: 0 }}
                      className="photo-thumb-wrap"
                    >
                      {/* img statt next/image: Galerie braucht dynamische Dimensionen */}
                      <img
                        src={url}
                        alt={`Foto ${i + 1}`}
                        onClick={() => setLightbox({ urls: photoUrls, idx: i })}
                        style={{
                          height: 96,
                          width: 96,
                          objectFit: 'cover',
                          borderRadius: 10,
                          cursor: 'pointer',
                          display: 'block',
                        }}
                      />
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          aria-label="Foto löschen"
                          className="photo-delete-btn"
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.65)',
                            border: 'none',
                            color: '#fff',
                            fontSize: 11,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1,
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Accessibility features ── */}
            {accBadges.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {accBadges.map((b) => (
                  <AccessBadge key={b.label} emoji={b.emoji} label={b.label} />
                ))}
              </div>
            )}

            {/* ── Criteria breakdown ── */}
            <div style={{ marginBottom: 14 }}>
              <CriteriaBreakdown detail={detail} />
            </div>

            {/* ── Recent ratings preview ── */}
            {detail.ratings && detail.ratings.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 8,
                  }}
                >
                  {t('toilet.recent_ratings')}
                </div>
                {detail.ratings.slice(0, 3).map((r) =>
                  r.comment ? (
                    <div
                      key={r.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: 'var(--cream)',
                        border: '1px solid var(--line)',
                        marginBottom: 6,
                        fontSize: 13,
                        color: 'var(--ink)',
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ opacity: 0.7, fontSize: 11 }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                      <p style={{ margin: '4px 0 0' }}>{r.comment}</p>
                    </div>
                  ) : null,
                )}
              </div>
            )}

            {/* ── Aktions-Buttons ── */}
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Bewerten */}
                <button
                  type="button"
                  onClick={() => onRate(detail.id)}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: 12,
                    background: 'var(--brand-primary)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700,
                    transition: 'all 0.15s',
                    boxShadow: '0 4px 16px rgba(255,107,53,0.35)',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)')
                  }
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = 'none')}
                >
                  🌸 {t('toilet.rate')}
                </button>

                {/* Foto hochladen */}
                <label
                  htmlFor={fileInputId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    width: '100%',
                    padding: '11px',
                    borderRadius: 12,
                    background: 'var(--cream)',
                    border: '1.5px solid var(--line)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.7 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {uploading ? (
                    <>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          border: '2px solid var(--muted)',
                          borderTopColor: 'transparent',
                          animation: 'spin 0.7s linear infinite',
                        }}
                      />{' '}
                      Wird hochgeladen…
                    </>
                  ) : (
                    <>📷 Foto hinzufügen</>
                  )}
                </label>
                <input
                  id={fileInputId}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
                {uploadErr && (
                  <p style={{ fontSize: 12, color: 'var(--brand-berry)', margin: 0 }}>
                    ⚠ {uploadErr}
                  </p>
                )}
              </div>
            ) : (
              <p
                style={{
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'var(--muted)',
                  padding: '8px 0',
                }}
              >
                {t('toilet.login_to_rate')}
              </p>
            )}
          </div>
        )}

        <style>{`
          .toilet-sheet {
            position: fixed;
            bottom: 0; left: 0; right: 0;
            border-radius: 20px 20px 0 0;
            max-height: 80vh;
            display: flex; flex-direction: column;
            box-shadow: 0 -8px 40px rgba(15,23,42,.22);
            overflow: hidden;
          }
          .toilet-handle { padding: 10px 0 4px; }
          @media (min-width: 768px) {
            .toilet-backdrop { display: none; }
            .toilet-sheet {
              top: 0; left: auto; bottom: 0;
              width: 420px; max-height: 100vh;
              border-radius: 0;
              border-left: 1px solid var(--line);
              box-shadow: -8px 0 48px rgba(15,23,42,.14);
            }
            .toilet-handle { display: none; }
          }
        `}</style>
      </aside>
    </>
  );
}
