'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import maplibregl from 'maplibre-gl';
import type { Toilet, HeatmapPoint, ToiletCluster } from '@/lib/api';

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

// ── Clustering (Eurokey-Stil) ───────────────────────────────────────────────
// Eine geclusterte GeoJSON-Quelle hält alle sichtbaren Toiletten. Aus ihr
// werden per `querySourceFeatures` HTML-Marker abgeleitet: aggregierte
// Cluster-Bubbles (transparente Anzahl) beim Rauszoomen, exakt positionierte
// Einzelmarker beim Reinzoomen. Einzelmarker sind an ihre `[lng,lat]` gepinnt
// und werden über die Toilet-ID wiederverwendet → keine Positionsdrift beim
// Zoomen, kein Neu-Rendern.
const TOILET_SOURCE = 'klo-toilets';
// Unsichtbarer Layer auf der Quelle: MapLibre lädt/parst Quell-Tiles nur, wenn
// mindestens ein Layer sie referenziert. Ohne ihn liefert querySourceFeatures()
// dauerhaft 0 → keine Marker. Die Darstellung machen die HTML-Marker; dieser
// Layer ist rein der Tile-Trigger (radius/opacity 0, unsichtbar).
const TOILET_PROBE_LAYER = 'klo-toilets-probe';
/** Ab diesem Zoom werden Cluster aufgelöst → alle WCs einzeln, exakt 1:1. */
const CLUSTER_MAX_ZOOM = 16;
/** Cluster-Radius in Pixeln (Supercluster). */
const CLUSTER_RADIUS = 60;
/**
 * Ab diesem Zoom ist das Platzieren einer neuen Toilette per Karten-Klick aktiv.
 * Darunter (Region/Kontinent) ergibt ein Marker-Drop keinen Sinn — ein Klick
 * würde sonst verwirrend z. B. das Login-Fenster öffnen.
 */
const ADD_TOILET_MIN_ZOOM = 13;

function toiletsToGeoJSON(toilets: Toilet[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: toilets.map((t) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [t.longitude, t.latitude] },
      properties: { id: t.id },
    })),
  };
}

/** Eurokey-artige, halbtransparente Cluster-Bubble mit Anzahl. */
function buildClusterElement(count: number, label: string): HTMLDivElement {
  // Grösse skaliert sanft mit der Anzahl (etwas kompakter, damit beim Rauszoomen
  // die Karte zwischen den Bubbles lesbar bleibt)
  const size = count < 10 ? 34 : count < 50 ? 42 : count < 200 ? 50 : 58;
  const el = document.createElement('div');
  el.className = 'klo-cluster';
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', `${count} Toiletten — zum Vergrössern klicken`);
  el.style.cssText = `
    width:${size}px;height:${size}px;cursor:pointer;
    display:flex;align-items:center;justify-content:center;`;
  // Deutlich transparenter, damit sich überlappende Cluster den Kontinent nicht
  // zudecken — Karte bleibt lesbar. Zahl bleibt durch weissen Ring + Textschatten
  // gut erkennbar.
  el.innerHTML = `
    <div style="
      position:absolute;width:${size}px;height:${size}px;border-radius:50%;
      background:rgba(45,168,79,0.05);
    "></div>
    <div style="
      position:relative;width:${size - 10}px;height:${size - 10}px;border-radius:50%;
      background:rgba(45,168,79,0.25);
      border:1.5px solid rgba(255,255,255,0.55);
      box-shadow:0 1px 4px rgba(0,0,0,.18);
      display:flex;align-items:center;justify-content:center;
      color:white;font-family:Inter,sans-serif;font-weight:800;
      font-size:${count < 200 ? 12 : 14}px;line-height:1;
      text-shadow:0 1px 3px rgba(0,0,0,.8);
    ">${label}</div>`;
  return el;
}

