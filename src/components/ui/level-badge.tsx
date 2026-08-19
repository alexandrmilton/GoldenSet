import { StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/theme/tokens';

import { Text } from './text';

export type LevelScale = 'ntrp' | 'utr';

export type LevelBadgeProps = {
  /** NTRP runs 1.0–7.0 in 0.5 steps; UTR runs 1–16.5. */
  value: number;
  scale?: LevelScale;
  /** Confirmed by a coach or organiser — see docs/PLAN.md §5. */
  verified?: boolean;
};

/**
 * The player's level, as a gold-rimmed chip. Deliberately not a tennis ball:
 * the ball reads as an action (the compose button), so reusing it for a static
 * rating made two different things look alike.
 */
export function LevelBadge({ value, scale = 'ntrp', verified = false }: LevelBadgeProps) {
  return (
    <View style={[styles.chip, verified && styles.chipVerified]}>
      <Text variant="label" tone="tertiary" style={styles.scale}>
        {scale.toUpperCase()}
      </Text>
      <Text variant="numericSmall" tone="gold">
        {value.toFixed(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.bg.elevated,
    alignSelf: 'flex-start',
  },
  chipVerified: { borderColor: Colors.gold },
  scale: { letterSpacing: 0.8 },
});
