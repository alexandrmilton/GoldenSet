import { useEffect } from 'react';
import {
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/theme/tokens';

import { Text } from './text';

export type SheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
};

/**
 * Bottom sheet — "create a game", "log a match", the player filters.
 *
 * Deliberately not React Native's Modal. On web, react-native-web kept the
 * modal mounted after visible flipped to false: the handler ran, state updated,
 * and the panel stayed on screen with no way to dismiss it. An absolutely
 * positioned overlay behaves the same on both platforms and we control it.
 *
 * Render it as the last child of a screen's root view so it stacks on top.
 */
export function Sheet({ visible, title, onClose, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  // Android's hardware back should close the sheet, not leave the screen.
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        style={styles.backdrop}
        onPress={onClose}
      />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.grabber} />
        <Text variant="heading">{title}</Text>
        {/* Filter sheets can run long; cap the height and scroll inside. */}
        <ScrollView
          style={{ maxHeight: height * 0.7 }}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.bg.elevated,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  body: { gap: Spacing.lg, paddingBottom: Spacing.md },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border.subtle,
    marginBottom: Spacing.sm,
  },
});