/** Rich-Einzelmarker (Score-Raute bzw. WC-Pin + Badges). */
function buildMarkerElement(t: Toilet): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'klo-marker';
  el.setAttribute('aria-label', t.name);
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.style.position = 'relative';
  el.style.display = 'inline-block';

  const color = scoreColor(t.score);
  const count = t.score?.count ?? 0;
  const hasScore = count > 0;

  const isNetteToilette = t.category === 'nette_toilette';
  const isAccessible = t.accessibility?.wheelchair === true || t.accessibility?.step_free === true;
  const isEuroKey = t.accessibility?.euro_key === true;

  const border = isNetteToilette ? '2.5px solid #2DA84F' : '2px solid rgba(255,255,255,0.9)';

  const wheelchairBadge = isAccessible
    ? `<div title="${t.accessibility?.wheelchair ? 'Rollstuhlgerecht' : 'Stufenlos zugänglich'}" style="
         position:absolute;top:-5px;right:-7px;
         background:#1D6FA4;border-radius:50%;
         width:17px;height:17px;
         display:flex;align-items:center;justify-content:center;
         border:1.5px solid white;
         box-shadow:0 1px 4px rgba(0,0,0,.5);
         font-size:9px;line-height:1;z-index:2;
       ">♿</div>`
    : '';
  const euroKeyBadge = isEuroKey
    ? `<div title="Eurokey" style="
         position:absolute;top:-5px;left:-7px;
         background:#C97D0E;border-radius:50%;
         width:17px;height:17px;
         display:flex;align-items:center;justify-content:center;
         border:1.5px solid white;
         box-shadow:0 1px 4px rgba(0,0,0,.5);
         font-size:9px;line-height:1;z-index:2;
       ">🔑</div>`
    : '';

  if (hasScore) {
    el.innerHTML = `
      <div style="
        background:${color};color:white;
        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        width:36px;height:36px;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 3px 10px rgba(0,0,0,.3);cursor:pointer;
        border:${border};
        font-size:11px;font-weight:700;font-family:Inter,sans-serif;
      ">
        <span style="transform:rotate(45deg)">${t.score!.net.toFixed(1)}</span>
      </div>
      ${wheelchairBadge}${euroKeyBadge}`;
  } else {
    const bg = isNetteToilette ? '#2DA84F' : '#5B6B82';
    el.innerHTML = `
      <div style="
        background:${bg};
        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        width:30px;height:30px;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:pointer;
        border:${border};
      ">
        <span style="transform:rotate(45deg);font-size:14px;line-height:1;">🚽</span>
      </div>
      ${wheelchairBadge}${euroKeyBadge}`;
  }
  return el;
}

/** Toilet-Quelle (geclustert) anlegen oder aktualisieren. */
function ensureToiletSource(map: maplibregl.Map, data: GeoJSON.FeatureCollection) {
  const existing = map.getSource(TOILET_SOURCE) as maplibregl.GeoJSONSource | undefined;
  if (existing) {
    existing.setData(data);
    return;
  }
  map.addSource(TOILET_SOURCE, {
    type: 'geojson',
    data,
    cluster: true,
    clusterRadius: CLUSTER_RADIUS,
    clusterMaxZoom: CLUSTER_MAX_ZOOM,
  });
  // Unsichtbarer Tile-Trigger (s. Kommentar bei TOILET_PROBE_LAYER)
  if (!map.getLayer(TOILET_PROBE_LAYER)) {
    map.addLayer({
      id: TOILET_PROBE_LAYER,
      type: 'circle',
      source: TOILET_SOURCE,
      paint: { 'circle-radius': 0, 'circle-opacity': 0 },
    });
  }
}

/**
 * Leitet aus der geclusterten Quelle HTML-Marker ab: Cluster-Bubbles +
 * exakt positionierte Einzelmarker. Marker werden über ihren Key (Cluster-ID
 * bzw. Toilet-ID) gepoolt und wiederverwendet — dadurch bleiben Einzel-WCs beim
 * Zoomen positionsstabil und flackern nicht.
 */
