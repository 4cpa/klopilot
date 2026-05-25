import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import type { Toilet } from '@/lib/api';
import { scoreNetColor } from '@klopilot/shared-types';

interface Props {
  toilet: Toilet;
  onPress: () => void;
}

export function ToiletMarker({ toilet, onPress }: Props) {
  const color = scoreNetColor(toilet.score);
  const net = toilet.score?.count ? toilet.score.net.toFixed(1) : '?';

  return (
    <Marker
      coordinate={{ latitude: toilet.latitude, longitude: toilet.longitude }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={false}
    >
      <View style={styles.wrapper}>
        <View
          style={[
            styles.pin,
            {
              backgroundColor: color,
              borderColor: toilet.verified ? '#06D6A0' : '#fff',
              borderWidth: toilet.verified ? 3 : 2,
            },
          ]}
        >
          <Text style={styles.score}>{net}</Text>
        </View>
        {toilet.verified && <View style={styles.verifiedDot} />}
        {toilet.partner && (
          <View style={styles.partnerDot}>
            <Text style={styles.partnerIcon}>🤝</Text>
          </View>
        )}
        <View style={[styles.tip, { borderTopColor: color }]} />
      </View>
      <Callout tooltip={false} onPress={onPress}>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle} numberOfLines={1}>
            {toilet.name}
          </Text>
          {toilet.distanceM != null && (
            <Text style={styles.calloutMeta}>
              {toilet.distanceM < 1000
                ? `${toilet.distanceM} m`
                : `${(toilet.distanceM / 1000).toFixed(1)} km`}
            </Text>
          )}
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  score: { color: '#fff', fontSize: 11, fontWeight: '700' },
  tip: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  verifiedDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#06D6A0',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  partnerDot: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerIcon: { fontSize: 10 },
  callout: { width: 160, padding: 8, borderRadius: 8 },
  calloutTitle: { fontSize: 13, fontWeight: '600' },
  calloutMeta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
});
