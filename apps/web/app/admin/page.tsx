'use client';

import { useState, useEffect, useCallback } from 'react';
import { moderation, media, type PendingPhoto, type Report } from '@/lib/api';

type Tab = 'photos' | 'reports';

// ── Foto-Karte ────────────────────────────────────────────────────────────────
function PhotoCard({
  photo,
  onApprove,
  onReject,
}: {
  photo: PendingPhoto;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const url = media.url(photo.s3Key);

  async function handle(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Foto */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '66%' }}>
        <img
          src={url}
          alt="Zu moderierendes Foto"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Meta */}
      <div style={{ padding: '10px 12px', flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
          🚽 {photo.toilet.name}
        </p>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--muted)' }}>
          von @{photo.user.handle} · {new Date(photo.createdAt).toLocaleDateString('de-CH')}
        </p>
      </div>

      {/* Aktionen */}
      <div style={{ display: 'flex', gap: 8, padding: '0 12px 12px' }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => handle(onApprove)}
          style={{
            flex: 1,
            padding: '9px 0',
            borderRadius: 8,
            border: 'none',
            background: 'var(--brand-mint)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
          }}
        >
          ✓ Freigeben
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => handle(onReject)}
          style={{
            flex: 1,
            padding: '9px 0',
            borderRadius: 8,
            border: 'none',
            background: 'var(--brand-berry)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
          }}
        >
          ✕ Ablehnen
        </button>
      </div>
    </div>
  );
}

// ── Report-Zeile ──────────────────────────────────────────────────────────────
function ReportRow({
  report,
  onResolve,
  onDismiss,
}: {
  report: Report;
  onResolve: () => Promise<void>;
  onDismiss: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function handle(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  const typeLabel: Record<string, string> = {
    toilet: '🚽 Toilette',
    rating: '🌸 Bewertung',
    photo: '📷 Foto',
    user: '👤 Nutzer',
  };

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 999,
              background: 'var(--cream)',
              color: 'var(--muted)',
              border: '1px solid var(--line)',
            }}
          >
            {typeLabel[report.targetType] ?? report.targetType}
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
            {new Date(report.createdAt).toLocaleDateString('de-CH')}
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: 'var(--ink)',
            lineHeight: 1.45,
          }}
        >
          {report.reason}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--muted)' }}>
          von @{report.reporter.handle}
          {report.reporter.email ? ` (${report.reporter.email})` : ''}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => handle(onResolve)}
          style={{
            padding: '6px 12px',
            borderRadius: 7,
            border: 'none',
            background: 'var(--brand-mint)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 12,
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
          }}
        >
          ✓ Erledigt
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => handle(onDismiss)}
          style={{
            padding: '6px 12px',
            borderRadius: 7,
            border: '1px solid var(--line)',
            background: 'transparent',
            color: 'var(--muted)',
            fontWeight: 600,
            fontSize: 12,
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
          }}
        >
          Ignorieren
        </button>
      </div>
    </div>
  );
}

// ── Admin Page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('photos');
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [photoTotal, setPhotoTotal] = useState(0);
  const [reportTotal, setReportTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await moderation.photos();
      setPhotos(res.items);
      setPhotoTotal(res.total);
    } catch {
      setError('Fotos konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await moderation.reports();
      setReports(res.items);
      setReportTotal(res.total);
    } catch {
      setError('Reports konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'photos') loadPhotos();
    else loadReports();
  }, [tab, loadPhotos, loadReports]);

  async function handleApprove(id: string) {
    await moderation.approvePhoto(id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setPhotoTotal((n) => n - 1);
  }

  async function handleReject(id: string) {
    await moderation.rejectPhoto(id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setPhotoTotal((n) => n - 1);
  }

  async function handleResolve(id: string) {
    await moderation.resolveReport(id, 'resolved');
    setReports((prev) => prev.filter((r) => r.id !== id));
    setReportTotal((n) => n - 1);
  }

  async function handleDismiss(id: string) {
    await moderation.resolveReport(id, 'dismissed');
    setReports((prev) => prev.filter((r) => r.id !== id));
    setReportTotal((n) => n - 1);
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--paper)',
        padding: '0 0 48px',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--line)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <a
          href="/karte"
          style={{ fontSize: 20, textDecoration: 'none', color: 'var(--muted)' }}
          title="Zurück zur Karte"
        >
          ←
        </a>
        <span style={{ fontSize: 22 }}>🔧</span>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
          Moderation
        </h1>
        <a
          href="/admin/toilets"
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            color: 'var(--muted)',
            textDecoration: 'none',
          }}
        >
          Alle Toiletten →
        </a>
      </div>

      {/* Tab-Bar */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid var(--line)',
          background: 'var(--surface)',
          padding: '0 24px',
        }}
      >
        {(
          [
            { key: 'photos', label: '📷 Fotos', count: photoTotal },
            { key: 'reports', label: '🚨 Reports', count: reportTotal },
          ] as { key: Tab; label: string; count: number }[]
        ).map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom:
                tab === key ? '2px solid var(--brand-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: tab === key ? 700 : 500,
              color: tab === key ? 'var(--brand-primary)' : 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {label}
            {count > 0 && (
              <span
                style={{
                  background: 'var(--brand-berry)',
                  color: '#fff',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '1px 6px',
                  minWidth: 18,
                  textAlign: 'center',
                }}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Inhalt */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div
              className="animate-spin"
              style={{
                display: 'inline-block',
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '2px solid var(--brand-primary)',
                borderTopColor: 'transparent',
              }}
            />
          </div>
        )}

        {error && (
          <p style={{ textAlign: 'center', color: 'var(--brand-berry)', padding: '24px 0' }}>
            ⚠ {error}
          </p>
        )}

        {!loading && !error && tab === 'photos' && (
          <>
            {photos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <p style={{ fontWeight: 600 }}>Keine Fotos zur Moderation</p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 16,
                }}
              >
                {photos.map((p) => (
                  <PhotoCard
                    key={p.id}
                    photo={p}
                    onApprove={() => handleApprove(p.id)}
                    onReject={() => handleReject(p.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !error && tab === 'reports' && (
          <>
            {reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <p style={{ fontWeight: 600 }}>Keine offenen Reports</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reports.map((r) => (
                  <ReportRow
                    key={r.id}
                    report={r}
                    onResolve={() => handleResolve(r.id)}
                    onDismiss={() => handleDismiss(r.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
