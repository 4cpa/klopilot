'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminData, type AdminStats } from '@/lib/api';
import { RequireAdmin } from '@/components/admin/RequireAdmin';

const CATEGORY_EMOJI: Record<string, string> = {
  public: '🏛',
  nette_toilette: '💚',
  gastronomy: '☕',
  transport: '🚉',
  mall: '🛍',
  event: '🎪',
  private: '🔒',
};

function StatTile({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: '16px 18px',
        flex: '1 1 160px',
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function BreakdownList({
  title,
  rows,
  emoji,
}: {
  title: string;
  rows: { key: string; count: number }[];
  emoji?: Record<string, string>;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: '16px 18px',
        flex: '1 1 300px',
      }}
    >
      <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r) => (
          <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)', width: 110, flexShrink: 0 }}>
              {emoji?.[r.key] ? `${emoji[r.key]} ` : ''}
              {r.key}
            </span>
            <div
              style={{
                flex: 1,
                height: 8,
                borderRadius: 999,
                background: 'var(--cream)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${(r.count / max) * 100}%`,
                  height: '100%',
                  background: 'var(--brand-primary)',
                  borderRadius: 999,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--ink)',
                width: 32,
                textAlign: 'right',
              }}
            >
              {r.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDataPage() {
  return (
    <RequireAdmin>
      <AdminDataPageContent />
    </RequireAdmin>
  );
}

function AdminDataPageContent() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await adminData.stats());
    } catch {
      setError('Kennzahlen konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      await adminData.downloadToiletsCsv();
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Export fehlgeschlagen');
    } finally {
      setExporting(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--paper)', paddingBottom: 48 }}>
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
        <span style={{ fontSize: 22 }}>📊</span>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
          Datenverwaltung
        </h1>
        <button
          type="button"
          disabled={exporting}
          onClick={handleExport}
          style={{
            marginLeft: 'auto',
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--brand-primary)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: exporting ? 'not-allowed' : 'pointer',
            opacity: exporting ? 0.6 : 1,
          }}
        >
          {exporting ? 'Export läuft…' : '⬇ Toiletten als CSV exportieren'}
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        {exportError && (
          <p style={{ textAlign: 'center', color: 'var(--brand-berry)', marginBottom: 16 }}>
            ⚠ {exportError}
          </p>
        )}

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

        {!loading && !error && stats && (
          <>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
              <StatTile label="Toiletten" value={stats.totalToilets} emoji="🚽" />
              <StatTile label="Benutzer" value={stats.totalUsers} emoji="👤" />
              <StatTile label="Bewertungen" value={stats.ratingsCount} emoji="🌸" />
              <StatTile label="Offene Reports" value={stats.openReports} emoji="🚨" />
              <StatTile label="Fotos in Prüfung" value={stats.pendingPhotos} emoji="📷" />
            </div>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <BreakdownList
                title="Toiletten nach Status"
                rows={stats.toiletsByStatus.map((r) => ({ key: r.status, count: r.count }))}
              />
              <BreakdownList
                title="Toiletten nach Kategorie"
                rows={stats.toiletsByCategory.map((r) => ({ key: r.category, count: r.count }))}
                emoji={CATEGORY_EMOJI}
              />
              <BreakdownList
                title="Benutzer nach Rolle"
                rows={stats.usersByRole.map((r) => ({ key: r.role, count: r.count }))}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
