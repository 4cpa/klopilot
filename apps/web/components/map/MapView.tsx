'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { Toilet, HeatmapPoint } from '@/lib/api';

/** Zoom-Level → sinnvoller Suchradius in Metern */
function zoomToRadius(zoom: number): number {
  // zoom 10 → ~25 km, zoom 13 → ~3 km, zoom 16 → ~400 m
  return Math.round(Math.min(50_000, Math.max(400, 25_000 / Math.pow(2, zoom - 10))));
}

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

export type MapStyleId = 'satellite' | 'streets' | 'outdoor';

function buildStyleUrl(style: MapStyleId = 'satellite'): string | maplibregl.StyleSpecification {
  if (MAPTILER_KEY) {
    const MAP: Record<MapStyleId, string> = {
      satellite: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
      streets: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
      outdoor: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`,
    };
    return MAP[style];
  }
  // Fallback: OSM-Raster (kein MapTiler-Key)
  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors',
      },
    },
    layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
  };
}

function scoreColor(score?: Toilet['score']) {
  if (!score || score.count === 0) return '#9AA4B2';
  if (score.net > 1) return '#06D6A0';
  if (score.net > 0) return '#FFD23F';
  if (score.net > -1) return '#FF8B5C';
  return '#EF476F';
}

const HEATMAP_SOURCE = 'klo-heatmap';
const HEATMAP_LAYER = 'klo-heatmap-layer';

export interface MapBounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

interface Props {
  toilets: Toilet[];
  center?: [number, number];
  flyTarget?: [number, number] | null;
  zoom?: number;
  onSelect: (id: string) => void;
  /** Wird nach jeder Karten-Bewegung (debounced) aufgerufen. */
  onMoveEnd?: (center: [number, number], radiusM: number, bounds: MapBounds) => void;
  /** Wird bei Klick auf die leere Karte aufgerufen (Marker-Drop-Modus). */
  onMapClick?: (lng: number, lat: number) => void;
  showHeatmap?: boolean;
  heatmapPoints?: HeatmapPoint[];
  mapStyle?: MapStyleId;
  /** Kompass-Modus: true = Rotation frei + Bearing-Tracking aktiv */
  compassEnabled?: boolean;
  /** Aktuelles Bearing in Grad (0–360 im Uhrzeigersinn ab Nord) */
  onBearingChange?: (bearing: number) => void;
}

export default function MapView({
  toilets,
  center,
  flyTarget,
  zoom = 14,
  onSelect,
  onMoveEnd,
  onMapClick,
  showHeatmap = false,
  heatmapPoints = [],
  mapStyle = 'satellite',
  compassEnabled = false,
  onBearingChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMoveEndRef = useRef(onMoveEnd);
  const onMapClickRef = useRef(onMapClick);
  const onBearingChangeRef = useRef(onBearingChange);
  // Ref für Heatmap-Zustand — wird nach Style-Wechsel neu angewendet
  const heatmapStateRef = useRef({ show: showHeatmap, points: heatmapPoints });

  // Refs synchron vor dem nächsten Paint aktualisieren (kein Render-Body-Zugriff)
  useLayoutEffect(() => {
    onMoveEndRef.current = onMoveEnd;
    onMapClickRef.current = onMapClick;
    onBearingChangeRef.current = onBearingChange;
  });

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const defaultLng = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? '8.5390');
    const defaultLat = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? '47.3782');

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: buildStyleUrl(mapStyle),
      center: center ?? [defaultLng, defaultLat],
      zoom,
      attributionControl: { compact: true },
    });

    // Kompass deaktiviert beim Start: Rotation sperren
    mapRef.current.dragRotate.disable();
    mapRef.current.touchZoomRotate.disableRotation();

    // Eigene Zoom-Buttons ohne eingebauten Kompass (den ersetzen wir selbst)
    mapRef.current.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'bottom-right',
    );
    mapRef.current.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'bottom-right',
    );

    // ── Map Move: Toiletten nachladen (debounced 500 ms) ──────────────────
    const handleMoveEnd = () => {
      const map = mapRef.current;
      if (!map || !onMoveEndRef.current) return;
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      moveTimerRef.current = setTimeout(() => {
        const { lng, lat } = map.getCenter();
        const radius = zoomToRadius(map.getZoom());
        const b = map.getBounds();
        const bounds: MapBounds = {
          minLng: b.getWest(),
          minLat: b.getSouth(),
          maxLng: b.getEast(),
          maxLat: b.getNorth(),
        };
        onMoveEndRef.current?.([lng, lat], radius, bounds);
      }, 500);
    };
    mapRef.current.on('moveend', handleMoveEnd);

    // ── Bearing-Tracking: für Custom-Kompass ──────────────────────────────
    const handleRotate = () => {
      onBearingChangeRef.current?.(mapRef.current?.getBearing() ?? 0);
    };
    mapRef.current.on('rotate', handleRotate);
    mapRef.current.on('rotateend', handleRotate);

    // ── Map Click: Marker-Drop für AddToilet ──────────────────────────────
    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      if (!onMapClickRef.current) return;
      // Klick auf einen Marker ignorieren
      const target = e.originalEvent.target as HTMLElement;
      if (target.closest('.klo-marker')) return;
      onMapClickRef.current(e.lngLat.lng, e.lngLat.lat);
    };
    mapRef.current.on('click', handleMapClick);

    return () => {
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Kompass ein-/ausschalten + DeviceOrientation ─────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!compassEnabled) {
      map.easeTo({ bearing: 0, duration: 400 });
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
      onBearingChangeRef.current?.(0);
      return;
    }

    // Manuelle Rotation per Drag/Pinch freischalten
    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();

    // DeviceOrientation: Karte nach Gerätekompass drehen
    let lastNotify = 0;

    // Beide Events hören: deviceorientationabsolute (Android/Chrome, geographisch)
    // und deviceorientation (iOS mit webkitCompassHeading)
    // Falls beide feuern, priorisieren wir webkitCompassHeading, sonst absolute alpha.
    let gotAbsolute = false;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ev = e as any;

      // Absolute-Flag setzen sobald ein absolutes Event ankommt
      if (ev.absolute === true) gotAbsolute = true;
      // Nicht-absolutes Event ignorieren wenn wir bereits absolute haben
      if (ev.absolute !== true && gotAbsolute) return;

      let heading: number | null = null;

      // iOS: webkitCompassHeading (0=N, 90=O, 180=S, 270=W)
      if (typeof ev.webkitCompassHeading === 'number' && !isNaN(ev.webkitCompassHeading)) {
        heading = ev.webkitCompassHeading;
      } else if (e.alpha !== null && e.alpha !== undefined) {
        // Android/Chrome: alpha ist Drehung um Z-Achse im Uhrzeigersinn ab Nord
        // Kompassrichtung = (360 − alpha) % 360
        heading = (360 - e.alpha) % 360;
      }

      if (heading === null) return;

      // Karte direkt ohne Easing drehen (smooth genug durch rAF von MapLibre)
      map.setBearing(heading);

      // React-State max. ~10× pro Sekunde → Kompassnadel in UI bleibt flüssig
      const now = Date.now();
      if (now - lastNotify > 100) {
        lastNotify = now;
        onBearingChangeRef.current?.(heading);
      }
    };

    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, opts);
    window.addEventListener('deviceorientation', handleOrientation as EventListener, opts);

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener);
      window.removeEventListener('deviceorientation', handleOrientation as EventListener);
    };
  }, [compassEnabled]);

  // Update markers when toilets change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const addMarkers = () => {
      toilets.forEach((t) => {
        const el = document.createElement('div');
        el.className = 'klo-marker';
        el.setAttribute('aria-label', t.name);
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');

        const color = scoreColor(t.score);
        const count = t.score?.count ?? 0;
        const hasScore = count > 0;

        if (hasScore) {
          // Bewerteter Marker: Raute mit Score-Zahl
          el.innerHTML = `
            <div style="
              background: ${color};
              color: white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              width: 36px; height: 36px;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 3px 10px rgba(0,0,0,.3);
              cursor: pointer;
              border: 2px solid white;
              font-size: 11px; font-weight: 700;
              font-family: Inter, sans-serif;
            ">
              <span style="transform: rotate(45deg)">${t.score!.net.toFixed(1)}</span>
            </div>`;
        } else {
          // Unbewerteter Marker: kompakter runder Pin mit WC-Symbol
          el.innerHTML = `
            <div style="
              background: #5B6B82;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              width: 30px; height: 30px;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,.25);
              cursor: pointer;
              border: 2px solid rgba(255,255,255,0.9);
            ">
              <span style="transform: rotate(45deg); font-size: 14px; line-height: 1;">🚽</span>
            </div>`;
        }

        el.addEventListener('click', () => onSelect(t.id));
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') onSelect(t.id);
        });

        markersRef.current.push(
          new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([t.longitude, t.latitude])
            .addTo(map),
        );
      });
    };

    if (map.isStyleLoaded()) addMarkers();
    else map.once('load', addMarkers);
  }, [toilets, onSelect]);

  // Kartenstil wechseln (nach Init)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const newStyle = buildStyleUrl(mapStyle);
    // Nach Style-Wechsel Heatmap-Layer neu anwenden
    const onStyleData = () => {
      const { show, points } = heatmapStateRef.current;
      if (!show || points.length === 0) return;
      if (map.getLayer(HEATMAP_LAYER)) map.removeLayer(HEATMAP_LAYER);
      if (map.getSource(HEATMAP_SOURCE)) map.removeSource(HEATMAP_SOURCE);
      map.addSource(HEATMAP_SOURCE, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: points.map((p) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
            properties: { weight: p.weight ?? 1 },
          })),
        },
      });
      map.addLayer({
        id: HEATMAP_LAYER,
        type: 'heatmap',
        source: HEATMAP_SOURCE,
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 5, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 7, 1, 15, 3],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 7, 20, 15, 40],
          'heatmap-opacity': 0.72,
        },
      });
    };
    map.once('styledata', onStyleData);
    map.setStyle(newStyle);
    return () => {
      map.off('styledata', onStyleData);
    };
  }, [mapStyle]);

  // Heatmap-Ref für Style-Wechsel synchron halten
  useEffect(() => {
    heatmapStateRef.current = { show: showHeatmap, points: heatmapPoints };
  });

  // Heatmap layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      // Remove existing heatmap layer/source
      if (map.getLayer(HEATMAP_LAYER)) map.removeLayer(HEATMAP_LAYER);
      if (map.getSource(HEATMAP_SOURCE)) map.removeSource(HEATMAP_SOURCE);

      if (!showHeatmap || heatmapPoints.length === 0) return;

      map.addSource(HEATMAP_SOURCE, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: heatmapPoints.map((p) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
            properties: { weight: p.weight ?? 1 },
          })),
        },
      });

      map.addLayer({
        id: HEATMAP_LAYER,
        type: 'heatmap',
        source: HEATMAP_SOURCE,
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 5, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 7, 1, 15, 3],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 7, 20, 15, 40],
          'heatmap-opacity': 0.72,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0,0,0,0)',
            0.2,
            'rgba(6,214,160,0.6)',
            0.4,
            'rgba(255,210,63,0.7)',
            0.6,
            'rgba(255,107,53,0.8)',
            0.8,
            'rgba(239,71,111,0.9)',
            1.0,
            'rgba(239,71,111,1)',
          ],
        },
      });
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [showHeatmap, heatmapPoints]);

  // Fly to center when it changes
  useEffect(() => {
    if (center && mapRef.current) {
      mapRef.current.flyTo({ center, zoom, duration: 800 });
    }
  }, [center, zoom]);

  // Fly to search result
  useEffect(() => {
    if (flyTarget && mapRef.current) {
      mapRef.current.flyTo({ center: flyTarget, zoom: 17, duration: 900 });
    }
  }, [flyTarget]);

  return <div ref={containerRef} className="absolute inset-0" aria-label="Toilettenkarte" />;
}
