import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/theme/tokens';

import { Text } from './text';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** The four-way switch from the reference: icon over label, clay pill on the active one. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.segmentActive]}>
            <Ionicons
              name={option.icon}
              size={20}
              color={active ? Colors.text.onClay : Colors.text.secondary}
            />
            <Text variant="label" tone={active ? 'onClay' : 'secondary'} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.subtle,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.lg,
  },
  segmentActive: { backgroundColor: Colors.clay[500] },
});
