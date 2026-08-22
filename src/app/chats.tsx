import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Card, Text } from '@/components/ui';
import { useSession } from '@/features/auth/session';
import { useThreads, type ThreadSummary } from '@/features/chat/queries';
import { useProfileLookup } from '@/features/players/queries';
import { Colors, Radius, Spacing } from '@/theme/tokens';

/** The list of conversations, per docs/MODULES.md §8. */
export default function ChatsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useSession();
  const { data: threads = [] } = useThreads(session?.user.id);

  const ids = threads.map((thread) => thread.otherId).filter((id): id is string => Boolean(id));
  const { data: people } = useProfileLookup(ids);

  const titleOf = (thread: ThreadSummary) => {
    if (thread.kind === 'global') return t('chat.global');
    if (thread.kind === 'match') return t('chat.matchThread');
    if (thread.otherId) return people?.get(thread.otherId)?.username ?? '';
    return thread.title ?? '';
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text variant="title">{t('chat.title')}</Text>
        </View>

        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const name = titleOf(item);
            return (
              <Pressable accessibilityRole="button" onPress={() => router.push(`/chat/${item.id}`)}>
                <Card style={styles.row}>
                  <Avatar name={name} size={44} />
                  <View style={styles.body}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {name}
                    </Text>
                    <Text variant="caption" tone="secondary" numberOfLines={1}>
                      {item.lastMessage ??
                        (item.kind === 'global' ? t('chat.globalSubtitle') : '')}
                    </Text>
                  </View>
                  {item.unread > 0 ? (
                    <View style={styles.badge}>
                      <Text variant="label" tone="onClay">
                        {String(item.unread)}
                      </Text>
                    </View>
                  ) : null}
                </Card>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text variant="body" tone="secondary">
                {t('chat.empty')}
              </Text>
              <Text variant="caption" tone="tertiary">
                {t('chat.emptyHint')}
              </Text>
            </View>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  body: { flex: 1, gap: 2 },
  badge: {
    minWidth: 22,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.clay[500],
    alignItems: 'center',
  },
  empty: { alignItems: 'center', gap: Spacing.xs, paddingTop: Spacing.xxl },
});