function syncMarkers(
  map: maplibregl.Map,
  pool: Record<string, maplibregl.Marker>,
  onScreenRef: { current: Record<string, maplibregl.Marker> },
  lookup: Map<string, Toilet>,
  onSelectRef: { current: (id: string) => void },
) {
  const source = map.getSource(TOILET_SOURCE);
  if (!source || !map.isSourceLoaded(TOILET_SOURCE)) return;

  const onScreen = onScreenRef.current;
  const next: Record<string, maplibregl.Marker> = {};
  const features = map.querySourceFeatures(TOILET_SOURCE);

  for (const f of features) {
    if (f.geometry.type !== 'Point') continue;
    const coords = f.geometry.coordinates as [number, number];
    const props = f.properties ?? {};

    if (props.cluster) {
      const key = `c${props.cluster_id}`;
      if (next[key]) continue; // Tile-Überlappung → Duplikat überspringen
      let marker = pool[key];
      if (!marker) {
        const el = buildClusterElement(
          props.point_count as number,
          String(props.point_count_abbreviated ?? props.point_count),
        );
        const clusterId = props.cluster_id as number;
        const expand = () => {
          (source as maplibregl.GeoJSONSource)
            .getClusterExpansionZoom(clusterId)
            .then((zoom) => map.easeTo({ center: coords, zoom: Math.min(zoom, 20), duration: 500 }))
            .catch(() => {});
        };
        el.addEventListener('click', expand);
        el.addEventListener('keydown', (e) => {
          if ((e as KeyboardEvent).key === 'Enter') expand();
        });
        marker = pool[key] = new maplibregl.Marker({ element: el }).setLngLat(coords);
      }
      next[key] = marker;
      if (!onScreen[key]) marker.addTo(map);
    } else {
      const id = props.id as string;
      if (!id || next[id]) continue;
      let marker = pool[id];
      if (!marker) {
        const toilet = lookup.get(id);
        if (!toilet) continue;
        const el = buildMarkerElement(toilet);
        el.addEventListener('click', () => onSelectRef.current(id));
        el.addEventListener('keydown', (e) => {
          if ((e as KeyboardEvent).key === 'Enter') onSelectRef.current(id);
        });
        marker = pool[id] = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(
          coords,
        );
      }
      next[id] = marker;
      if (!onScreen[id]) marker.addTo(map);
    }
  }

  // Nicht mehr sichtbare Marker von der Karte nehmen (im Pool belassen für Reuse)
  for (const key in onScreen) {
    if (!next[key]) onScreen[key].remove();
  }
  onScreenRef.current = next;
}

/** Heatmap-Source + -Layer (inkl. Farbverlauf) setzen; leere Punkte = entfernen. */
function applyHeatmap(map: maplibregl.Map, points: HeatmapPoint[]) {
  if (map.getLayer(HEATMAP_LAYER)) map.removeLayer(HEATMAP_LAYER);
  if (map.getSource(HEATMAP_SOURCE)) map.removeSource(HEATMAP_SOURCE);
  if (points.length === 0) return;

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
}

/** Serverseitige Cluster-Bubbles als eigene Marker (re)rendern. */
function renderServerClusters(
  map: maplibregl.Map,
  clusters: ToiletCluster[],
  store: { current: maplibregl.Marker[] },
) {
  store.current.forEach((m) => m.remove());
  store.current = [];
  for (const c of clusters) {
    const label =
      c.count >= 1000 ? `${(c.count / 1000).toFixed(c.count < 10_000 ? 1 : 0)}k` : String(c.count);
    const el = buildClusterElement(c.count, label);
    const zoomIn = () =>
      map.easeTo({ center: [c.lng, c.lat], zoom: Math.min(map.getZoom() + 3, 20), duration: 500 });
    el.addEventListener('click', zoomIn);
    el.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') zoomIn();
    });
    store.current.push(new maplibregl.Marker({ element: el }).setLngLat([c.lng, c.lat]).addTo(map));
  }
}

export interface MapBounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

