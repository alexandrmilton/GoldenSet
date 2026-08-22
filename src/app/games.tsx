import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, Card, Sheet, Text, TextField } from '@/components/ui';
import { useSession } from '@/features/auth/session';
import {
  useConfirmMatch,
  useMyGames,
  usePendingConfirmations,
  useReportMatch,
  useRespondToChallenge,
  type SetScore,
} from '@/features/games/queries';
import { useProfileLookup } from '@/features/players/queries';
import type { Game } from '@/lib/database.types';
import { Colors, Spacing } from '@/theme/tokens';

/** Games and results, per docs/MODULES.md §3. */
export default function GamesScreen() {
  const { t } = useTranslation();
  const { session } = useSession();
  const me = session?.user.id;

  const { data: games = [] } = useMyGames(me);
  const { data: pending = [] } = usePendingConfirmations(me);
  const respond = useRespondToChallenge();
  const confirm = useConfirmMatch(me);
  const report = useReportMatch(me);

  const [scoreFor, setScoreFor] = useState<Game | null>(null);
  const [sets, setSets] = useState<SetScore[]>([
    { a: 0, b: 0 },
    { a: 0, b: 0 },
  ]);

  const ids = useMemo(() => {
    const fromGames = games.flatMap((game) => [game.created_by, game.opponent_id]);
    const fromMatches = pending.flatMap((match) =>
      match.match_players.map((player) => player.profile_id),
    );
    return [...fromGames, ...fromMatches];
  }, [games, pending]);
  const { data: people } = useProfileLookup(ids);

  const nameOf = (id: string) => people?.get(id)?.username ?? '';
  const other = (game: Game) => (game.created_by === me ? game.opponent_id : game.created_by);

  const incoming = games.filter((g) => g.status === 'invited' && g.opponent_id === me);
  // The sender has to see the challenge too, or sending one looks like it
  // vanished: there is no other trace of it until the opponent answers.
  const outgoing = games.filter((g) => g.status === 'invited' && g.created_by === me);
  const upcoming = games.filter((g) => g.status === 'accepted');
  const past = games.filter((g) => g.status === 'played');

  const submitScore = async () => {
    if (!scoreFor) return;
    await report.mutateAsync({
      opponentId: other(scoreFor),
      sets: sets.filter((s) => s.a > 0 || s.b > 0),
      kind: scoreFor.kind,
      format: scoreFor.format,
      gameId: scoreFor.id,
    });
    setScoreFor(null);
    setSets([
      { a: 0, b: 0 },
      { a: 0, b: 0 },
    ]);
  };

  const empty = games.length === 0 && pending.length === 0;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="title">{t('games.title')}</Text>

          {empty ? (
            <View style={styles.empty}>
              <Text variant="body" tone="secondary">
                {t('games.empty')}
              </Text>
              <Text variant="caption" tone="tertiary">
                {t('games.emptyHint')}
              </Text>
            </View>
          ) : null}

          {/* Anything needing an answer comes first — see MODULES §4. */}
          {pending.length > 0 ? (
            <Section title={t('games.confirmScore')}>
              {pending.map((match) => {
                const opponent = match.match_players.find((p) => p.profile_id !== me);
                const score = match.match_sets
                  .slice()
                  .sort((a, b) => a.set_no - b.set_no)
                  .map((s) => `${s.games_a}:${s.games_b}`)
                  .join('  ');
                return (
                  <Card key={match.id} style={styles.row}>
                    <Text variant="bodyStrong">{nameOf(opponent?.profile_id ?? '')}</Text>
                    <Text variant="numericSmall" tone="gold">
                      {score}
                    </Text>
                    <View style={styles.actions}>
                      <Button
                        label={t('games.confirm')}
                        onPress={() =>
                          confirm.mutate({ matchId: match.id, decision: 'confirmed' })
                        }
                      />
                      <Button
                        label={t('games.dispute')}
                        variant="secondary"
                        onPress={() => confirm.mutate({ matchId: match.id, decision: 'disputed' })}
                      />
                    </View>
                  </Card>
                );
              })}
            </Section>
          ) : null}

          {incoming.length > 0 ? (
            <Section title={t('games.incoming')}>
              {incoming.map((game) => (
                <Card key={game.id} style={styles.row}>
                  <GameHeader game={game} name={nameOf(other(game))} />
                  <View style={styles.actions}>
                    <Button
                      label={t('games.accept')}
                      onPress={() => respond.mutate({ gameId: game.id, accept: true })}
                    />
                    <Button
                      label={t('games.decline')}
                      variant="secondary"
                      onPress={() => respond.mutate({ gameId: game.id, accept: false })}
                    />
                  </View>
                </Card>
              ))}
            </Section>
          ) : null}

          {outgoing.length > 0 ? (
            <Section title={t('games.outgoing')}>
              {outgoing.map((game) => (
                <Card key={game.id} style={styles.row}>
                  <GameHeader game={game} name={nameOf(other(game))} />
                  <Button
                    label={t('games.cancel')}
                    variant="secondary"
                    onPress={() => respond.mutate({ gameId: game.id, accept: false })}
                  />
                </Card>
              ))}
            </Section>
          ) : null}

          {upcoming.length > 0 ? (
            <Section title={t('games.upcoming')}>
              {upcoming.map((game) => (
                <Card key={game.id} style={styles.row}>
                  <GameHeader game={game} name={nameOf(other(game))} />
                  <Button label={t('games.reportScore')} onPress={() => setScoreFor(game)} />
                </Card>
              ))}
            </Section>
          ) : null}

          {past.length > 0 ? (
            <Section title={t('games.history')}>
              {past.map((game) => (
                <Card key={game.id} style={styles.row}>
                  <GameHeader game={game} name={nameOf(other(game))} />
                </Card>
              ))}
            </Section>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <Sheet
        visible={scoreFor !== null}
        title={t('games.reportScore')}
        onClose={() => setScoreFor(null)}>
        {sets.map((set, index) => (
          <View key={index} style={styles.setRow}>
            <Text variant="label" tone="tertiary" style={styles.setLabel}>
              {t('games.set', { n: index + 1 })}
            </Text>
            <View style={styles.setInputs}>
              <TextField
                label={t('games.you')}
                value={String(set.a)}
                keyboardType="number-pad"
                inputMode="numeric"
                onChangeText={(value) =>
                  setSets((prev) =>
                    prev.map((s, i) => (i === index ? { ...s, a: clampGames(value) } : s)),
                  )
                }
              />
              <TextField
                label={scoreFor ? nameOf(other(scoreFor)) : ''}
                value={String(set.b)}
                keyboardType="number-pad"
                inputMode="numeric"
                onChangeText={(value) =>
                  setSets((prev) =>
                    prev.map((s, i) => (i === index ? { ...s, b: clampGames(value) } : s)),
                  )
                }
              />
            </View>
          </View>
        ))}

        <Button
          label={t('games.save')}
          onPress={() => setSets((prev) => [...prev, { a: 0, b: 0 }])}
          variant="ghost"
        />
        <Button label={t('games.reportScore')} loading={report.isPending} onPress={submitScore} />
      </Sheet>
    </View>
  );
}

/** Games run to 20 at the very outside; anything else is a typo. */
function clampGames(value: string) {
  const parsed = Number(value.replace(/\D/g, ''));
  if (Number.isNaN(parsed)) return 0;
  return Math.min(20, parsed);
}

function GameHeader({ game, name }: { game: Game; name: string }) {
  const { t } = useTranslation();
  const when = new Date(game.starts_at);
  const line = [
    when.toLocaleDateString(),
    when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    t(`games.${game.kind}`),
  ].join(' · ');

  return (
    <View style={styles.header}>
      <Avatar name={name} size={40} />
      <View style={styles.headerBody}>
        <Text variant="bodyStrong">{name}</Text>
        <Text variant="caption" tone="secondary">
          {line}
        </Text>
        {game.court_note ? (
          <Text variant="caption" tone="tertiary">
            {game.court_note}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label" tone="tertiary">
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.base },
  safeArea: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: Spacing.xxxl },
  section: { gap: Spacing.sm },
  row: { gap: Spacing.md },
  header: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  headerBody: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  empty: { alignItems: 'center', gap: Spacing.xs, paddingTop: Spacing.xxl },
  setRow: { gap: Spacing.xs },
  setLabel: {},
  setInputs: { flexDirection: 'row', gap: Spacing.md },
});
