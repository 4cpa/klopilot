import { useRef, useEffect, useCallback, ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_H } = Dimensions.get('window');

interface Props {
  visible: boolean;
  snapHeight?: number; // 0–1, fraction of screen (default 0.5)
  onClose: () => void;
  backgroundColor?: string;
  handleColor?: string;
  children: ReactNode;
}

export function BottomSheet({
  visible,
  snapHeight = 0.5,
  onClose,
  backgroundColor = '#fff',
  handleColor = '#ccc',
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const sheetH = SCREEN_H * snapHeight;
  const translateY = useRef(new Animated.Value(sheetH)).current;

  const show = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
      speed: 14,
    }).start();
  }, [translateY]);

  const hide = useCallback(
    (cb?: () => void) => {
      Animated.timing(translateY, {
        toValue: sheetH,
        duration: 220,
        useNativeDriver: true,
      }).start(() => cb?.());
    },
    [translateY, sheetH],
  );

  useEffect(() => {
    if (visible) {
      translateY.setValue(sheetH);
      show();
    }
  }, [visible, sheetH, show, translateY]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > sheetH * 0.3 || g.vy > 0.5) {
          hide(onClose);
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={() => hide(onClose)}>
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => hide(onClose)} />

      <Animated.View
        style={[
          styles.sheet,
          {
            height: sheetH,
            backgroundColor,
            paddingBottom: insets.bottom,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Drag handle */}
        <View {...pan.panHandlers} style={styles.handleArea}>
          <View style={[styles.handle, { backgroundColor: handleColor }]} />
        </View>

        {children}
      </Animated.View>
    </Modal>
  );
}

export function BottomSheetScrollView({
  children,
  style,
  contentContainerStyle,
}: {
  children: ReactNode;
  style?: object;
  contentContainerStyle?: object;
}) {
  return (
    <ScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleArea: { alignItems: 'center', paddingVertical: 10 },
  handle: { width: 36, height: 4, borderRadius: 2 },
});
