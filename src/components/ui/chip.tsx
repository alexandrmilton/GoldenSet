import { Pressable, StyleSheet } from 'react-native';

import { Colors, Radius, Spacing } from '@/theme/tokens';

import { Text } from './text';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

/** A single-tap filter value. Selected reads as clay, like every other active state. */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}>
      <Text variant="caption" tone={selected ? 'onClay' : 'secondary'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.bg.surface,
  },
  selected: { backgroundColor: Colors.clay[500], borderColor: Colors.clay[300] },
});
