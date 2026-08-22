import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, LevelBadge, Text } from '@/components/ui';
import { playerAge } from '@/features/players/queries';
import type { PlayerSearchResult } from '@/lib/database.types';
import { Colors, Radius, Spacing } from '@/theme/tokens';

export type PlayerCardProps = {
  player: PlayerSearchResult;
  onPress: () => void;
  onChallenge?: () => void;
};

/**
 * Everything needed to decide whether to play someone, without opening their
 * profile: level and how trustworthy that level is, where they are, how old
 * they are, and what they play with.
 */
export function PlayerCard({ player, onPress, onChallenge }: PlayerCardProps) {
  const { t } = useTranslation();
  const age = playerAge(player.birth_year);

  const meta = [
    player.city,
    age ? t('players.years', { count: age }) : null,
    player.matches_played > 0
      ? t('players.matches', { count: player.matches_played })
      : t('players.noMatches'),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Avatar name={player.username} uri={player.avatar_url} size={52} />

      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text variant="bodyStrong" numberOfLines={1} style={styles.name}>
            {player.username}
          </Text>
          {player.level !== null ? (
            <LevelBadge value={player.level} status={player.rating_status} />
          ) : null}
        </View>

        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {meta}
        </Text>

        {player.balls_label || player.racquet_label ? (
          <Text variant="caption" tone="tertiary" numberOfLines={1}>
            {[player.racquet_label, player.balls_label].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>
        <Text variant="numericSmall" tone="gold">
          {String(player.points)}
        </Text>
        {onChallenge ? (
          <Pressable accessibilityRole="button" onPress={onChallenge} style={styles.challenge}>
            <Text variant="label" tone="onClay">
              {t('games.challenge')}
            </Text>
          </Pressable>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.bg.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.subtle,
  },
  pressed: { backgroundColor: Colors.bg.elevated },
  body: { flex: 1, gap: 2 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { flexShrink: 1 },
  right: { alignItems: 'flex-end', gap: Spacing.xs },
  challenge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: Colors.clay[500],
  },
});
