import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { RatingStatus } from '@/lib/database.types';
import { Colors, Radius, Spacing } from '@/theme/tokens';

import { Text } from './text';

export type LevelBadgeProps = {
  /** GS Level: 1.5–7.0 in half steps. */
  value: number;
  /** Drives the whole appearance — see docs/RATING.md §2. */
  status?: RatingStatus;
  /** GS Points, shown alongside on the large badge. */
  points?: number;
  size?: 'sm' | 'lg';
};

/**
 * The player's level.
 *
 * A seeded rating must never be mistaken for an earned one, so it is drawn in
 * muted grey with a dashed border. Gold is reserved for a rating that came out
 * of real matches; the tick on top of that means a tournament confirmed it.
 */
export function LevelBadge({ value, status = 'seed', points, size = 'sm' }: LevelBadgeProps) {
  const seeded = status === 'seed';
  const large = size === 'lg';

  return (
    <View style={[styles.chip, large && styles.chipLarge, seeded ? styles.seeded : styles.earned]}>
      <Text variant="label" tone="tertiary" style={styles.scale}>
        {SCALE_LABEL}
      </Text>

      <Text
        variant={large ? 'numeric' : 'numericSmall'}
        tone={seeded ? 'secondary' : 'gold'}>
        {value.toFixed(1)}
      </Text>

      {status === 'confirmed' ? (
        <Ionicons name="checkmark-circle" size={large ? 20 : 14} color={Colors.gold} />
      ) : null}

      {large && points !== undefined ? (
        <Text variant="caption" tone="tertiary">
          {String(points)}
        </Text>
      ) : null}
    </View>
  );
}

/** Our own scale, not translated. */
const SCALE_LABEL = 'GS';

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
    backgroundColor: Colors.bg.elevated,
  },
  chipLarge: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  earned: { borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border.subtle },
  // Dashed and grey: this rating was handed out, not played for.
  seeded: { borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.text.tertiary },
  scale: { letterSpacing: 0.8 },
});
