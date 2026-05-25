import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Platform, TouchableOpacity, Text, View } from 'react-native';
import MapView, {
  Marker,
  Polygon,
  Region,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
} from 'react-native-maps';
import type { Toilet } from '@/lib/api';
import { heatmapApi, type HeatCell } from '@/lib/api';
import { ToiletMarker } from './ToiletMarker';

const DEFAULT_REGION: Region = {
  latitude: 46.9481,
  longitude: 7.4474,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Clustering is disabled below this delta (zoomed in enough)
const CLUSTER_THRESHOLD = 0.015;

interface Cluster {
  key: string;
  latitude: number;
  longitude: number;
  count: number;
  ids: string[];
}

interface Props {
  toilets: Toilet[];
  userLocation: { latitude: number; longitude: number } | null;
  cameraTarget?: { latitude: number; longitude: number } | null;
  onSelectToilet: (id: string) => void;
}

function cellColor(count: number): string {
  if (count === 0) return 'rgba(239,68,68,0.35)';
  if (count === 1) return 'rgba(251,146,60,0.20)';
  return 'rgba(0,0,0,0)';
}

function clusterBadgeColor(count: number): string {
  if (count >= 20) return '#EF476F';
  if (count >= 10) return '#FF6B35';
  return '#118AB2';
}

function buildClusters(
  toilets: Toilet[],
  latDelta: number,
): { clusters: Cluster[]; singles: Toilet[] } {
  if (latDelta < CLUSTER_THRESHOLD) return { clusters: [], singles: toilets };

  const cellSize = latDelta * 0.25;
  const grid = new Map<string, Toilet[]>();

  for (const t of toilets) {
    const row = Math.floor(t.latitude / cellSize);
    const col = Math.floor(t.longitude / cellSize);
    const key = `${row}:${col}`;
    const bucket = grid.get(key) ?? [];
    bucket.push(t);
    grid.set(key, bucket);
  }

  const clusters: Cluster[] = [];
  const singles: Toilet[] = [];

  for (const [key, items] of grid) {
    if (items.length === 1) {
      singles.push(items[0]);
    } else {
      const lat = items.reduce((s, t) => s + t.latitude, 0) / items.length;
      const lng = items.reduce((s, t) => s + t.longitude, 0) / items.length;
      clusters.push({
        key,
        latitude: lat,
        longitude: lng,
        count: items.length,
        ids: items.map((t) => t.id),
      });
    }
  }

  return { clusters, singles };
}

export function MapScreen({ toilets, userLocation, cameraTarget, onSelectToilet }: Props) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [heatmap, setHeatmap] = useState(false);
  const [cells, setCells] = useState<HeatCell[]>([]);
  const [loadingHeat, setLoading] = useState(false);

  const recenterOnUser = useCallback(() => {
    if (!userLocation) return;
    mapRef.current?.animateToRegion(
      { ...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      500,
    );
  }, [userLocation]);

  const initialRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : DEFAULT_REGION;

  useEffect(() => {
    if (!cameraTarget) return;
    mapRef.current?.animateToRegion(
      { ...cameraTarget, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      600,
    );
  }, [cameraTarget]);

  const fetchHeatmap = useCallback(async (r: Region) => {
    const half_lng = r.longitudeDelta / 2;
    const half_lat = r.latitudeDelta / 2;
    setLoading(true);
    try {
      const { cells: data } = await heatmapApi.fetch(
        r.longitude - half_lng,
        r.latitude - half_lat,
        r.longitude + half_lng,
        r.latitude + half_lat,
      );
      setCells(data);
    } catch (_e) {
      /* Heatmap-Ladefehler still ignorieren */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (heatmap) fetchHeatmap(region);
    else setCells([]);
  }, [heatmap, region, fetchHeatmap]);

  const handleRegionChange = useCallback((r: Region) => setRegion(r), []);

  const { clusters, singles } = useMemo(
    () => buildClusters(toilets, region.latitudeDelta),
    [toilets, region.latitudeDelta],
  );

  function zoomIntoCluster(cluster: Cluster) {
    const delta = Math.max(region.latitudeDelta * 0.4, 0.005);
    mapRef.current?.animateToRegion(
      {
        latitude: cluster.latitude,
        longitude: cluster.longitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
      },
      400,
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        mapType="satellite"
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
        onRegionChangeComplete={handleRegionChange}
      >
        {/* Einzelne Marker */}
        {singles.map((toilet) => (
          <ToiletMarker key={toilet.id} toilet={toilet} onPress={() => onSelectToilet(toilet.id)} />
        ))}

        {/* Cluster-Marker */}
        {clusters.map((cluster) => (
          <Marker
            key={cluster.key}
            coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
            onPress={() => zoomIntoCluster(cluster)}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View
              style={[styles.clusterPin, { backgroundColor: clusterBadgeColor(cluster.count) }]}
            >
              <Text style={styles.clusterCount}>{cluster.count}</Text>
              <Text style={styles.clusterIcon}>🚻</Text>
            </View>
          </Marker>
        ))}

        {/* Heatmap-Zellen */}
        {heatmap &&
          cells.map((cell, i) => {
            const fillColor = cellColor(cell.count);
            if (fillColor === 'rgba(0,0,0,0)') return null;
            const half_w = cell.cellW / 2;
            const half_h = cell.cellH / 2;
            return (
              <Polygon
                key={i}
                coordinates={[
                  { latitude: cell.lat - half_h, longitude: cell.lng - half_w },
                  { latitude: cell.lat + half_h, longitude: cell.lng - half_w },
                  { latitude: cell.lat + half_h, longitude: cell.lng + half_w },
                  { latitude: cell.lat - half_h, longitude: cell.lng + half_w },
                ]}
                fillColor={fillColor}
                strokeColor="rgba(0,0,0,0)"
                strokeWidth={0}
              />
            );
          })}
      </MapView>

      {/* Kompass (statisch Nord-oben) */}
      <View style={styles.compassBtn}>
        <View style={styles.compassRose}>
          <View style={styles.needleNorth} />
          <View style={styles.needleSouth} />
        </View>
        <Text style={styles.compassN}>N</Text>
      </View>

      {/* Recenter */}
      <TouchableOpacity
        style={styles.recenterBtn}
        onPress={recenterOnUser}
        activeOpacity={0.8}
        disabled={!userLocation}
      >
        <Text style={styles.recenterIcon}>◎</Text>
      </TouchableOpacity>

      {/* Heatmap-Toggle */}
      <TouchableOpacity
        style={[styles.toggleBtn, heatmap && styles.toggleBtnActive]}
        onPress={() => setHeatmap((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={styles.toggleText}>{loadingHeat ? '⏳' : '🌡️'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  map: { ...StyleSheet.absoluteFillObject },
  compassBtn: {
    position: 'absolute',
    top: 56,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  compassRose: { alignItems: 'center', gap: 0 },
  needleNorth: { width: 6, height: 12, backgroundColor: '#EF4444', borderRadius: 3 },
  needleSouth: { width: 6, height: 10, backgroundColor: '#9CA3AF', borderRadius: 3, marginTop: 1 },
  compassN: { position: 'absolute', top: 0, fontSize: 7, fontWeight: '800', color: '#EF4444' },

  recenterBtn: {
    position: 'absolute',
    bottom: 156,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  recenterIcon: { fontSize: 22, color: '#118AB2' },

  toggleBtn: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleBtnActive: { backgroundColor: 'rgba(239,68,68,0.85)' },
  toggleText: { fontSize: 20 },

  clusterPin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  clusterCount: { color: '#fff', fontSize: 13, fontWeight: '800' },
  clusterIcon: { fontSize: 13 },
});
