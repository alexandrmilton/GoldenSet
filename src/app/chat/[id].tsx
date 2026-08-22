import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Sheet, Text, TextField } from '@/components/ui';
import { useSession } from '@/features/auth/session';
import {
  useBlockPlayer,
  useDeleteMessage,
  useMarkRead,
  useMessageStream,
  useMessages,
  useReport,
  useSendMessage,
} from '@/features/chat/queries';
import { useProfileLookup } from '@/features/players/queries';
import type { Message } from '@/lib/database.types';
import { Colors, Radius, Spacing, Type } from '@/theme/tokens';

/** One conversation, live. */
export default function ChatScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const me = session?.user.id;

  const { data: messages = [] } = useMessages(id);
  useMessageStream(id);
  const send = useSendMessage(me);
  const markRead = useMarkRead(me);
  const block = useBlockPlayer(me);
  const report = useReport(me);
  const remove = useDeleteMessage(me);

  const [draft, setDraft] = useState('');
  const [acting, setActing] = useState<Message | null>(null);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const authors = messages.map((message) => message.author_id);
  const { data: people } = useProfileLookup(authors);

  useEffect(() => {
    if (id && me) markRead.mutate(id);
    // Marking read once per open is deliberate: doing it on every message would
    // fight with the unread badge the moment a message arrives while reading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, me]);

  const submit = async () => {
    if (!draft.trim() || !id) return;
    await send.mutateAsync({ threadId: id, body: draft });
    setDraft('');
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const mine = item.author_id === me;
              const name = people?.get(item.author_id)?.username ?? '';
              return (
                <Pressable
                  accessibilityRole="button"
                  onLongPress={() => setActing(item)}
                  style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  {!mine ? (
                    <Text variant="label" tone="tertiary">
                      {name}
                    </Text>
                  ) : null}
                  <Text variant="body" tone={item.deleted_at ? 'tertiary' : 'primary'}>
                    {item.deleted_at ? t('chat.deleted') : item.body}
                  </Text>
                </Pressable>
              );
            }}
          />

          {notice ? (
            <Text variant="caption" tone="up" style={styles.notice}>
              {notice}
            </Text>
          ) : null}

          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t('chat.placeholder')}
              placeholderTextColor={Colors.text.tertiary}
              style={styles.input}
              multiline
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('chat.send')}
              onPress={submit}
              style={styles.sendButton}>
              <Ionicons name="send" size={18} color={Colors.text.onClay} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Sheet
        visible={acting !== null}
        title={t('chat.report')}
        onClose={() => {
          setActing(null);
          setReason('');
        }}>
        {acting?.author_id === me ? (
          <Button
            label={t('chat.delete')}
            variant="secondary"
            onPress={async () => {
              if (acting && id) await remove.mutateAsync({ messageId: acting.id, threadId: id });
              setActing(null);
            }}
          />
        ) : (
          <>
            <TextField
              label={t('chat.reportReason')}
              value={reason}
              onChangeText={setReason}
            />
            <Button
              label={t('chat.report')}
              onPress={async () => {
                if (!acting) return;
                await report.mutateAsync({
                  targetType: 'message',
                  targetId: acting.id,
                  reason: reason.trim() || 'unspecified',
                });
                setActing(null);
                setReason('');
                setNotice(t('chat.reported'));
              }}
            />
            <Button
              label={t('chat.block')}
              variant="secondary"
              onPress={async () => {
                if (!acting) return;
                await block.mutateAsync(acting.author_id);
                setActing(null);
                setNotice(t('chat.blocked'));
              }}
            />
          </>
        )}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.base },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  bubble: {
    maxWidth: '85%',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    gap: 2,
  },
  mine: { alignSelf: 'flex-end', backgroundColor: Colors.clay[600] },
  theirs: { alignSelf: 'flex-start', backgroundColor: Colors.bg.surface },
  notice: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.subtle,
  },
  input: {
    ...Type.body,
    flex: 1,
    color: Colors.text.primary,
    backgroundColor: Colors.bg.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.clay[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
