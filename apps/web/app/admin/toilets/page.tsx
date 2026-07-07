'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { moderation, toilets as toiletsApi, type AdminToilet } from '@/lib/api';

// Verify-Aktion braucht eigene Helfer-Funktion (gibt neues Objekt zurück)
async function toggleVerify(toilet: AdminToilet): Promise<AdminToilet> {
  if (toilet.verified) {
    await toiletsApi.unverify(toilet.id);
    return { ...toilet, verified: false };
  } else {
    await toiletsApi.verify(toilet.id);
    return { ...toilet, verified: true };
  }
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active: { label: '✓ Aktiv', color: '#06D6A0' },
  hidden: { label: '◌ Versteckt', color: '#FFD23F' },
  removed: { label: '✕ Entfernt', color: '#EF476F' },
};

const CATEGORY_EMOJI: Record<string, string> = {
  public: '🏛',
  nette_toilette: '💚',
  gastronomy: '☕',
  transport: '🚉',
  mall: '🛍',
  event: '🎪',
  private: '🔒',
};

// ── Toiletten-Zeile ───────────────────────────────────────────────────────────
function ToiletRow({
  toilet,
  onStatusChange,
  onVerify,
  onDelete,
}: {
  toilet: AdminToilet;
  onStatusChange: (id: string, status: 'active' | 'hidden' | 'removed') => Promise<void>;
  onVerify: (toilet: AdminToilet) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handle(action: () => Promise<unknown>) {
    setBusy(true);
    setErr(null);
    try {
      await action();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setBusy(false);
    }
  }

  const st = STATUS_LABEL[toilet.status] ?? { label: toilet.status, color: '#9AA4B2' };

  return (
    <tr
      style={{
        borderBottom: '1px solid var(--line)',
        opacity: toilet.status === 'removed' ? 0.5 : 1,
      }}
    >
      {/* Name + Kategorie */}
      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 16 }}>{CATEGORY_EMOJI[toilet.category] ?? '🚽'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
              {toilet.name}
              {toilet.verified && (
                <span
                  style={{
                    marginLeft: 5,
                    fontSize: 10,
                    background: 'var(--verified-bg)',
                    border: '1px solid var(--verified-border)',
                    borderRadius: 999,
                    padding: '1px 5px',
                    color: 'var(--verified-fg)',
                    fontWeight: 700,
                  }}
                >
                  ⭐
                </span>
              )}
            </div>
            {toilet.address && (
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                {toilet.address}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Ersteller */}
      <td
        style={{
          padding: '10px 8px',
          verticalAlign: 'middle',
          fontSize: 12,
          color: 'var(--muted)',
        }}
      >
        @{toilet.createdBy.handle}
        <br />
        <span style={{ fontSize: 10 }}>
          {new Date(toilet.createdAt).toLocaleDateString('de-CH')}
        </span>
      </td>

      {/* Ratings / Fotos */}
      <td
        style={{
          padding: '10px 8px',
          verticalAlign: 'middle',
          fontSize: 12,
          color: 'var(--muted)',
          textAlign: 'center',
        }}
      >
        🌸 {toilet._count.ratings} · 📷 {toilet._count.photos}
      </td>

      {/* Status */}
      <td style={{ padding: '10px 8px', verticalAlign: 'middle' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 9px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            background: st.color + '22',
            color: st.color,
            border: `1px solid ${st.color}44`,
          }}
        >
          {st.label}
        </span>
      </td>

      {/* Aktionen */}
      <td style={{ padding: '10px 8px', verticalAlign: 'middle' }}>
        {err && (
          <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--error-text)' }}>⚠ {err}</p>
        )}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {/* Link zur Karte */}
          <a
            href={`/karte?t=${toilet.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '4px 9px',
              borderRadius: 7,
              border: '1px solid var(--line)',
              background: 'var(--cream)',
              color: 'var(--muted)',
              fontSize: 11,
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            🗺
          </a>

          {/* Status-Toggle */}
          {toilet.status === 'active' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => handle(() => onStatusChange(toilet.id, 'hidden'))}
              style={{
                padding: '4px 9px',
                borderRadius: 7,
                border: '1px solid #FFD23F',
                background: '#FFF9E6',
                color: '#A07800',
                fontSize: 11,
                fontWeight: 700,
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.6 : 1,
              }}
            >
              Verstecken
            </button>
          ) : toilet.status === 'hidden' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => handle(() => onStatusChange(toilet.id, 'active'))}
              style={{
                padding: '4px 9px',
                borderRadius: 7,
                border: '1px solid #06D6A0',
                background: '#E8FBF6',
                color: '#006D52',
                fontSize: 11,
                fontWeight: 700,
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.6 : 1,
              }}
            >
              Aktivieren
            </button>
          ) : null}

          {/* Verify toggle */}
          <button
            type="button"
            disabled={busy}
            onClick={() => handle(() => onVerify(toilet))}
            title={toilet.verified ? 'Verifizierung entfernen' : 'Verifizieren'}
            style={{
              padding: '4px 9px',
              borderRadius: 7,
              border: `1px solid ${toilet.verified ? 'var(--verified-border)' : 'var(--line)'}`,
              background: toilet.verified ? 'var(--verified-bg)' : 'var(--cream)',
              color: toilet.verified ? 'var(--verified-fg)' : 'var(--muted)',
              fontSize: 11,
              fontWeight: 700,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1,
            }}
          >
            {toilet.verified ? '⭐ Verifiziert' : '☆ Verify'}
          </button>

          {/* Löschen */}
          {toilet.status !== 'removed' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (confirm(`"${toilet.name}" wirklich löschen?`))
                  handle(() => onDelete(toilet.id));
              }}
              style={{
                padding: '4px 9px',
                borderRadius: 7,
                border: '1px solid var(--score-berry-text)',
                background: 'transparent',
                color: 'var(--score-berry-text)',
                fontSize: 11,
                fontWeight: 700,
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.6 : 1,
              }}
            >
              🗑
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Admin Toilets Page ────────────────────────────────────────────────────────
export default function AdminToiletsPage() {
  const [items, setItems] = useState<AdminToilet[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (pg: number, query: string, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await moderation.listToilets(pg, query || undefined, status || undefined);
      setItems(res.items);
      setTotal(res.total);
      setPages(res.pages);
    } catch {
      setError('Toiletten konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, q, statusFilter);
  }, [page, statusFilter, load]); // q handled via debounce below

  function handleSearch(val: string) {
    setQ(val);
    setPage(1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1, val, statusFilter), 350);
  }

  async function handleStatusChange(id: string, status: 'active' | 'hidden' | 'removed') {
    await moderation.setToiletStatus(id, status);
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  async function handleVerify(toilet: AdminToilet) {
    const updated = await toggleVerify(toilet);
    setItems((prev) => prev.map((t) => (t.id === toilet.id ? updated : t)));
  }

  async function handleDelete(id: string) {
    // 'removed' statt 'hidden' — setzt einen klar anderen Status als "Verstecken"
    await moderation.setToiletStatus(id, 'removed');
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'removed' } : t)));
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
        <a href="/admin" style={{ fontSize: 20, textDecoration: 'none', color: 'var(--muted)' }}>
          ←
        </a>
        <span style={{ fontSize: 22 }}>🚽</span>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
          Alle Toiletten
          {total > 0 && (
            <span
              style={{
                marginLeft: 10,
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--muted)',
              }}
            >
              ({total})
            </span>
          )}
        </h1>
      </div>

      {/* Filter-Bar */}
      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--line)',
          padding: '12px 24px',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="search"
          placeholder="Suche nach Name oder Adresse…"
          value={q}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--line)',
            background: 'var(--paper)',
            color: 'var(--ink)',
            fontSize: 13,
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--line)',
            background: 'var(--paper)',
            color: 'var(--ink)',
            fontSize: 13,
          }}
        >
          <option value="">Alle Status</option>
          <option value="active">✓ Aktiv</option>
          <option value="hidden">◌ Versteckt</option>
          <option value="removed">✕ Entfernt</option>
        </select>
      </div>

      {/* Inhalt */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
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
          <p style={{ textAlign: 'center', color: 'var(--error-text)', padding: '24px 0' }}>
            ⚠ {error}
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ fontWeight: 600 }}>Keine Toiletten gefunden</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 14,
              border: '1px solid var(--line)',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--cream)', fontSize: 11, color: 'var(--muted)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>
                    Toilette
                  </th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700 }}>
                    Ersteller
                  </th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700 }}>
                    Aktivität
                  </th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700 }}>
                    Status
                  </th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700 }}>
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <ToiletRow
                    key={t.id}
                    toilet={t}
                    onStatusChange={handleStatusChange}
                    onVerify={handleVerify}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              marginTop: 24,
            }}
          >
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: 13,
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.4 : 1,
              }}
            >
              ← Zurück
            </button>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              Seite {page} / {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => setPage((p) => p + 1)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: 13,
                cursor: page >= pages ? 'not-allowed' : 'pointer',
                opacity: page >= pages ? 0.4 : 1,
              }}
            >
              Weiter →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
