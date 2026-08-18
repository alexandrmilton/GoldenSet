import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/theme/tokens';

import { Text } from './text';

export type SheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
};

/** Bottom sheet — used for "create a game" and "log a match". */
export function Sheet({ visible, title, onClose, children }: SheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.grabber} />
        <Text variant="heading">{title}</Text>
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: Colors.bg.elevated,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border.subtle,
    marginBottom: Spacing.sm,
  },
});
