import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MatchRow } from '@/components/stats/match-row';
import { Text } from '@/components/ui';
import { useSession } from '@/features/auth/session';
import { useMatchHistory } from '@/features/stats/queries';
import { Colors, Spacing } from '@/theme/tokens';

/** Full match history, per docs/MODULES.md §9. */
export default function MatchesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useSession();
  const { data: history = [] } = useMatchHistory(session?.user.id, 100);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text variant="title">{t('stats.history')}</Text>
        </View>

        <FlatList
          data={history}
          keyExtractor={(item) => item.match_id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <MatchRow row={item} onPress={() => router.push(`/player/${item.opponent_id}`)} />
          )}
          ListEmptyComponent={
            <Text variant="caption" tone="tertiary" style={styles.empty}>
              {t('stats.noHistory')}
            </Text>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.base },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  empty: { textAlign: 'center', paddingTop: Spacing.xxl },
});
