import { useState } from 'react';
import {
  Modal,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  useWindowDimensions,
  StatusBar,
  Platform,
} from 'react-native';

interface PhotoItem {
  id: string;
  uri: string;
}

interface Props {
  photos: PhotoItem[];
  initialIndex: number;
  onClose: () => void;
  onReport?: (photoId: string) => void;
}

export function PhotoViewer({ photos, initialIndex, onClose, onReport }: Props) {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);

  return (
    <Modal
      visible
      transparent={false}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={[styles.root, { backgroundColor: '#000' }]}>
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const next = Math.round(e.nativeEvent.contentOffset.x / width);
            setIndex(next);
          }}
          renderItem={({ item }) => (
            <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
              <Image source={{ uri: item.uri }} style={{ width, height }} resizeMode="contain" />
            </View>
          )}
          keyExtractor={(item) => item.id}
        />

        {/* Close */}
        <TouchableOpacity
          style={[styles.closeBtn, { top: Platform.OS === 'ios' ? 54 : 20 }]}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>

        {/* Counter */}
        {photos.length > 1 && (
          <View style={styles.counterBox}>
            <Text style={styles.counterTxt}>
              {index + 1} / {photos.length}
            </Text>
          </View>
        )}

        {/* Pagination dots */}
        {photos.length > 1 && (
          <View style={styles.dots}>
            {photos.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.35)' },
                ]}
              />
            ))}
          </View>
        )}

        {/* Report current photo */}
        {onReport && (
          <TouchableOpacity
            style={[styles.reportBtn, { bottom: photos.length > 1 ? 72 : 36 }]}
            onPress={() => onReport(photos[index].id)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.reportTxt}>⚑</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 18 },
  counterBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
  },
  counterTxt: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  dots: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  reportBtn: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reportTxt: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
});
