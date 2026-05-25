'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  toilets as toiletsApi,
  heatmap as heatmapApi,
  type Toilet,
  type HeatmapPoint,
} from '@/lib/api';
import { useGeoLocation } from '@/lib/hooks';
import { AppBar } from '@/components/ui/AppBar';
import { FilterBar, DEFAULT_FILTERS, type MapFilters } from '@/components/map/FilterBar';
import { ProfileSidebar } from '@/components/ui/ProfileSidebar';
import { ToiletSheet } from '@/components/sheets/ToiletSheet';
import { RatingSheet } from '@/components/sheets/RatingSheet';
import { AddToiletSheet } from '@/components/sheets/AddToiletSheet';
import { LoginModal } from '@/components/auth/LoginModal';
import type { MapStyleId, MapBounds } from '@/components/map/MapView';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: 'var(--cream)' }}
    >
      <div className="animate-spin w-10 h-10 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
    </div>
  ),
});

const DEFAULT_LNG = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? '8.539');
const DEFAULT_LAT = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? '47.378');
const DEFAULT_ZOOM = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_ZOOM ?? '13');

type Sheet = 'none' | 'detail' | 'rate' | 'add' | 'login';

// ── Inner Component (braucht useSearchParams → muss in Suspense) ───────────
function KarteInner() {
  const searchParams = useSearchParams();
  const { pos } = useGeoLocation();
  const [toiletList, setToiletList] = useState<Toilet[]>([]);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [profileOpen, setProfileOpen] = useState(false);
  // Deep-Link: ?t=<toiletId> direkt beim Init auflösen
  const deepLinkId = searchParams.get('t');
  const [activeSheet, setActiveSheet] = useState<Sheet>(deepLinkId ? 'detail' : 'none');
  const [selectedId, setSelectedId] = useState<string | null>(deepLinkId);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyleId>('satellite');
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  // Marker-Drop-Modus: Koordinaten für neue Toilette per Karten-Klick
  const [pendingLocation, setPendingLocation] = useState<{ lng: number; lat: number } | null>(null);

  const mapCenter = useMemo<[number, number]>(() => pos ?? [DEFAULT_LNG, DEFAULT_LAT], [pos]);
  const initialized = useRef(false);

  // ── Erstes Laden beim Init ────────────────────────────────────────────────
  useEffect(() => {
    const [lng, lat] = mapCenter;
    if (initialized.current) return;
    initialized.current = true;
    toiletsApi
      .nearby(lng, lat, 3000)
      .then(setToiletList)
      .catch(() => {});
  }, [mapCenter]);

  // ── Nachladen bei Karten-Bewegung (MoveEnd, debounced in MapView) ─────────
  const handleMoveEnd = useCallback(
    (center: [number, number], radiusM: number, bounds: MapBounds) => {
      setMapBounds(bounds);
      toiletsApi
        .nearby(center[0], center[1], radiusM)
        .then(setToiletList)
        .catch(() => {});
    },
    [],
  );

  // ── Karten-Klick: Standort für neue Toilette setzen / direkt hinzufügen ──
  const handleMapClick = useCallback(
    (lng: number, lat: number) => {
      // Im Detail/Rate/Login-Modus Klicks ignorieren
      if (activeSheet === 'detail' || activeSheet === 'rate' || activeSheet === 'login') return;
      setPendingLocation({ lng, lat });
      if (activeSheet !== 'add') setActiveSheet('add');
    },
    [activeSheet],
  );

  // Heatmap laden beim ersten Einschalten (mit aktuellem Viewport-Bbox)
  const handleHeatmapToggle = useCallback(async () => {
    const next = !showHeatmap;
    setShowHeatmap(next);
    if (next && heatmapPoints.length === 0) {
      setHeatmapLoading(true);
      try {
        // Fallback: ganzes sichtbares Gebiet oder Schweiz-Default
        const bbox = mapBounds ?? {
          minLng: 5.9,
          minLat: 45.8,
          maxLng: 10.5,
          maxLat: 47.9,
        };
        const { points } = await heatmapApi.get(bbox);
        setHeatmapPoints(points);
      } catch {
        /* silent */
      }
      setHeatmapLoading(false);
    }
  }, [showHeatmap, heatmapPoints.length, mapBounds]);

  // Filter
  const visibleToilets = useMemo(() => {
    return toiletList.filter((t) => {
      if (filters.free && (t.feeChf ?? 0) > 0) return false;
      if (filters.accessible && !t.accessibility?.wheelchair && !t.accessibility?.step_free)
        return false;
      if (filters.categories.size > 0 && !filters.categories.has(t.category)) return false;
      return true;
    });
  }, [toiletList, filters]);

  // Sheet-Handler
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setActiveSheet('detail');
  }, []);

  const handleClose = useCallback(() => {
    setActiveSheet('none');
    setSelectedId(null);
    setPendingLocation(null);
  }, []);

  const handleRate = useCallback((id: string) => {
    setSelectedId(id);
    setActiveSheet('rate');
  }, []);

  const reload = useCallback(() => {
    const [lng, lat] = mapCenter;
    toiletsApi
      .nearby(lng, lat, 3000)
      .then(setToiletList)
      .catch(() => {});
  }, [mapCenter]);

  const handleRatingSaved = useCallback(() => {
    reload();
    setActiveSheet('detail');
  }, [reload]);

  const handleCreated = useCallback(
    (id: string) => {
      reload();
      setPendingLocation(null);
      setSelectedId(id);
      setActiveSheet('detail');
    },
    [reload],
  );

  const handleSearchSelect = useCallback((toilet: Toilet) => {
    setFlyTarget([toilet.longitude, toilet.latitude]);
    setSelectedId(toilet.id);
    setActiveSheet('detail');
  }, []);

  const handleAddClick = useCallback(() => {
    setPendingLocation(null); // zurücksetzen, damit alter Klick-Punkt weg ist
    setActiveSheet('add');
  }, []);

  const handleToiletDeleted = useCallback(() => {
    reload();
  }, [reload]);

  return (
    <main
      className="relative w-screen overflow-hidden"
      style={{ height: '100dvh' }} // 100dvh schrumpft mit Safari-Toolbar, 100vh nicht
    >
      {/* Cursor-Hinweis im Marker-Drop-Modus */}
      {activeSheet === 'add' && !pendingLocation && (
        <div
          style={{
            position: 'absolute',
            top: 'max(72px, calc(env(safe-area-inset-top, 0px) + 72px))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            background: 'var(--brand-secondary)',
            color: 'var(--brand-deep)',
            padding: '8px 16px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          📍 Klick auf die Karte um den Standort zu setzen
        </div>
      )}

      <MapView
        toilets={visibleToilets}
        center={pos ?? undefined}
        flyTarget={flyTarget}
        zoom={DEFAULT_ZOOM}
        onSelect={handleSelect}
        onMoveEnd={handleMoveEnd}
        onMapClick={handleMapClick}
        showHeatmap={showHeatmap}
        heatmapPoints={heatmapPoints}
        mapStyle={mapStyle}
      />

      <AppBar
        onLoginClick={() => setActiveSheet('login')}
        onAddClick={handleAddClick}
        onProfileClick={() => setProfileOpen(true)}
        onSearchSelect={handleSearchSelect}
        userLocation={pos ?? undefined}
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        totalCount={toiletList.length}
        visibleCount={visibleToilets.length}
      />

      {/* Kartenstil-Wechsler */}
      {(() => {
        const STYLES: { id: MapStyleId; label: string; icon: string }[] = [
          { id: 'satellite', label: 'Satellit', icon: '🛰️' },
          { id: 'streets', label: 'Strassen', icon: '🗺️' },
          { id: 'outdoor', label: 'Outdoor', icon: '🌿' },
        ];
        return (
          <div
            style={{
              position: 'absolute',
              bottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 12px))',
              left: 16,
              zIndex: 20,
              display: 'flex',
              borderRadius: 12,
              overflow: 'hidden',
              border: '1.5px solid var(--line)',
              boxShadow: '0 2px 12px rgba(15,23,42,0.12)',
            }}
          >
            {STYLES.map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                title={label}
                aria-pressed={mapStyle === id}
                onClick={() => setMapStyle(id)}
                style={{
                  padding: '7px 11px',
                  background: mapStyle === id ? 'var(--brand-primary)' : 'var(--paper)',
                  color: mapStyle === id ? '#fff' : 'var(--muted)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.15s',
                  borderRight: id !== 'outdoor' ? '1px solid var(--line)' : 'none',
                }}
              >
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        );
      })()}

      {/* Heatmap toggle — rechts neben Stil-Wechsler */}
      <button
        type="button"
        onClick={handleHeatmapToggle}
        title={showHeatmap ? 'Heatmap ausblenden' : 'Heatmap einblenden'}
        style={{
          position: 'absolute',
          bottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 12px))',
          left: 200,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '9px 14px',
          borderRadius: 12,
          border: showHeatmap ? '1.5px solid var(--brand-primary)' : '1.5px solid var(--line)',
          background: showHeatmap ? 'var(--brand-primary)' : 'var(--paper)',
          color: showHeatmap ? '#fff' : 'var(--ink)',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(15,23,42,0.12)',
          transition: 'all 0.18s',
          opacity: heatmapLoading ? 0.7 : 1,
        }}
      >
        {heatmapLoading ? (
          <span
            style={{
              display: 'inline-block',
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              animation: 'spin 0.7s linear infinite',
            }}
          />
        ) : (
          '🔥'
        )}
        Heatmap
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </button>

      {/* Sheets */}
      {activeSheet === 'detail' && (
        <ToiletSheet
          toiletId={selectedId}
          onClose={handleClose}
          onRate={handleRate}
          onDeleted={handleToiletDeleted}
        />
      )}
      {activeSheet === 'rate' && selectedId && (
        <RatingSheet
          toiletId={selectedId}
          onClose={() => setActiveSheet('detail')}
          onSaved={handleRatingSaved}
        />
      )}
      {activeSheet === 'add' && (
        <AddToiletSheet
          defaultLng={pendingLocation?.lng ?? mapCenter[0]}
          defaultLat={pendingLocation?.lat ?? mapCenter[1]}
          pickedFromMap={pendingLocation !== null}
          onClose={handleClose}
          onCreated={handleCreated}
        />
      )}
      {activeSheet === 'login' && <LoginModal onClose={handleClose} />}

      <ProfileSidebar
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onToiletSelect={(id) => {
          handleSelect(id);
        }}
        onLoginClick={() => {
          setProfileOpen(false);
          setActiveSheet('login');
        }}
      />
    </main>
  );
}

// Suspense-Wrapper wegen useSearchParams
export default function KartePage() {
  return (
    <Suspense
      fallback={
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'var(--cream)', height: '100dvh' }}
        >
          <div className="animate-spin w-10 h-10 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
        </div>
      }
    >
      <KarteInner />
    </Suspense>
  );
}
