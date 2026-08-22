import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import type { HistoryRow } from '@/lib/database.types';
import { Spacing } from '@/theme/tokens';

/** One line of match history: who, what score, and what it cost or paid. */
export function MatchRow({ row, onPress }: { row: HistoryRow; onPress?: () => void }) {
  const { t } = useTranslation();

  const detail = [
    new Date(row.played_at).toLocaleDateString(),
    row.court_name,
    row.racquet_label,
    row.kind === 'friendly' ? t('stats.friendly') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card style={styles.row}>
        <View style={styles.rowTop}>
          <Text variant="bodyStrong" numberOfLines={1} style={styles.opponent}>
            {row.opponent_name}
          </Text>
          <Text variant="numericSmall" tone={row.won ? 'up' : 'down'}>
            {row.score ?? ''}
          </Text>
        </View>

        <View style={styles.rowBottom}>
          <Text variant="caption" tone="tertiary" numberOfLines={1} style={styles.detail}>
            {detail}
          </Text>
          {row.delta !== null && row.kind === 'rated' ? (
            <Text variant="numericSmall" tone={row.delta >= 0 ? 'up' : 'down'}>
              {row.delta > 0 ? `+${row.delta}` : String(row.delta)}
            </Text>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.xs },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  opponent: { flex: 1 },
  detail: { flex: 1 },
});
