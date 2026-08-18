import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/theme/tokens';

import { Avatar } from './avatar';
import { Text } from './text';

export type ListRowProps = {
  rank: number;
  name: string;
  subtitle: string;
  points: number;
  /** Points gained or lost since the last recalculation. */
  delta?: number;
  avatarUri?: string | null;
  /** The leader row, drawn on clay like in the reference. */
  highlighted?: boolean;
  onPress?: () => void;
};

export function ListRow({
  rank,
  name,
  subtitle,
  points,
  delta,
  avatarUri,
  highlighted = false,
  onPress,
}: ListRowProps) {
  const deltaTone = delta !== undefined && delta < 0 ? 'down' : 'up';
  const deltaLabel = delta === undefined ? null : `${delta > 0 ? '+' : ''}${delta}`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        highlighted && styles.rowHighlighted,
        pressed && styles.rowPressed,
      ]}>
      <Text variant="numericSmall" tone={highlighted ? 'onClay' : 'gold'} style={styles.rank}>
        {String(rank)}
      </Text>

      <Avatar name={name} uri={avatarUri} ring={highlighted ? Colors.gold : undefined} />

      <View style={styles.identity}>
        <Text variant="bodyStrong" tone={highlighted ? 'onClay' : 'primary'} numberOfLines={1}>
          {name}
        </Text>
        <Text variant="caption" tone={highlighted ? 'onClay' : 'secondary'} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.score}>
        <Text variant="numeric" tone={highlighted ? 'onClay' : 'gold'}>
          {String(points)}
        </Text>
        {deltaLabel ? (
          <Text variant="numericSmall" tone={highlighted ? 'onClay' : deltaTone}>
            {deltaLabel}
          </Text>
        ) : null}
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={highlighted ? Colors.text.onClay : Colors.text.tertiary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
  },
  rowHighlighted: {
    backgroundColor: Colors.clay[500],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.clay[300],
  },
  rowPressed: { opacity: 0.7 },
  rank: { width: 22, textAlign: 'center' },
  identity: { flex: 1, gap: 2 },
  score: { alignItems: 'flex-end' },
});