interface Props {
  toilets: Toilet[];
  /** Serverseitig aggregierte Cluster (weit rausgezoomt, sehr dicht). */
  serverClusters?: ToiletCluster[];
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
  serverClusters = [],
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
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  // Marker-Pool (id → Marker) für Wiederverwendung + aktuell sichtbare Marker.
  // Cluster-Keys: `c<cluster_id>`, Einzelmarker-Keys: Toilet-ID.
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});
  const markersOnScreenRef = useRef<Record<string, maplibregl.Marker>>({});
  // id → Toilet, damit der Render-Sync die Rich-Marker bauen kann
  const toiletLookupRef = useRef<Map<string, Toilet>>(new Map());
  // Aktuelle Toiletten (für den 'load'-Handler im Init-Effekt)
  const toiletsRef = useRef<Toilet[]>(toilets);
  // id → optische Signatur, um geänderte Marker neu zu bauen
  const builtSigRef = useRef<Map<string, string>>(new Map());
  // Serverseitige Cluster-Bubbles (eigene Marker, unabhängig vom Detail-Pool)
  const serverMarkersRef = useRef<maplibregl.Marker[]>([]);
  // Aktuelle Server-Cluster (damit onStyleData sie nach Style-Wechsel neu rendert)
  const serverClustersRef = useRef<ToiletCluster[]>(serverClusters);
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMoveEndRef = useRef(onMoveEnd);
  const onMapClickRef = useRef(onMapClick);
  const onBearingChangeRef = useRef(onBearingChange);
  const onSelectRef = useRef(onSelect);
  // Ref für Heatmap-Zustand — wird nach Style-Wechsel neu angewendet
  const heatmapStateRef = useRef({ show: showHeatmap, points: heatmapPoints });

  // Refs synchron vor dem nächsten Paint aktualisieren (kein Render-Body-Zugriff)
  useLayoutEffect(() => {
    onMoveEndRef.current = onMoveEnd;
    onMapClickRef.current = onMapClick;
    onBearingChangeRef.current = onBearingChange;
    onSelectRef.current = onSelect;
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

    // ── Cluster-Quelle + Marker-Sync ──────────────────────────────────────
    const initSource = () => {
      const map = mapRef.current;
      if (!map) return;
      ensureToiletSource(map, toiletsToGeoJSON(toiletsRef.current));
    };
    mapRef.current.on('load', initSource);
    // Erstes Laden: Viewport-Bounds melden, sobald die Karte bereit ist
    mapRef.current.on('load', handleMoveEnd);

    // Marker aus der Quelle ableiten, sobald die Karte zur Ruhe kommt ('idle':
    // Bewegung beendet UND alle Tiles geladen). Bewusst NICHT bei jedem 'render'-
    // Frame: Während Tiles nachladen liefert querySourceFeatures unvollständige
    // Ergebnisse → Marker würden kurz entfernt und wieder hinzugefügt (Flackern).
    // Einzelmarker sind an [lng,lat] gepinnt und werden von MapLibre ohnehin jeden
    // Frame korrekt re-projiziert; ein Sync pro Ruhephase genügt.
    const handleIdle = () => {
      const map = mapRef.current;
      if (!map) return;
      syncMarkers(
        map,
        markersRef.current,
        markersOnScreenRef,
        toiletLookupRef.current,
        onSelectRef,
      );
    };
    mapRef.current.on('idle', handleIdle);

    // ── Bearing-Tracking: für Custom-Kompass ──────────────────────────────
    const handleRotate = () => {
      onBearingChangeRef.current?.(mapRef.current?.getBearing() ?? 0);
    };
    mapRef.current.on('rotate', handleRotate);
    mapRef.current.on('rotateend', handleRotate);

    // ── Map Click: Marker-Drop für AddToilet ──────────────────────────────
    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      if (!onMapClickRef.current) return;
      // Nur ab sinnvollem Zoom: weit rausgezoomt (Region/Kontinent) macht das
      // Platzieren einer Toilette keinen Sinn — Klick ignorieren.
      if ((mapRef.current?.getZoom() ?? 0) < ADD_TOILET_MIN_ZOOM) return;
      // Klick auf einen Marker oder eine Cluster-Bubble ignorieren
      const target = e.originalEvent.target as HTMLElement;
      if (target.closest('.klo-marker, .klo-cluster')) return;
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

  // Toiletten-Daten → geclusterte Quelle aktualisieren.
  // Die Marker selbst werden im 'render'-Handler (syncMarkers) abgeleitet.
  useEffect(() => {
    toiletsRef.current = toilets;

    // Lookup + Signaturen neu aufbauen (id → Toilet)
    const lookup = new Map<string, Toilet>();
    const validIds = new Set<string>();
    for (const t of toilets) {
      lookup.set(t.id, t);
      validIds.add(t.id);
    }
    toiletLookupRef.current = lookup;

    // Pool aufräumen: Cluster immer verwerfen (cluster_ids ändern sich bei jeder
    // Daten-/Zoom-Neuberechnung), Einzelmarker nur wenn entfernt ODER wenn sich
    // die optische Signatur geändert hat (Score/Badges) → Neuaufbau.
    const sigOf = (t: Toilet) =>
      `${t.name}|${t.category}|${t.score?.net ?? ''}|${t.score?.count ?? 0}` +
      `|${t.accessibility?.wheelchair ?? ''}|${t.accessibility?.step_free ?? ''}` +
      `|${t.accessibility?.euro_key ?? ''}`;
    for (const key of Object.keys(markersRef.current)) {
      const stale =
        key.startsWith('c') ||
        !validIds.has(key) ||
        builtSigRef.current.get(key) !== sigOf(lookup.get(key)!);
      if (stale) {
        markersRef.current[key].remove();
        delete markersRef.current[key];
        delete markersOnScreenRef.current[key];
      }
    }
    builtSigRef.current = new Map(toilets.map((t) => [t.id, sigOf(t)]));

    const map = mapRef.current;
    if (!map) return;
    const apply = () => ensureToiletSource(map, toiletsToGeoJSON(toilets));
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [toilets]);

  // Serverseitige Cluster-Bubbles (nur wenn der Viewport zu dicht für Details
  // ist). Eigene Marker — maplibre hält sie beim Zoomen/Schwenken positionsstabil.
  useEffect(() => {
    serverClustersRef.current = serverClusters;
    const map = mapRef.current;
    if (!map) return;
    // HTML-Marker sind DOM-Overlays und brauchen KEINE geladene Style — direkt
    // rendern (kein isStyleLoaded/styledata-Gate, das bei reinem Kamera-Move
    // nicht erneut feuert und das Rendern verschluckt).
    renderServerClusters(map, serverClusters, serverMarkersRef);
  }, [serverClusters]);

  // Kartenstil wechseln (nach Init)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const newStyle = buildStyleUrl(mapStyle);
    // Nach Style-Wechsel Heatmap-Layer + Toilet-Quelle neu anwenden
    const onStyleData = () => {
      // setStyle verwirft Sources/Layer → Toilet-Quelle, Marker-Pool, Heatmap und
      // Server-Cluster neu aufbauen.
      ensureToiletSource(map, toiletsToGeoJSON(toiletsRef.current));
      // Marker-Pool leeren → im nächsten 'idle' frisch ableiten (keine Geister)
      for (const key of Object.keys(markersRef.current)) markersRef.current[key].remove();
      markersRef.current = {};
      markersOnScreenRef.current = {};

      const { show, points } = heatmapStateRef.current;
      applyHeatmap(map, show ? points : []);
      renderServerClusters(map, serverClustersRef.current, serverMarkersRef);
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

    const apply = () => applyHeatmap(map, showHeatmap ? heatmapPoints : []);
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

  return <div ref={containerRef} className="absolute inset-0" aria-label={t('a11y.map')} />;
}
