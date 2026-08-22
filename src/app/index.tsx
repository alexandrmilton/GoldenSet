import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BottomNav, type NavKey } from '@/components/home/bottom-nav';
import { Hero } from '@/components/home/hero';
import { TournamentBanner } from '@/components/home/tournament-banner';
import { PlayerCard } from '@/components/players/player-card';
import { Avatar, Button, Card, Chip, LevelBadge, Sheet, Text } from '@/components/ui';
import { useSession } from '@/features/auth/session';
import { useMyGames, usePendingConfirmations } from '@/features/games/queries';
import { useFeed, useHomeSummary, useMovers } from '@/features/home/queries';
import { MOCK_TOURNAMENT } from '@/features/home/mock';
import { usePlayers } from '@/features/players/queries';
import { useMyProfile } from '@/features/profile/queries';
import { Colors, Radius, Spacing } from '@/theme/tokens';

/**
 * Home, per docs/MODULES.md §4.
 *
 * A feed, not a list of players: ordered by what needs the player's action
 * first, and led by a movers table rather than absolute points, so it stays
 * worth opening at any level.
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useSession();
  const me = session?.user.id;

  const { data: profile } = useMyProfile(me);
  const { data: summary } = useHomeSummary(Boolean(me));
  const { data: games = [] } = useMyGames(me);
  const { data: pendingScores = [] } = usePendingConfirmations(me);
  const { data: feed = [] } = useFeed();

  const [moverDays, setMoverDays] = useState(7);
  const { data: movers = [] } = useMovers(moverDays);

  const [tab, setTab] = useState<NavKey>('home');
  const [composeOpen, setComposeOpen] = useState(false);

  const nearby = usePlayers({
    city: profile?.city ?? null,
    levelMin: profile?.level ? profile.level - 0.5 : null,
    levelMax: profile?.level ? profile.level + 0.5 : null,
    sort: 'level',
  });

  const incoming = games.filter((game) => game.status === 'invited' && game.opponent_id === me);
  const nextGame = games
    .filter((game) => game.status === 'accepted' && new Date(game.starts_at) >= new Date())
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];

  const needsAnswer = incoming.length > 0 || pendingScores.length > 0;

  const navLabels: Record<NavKey, string> = {
    home: t('nav.home'),
    search: t('nav.search'),
    messages: t('nav.messages'),
    menu: t('nav.menu'),
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Hero
          tagline={t('common.tagline')}
          playerName={profile?.username ?? ''}
          avatarUri={profile?.avatar_url}
          unreadCount={incoming.length + pendingScores.length}
          onPressProfile={() => router.push('/profile')}
          onPressNotifications={() => router.push('/games')}
        />

        <View style={styles.body}>
          {/* Anything waiting on this player comes before anything else. */}
          {needsAnswer ? (
            <Card variant="clay" style={styles.block}>
              <Text variant="label" tone="onClay">
                {t('home.needsAnswer')}
              </Text>
              {incoming.length > 0 ? (
                <Text variant="bodyStrong" tone="onClay">
                  {t('home.challengesWaiting', { count: incoming.length })}
                </Text>
              ) : null}
              {pendingScores.length > 0 ? (
                <Text variant="bodyStrong" tone="onClay">
                  {t('home.scoresWaiting', { count: pendingScores.length })}
                </Text>
              ) : null}
              <Button
                label={t('home.open')}
                variant="secondary"
                onPress={() => router.push('/games')}
              />
            </Card>
          ) : null}

          {nextGame ? (
            <Card style={styles.block}>
              <Text variant="label" tone="tertiary">
                {t('home.nextGame')}
              </Text>
              <Text variant="bodyStrong">
                {new Date(nextGame.starts_at).toLocaleString([], {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              {nextGame.court_note ? (
                <Text variant="caption" tone="secondary">
                  {nextGame.court_note}
                </Text>
              ) : null}
            </Card>
          ) : null}

          {summary ? (
            <Card style={styles.block}>
              <Text variant="label" tone="tertiary">
                {t('home.yourRating')}
              </Text>
              <View style={styles.ratingRow}>
                <Text variant="display" tone="gold">
                  {String(summary.points)}
                </Text>
                {summary.level !== null ? (
                  <LevelBadge value={summary.level} status={summary.rating_status} />
                ) : null}
              </View>
              <View style={styles.ratingMeta}>
                <Text
                  variant="numericSmall"
                  tone={summary.delta_week >= 0 ? 'up' : 'down'}>
                  {formatDelta(summary.delta_week)}
                </Text>
                <Text variant="caption" tone="secondary">
                  {t('home.thisWeek')}
                </Text>
              </View>
              {summary.city_rank && profile?.city ? (
                <Text variant="caption" tone="tertiary">
                  {t('home.inCity', {
                    rank: summary.city_rank,
                    total: summary.city_total,
                    city: profile.city,
                  })}
                </Text>
              ) : null}
            </Card>
          ) : null}

          <View style={styles.block}>
            <View style={styles.sectionHead}>
              <Text variant="heading">{t('home.movers')}</Text>
              <View style={styles.periods}>
                <Chip
                  label={t('home.week')}
                  selected={moverDays === 7}
                  onPress={() => setMoverDays(7)}
                />
                <Chip
                  label={t('home.month')}
                  selected={moverDays === 30}
                  onPress={() => setMoverDays(30)}
                />
              </View>
            </View>

            {movers.length === 0 ? (
              <Text variant="caption" tone="tertiary">
                {t('home.noMovers')}
              </Text>
            ) : (
              <Card padded={false} style={styles.list}>
                {movers.map((mover, index) => (
                  <Pressable
                    key={mover.profile_id}
                    accessibilityRole="button"
                    onPress={() => router.push(`/player/${mover.profile_id}`)}
                    style={styles.moverRow}>
                    <Text variant="numericSmall" tone="gold" style={styles.rank}>
                      {String(index + 1)}
                    </Text>
                    <Avatar name={mover.username} uri={mover.avatar_url} size={36} />
                    <View style={styles.moverBody}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {mover.username}
                      </Text>
                      <Text variant="caption" tone="secondary">
                        {mover.city ?? ''}
                      </Text>
                    </View>
                    <Text variant="numericSmall" tone="up">
                      {formatDelta(mover.gained)}
                    </Text>
                  </Pressable>
                ))}
              </Card>
            )}

            <Text variant="caption" tone="tertiary">
              {t('home.moversHint')}
            </Text>
          </View>

          {nearby.data && nearby.data.length > 0 ? (
            <View style={styles.block}>
              <View style={styles.sectionHead}>
                <Text variant="heading">{t('home.nearby')}</Text>
                <Pressable accessibilityRole="button" onPress={() => router.push('/players')}>
                  <Text variant="caption" tone="secondary">
                    {t('home.seeAll')}
                  </Text>
                </Pressable>
              </View>
              {nearby.data.slice(0, 3).map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onPress={() => router.push(`/player/${player.id}`)}
                  onChallenge={() => router.push(`/challenge/${player.id}`)}
                />
              ))}
            </View>
          ) : null}

          <View style={styles.block}>
            <Text variant="heading">{t('home.feed')}</Text>
            {feed.length === 0 ? (
              <Text variant="caption" tone="tertiary">
                {t('home.noFeed')}
              </Text>
            ) : (
              <Card padded={false} style={styles.list}>
                {feed.map((match) => {
                  const line = [
                    match.winner_name,
                    t('home.beat'),
                    match.loser_name,
                    '·',
                    match.score ?? '',
                  ].join(' ');
                  return (
                  <View key={match.match_id} style={styles.feedRow}>
                    <Ionicons name="tennisball-outline" size={16} color={Colors.text.tertiary} />
                    <Text variant="caption" style={styles.feedText}>
                      {line}
                    </Text>
                    {match.kind === 'rated' && match.winner_delta !== null ? (
                      <Text variant="numericSmall" tone="up">
                        {formatDelta(match.winner_delta)}
                      </Text>
                    ) : (
                      <Text variant="caption" tone="tertiary">
                        {t('home.friendlyTag')}
                      </Text>
                    )}
                  </View>
                  );
                })}
              </Card>
            )}
          </View>

          <TournamentBanner
            label={t('tournaments.next')}
            name={MOCK_TOURNAMENT.name}
            meta={MOCK_TOURNAMENT.meta}
          />
        </View>
      </ScrollView>

      <BottomNav
        active={tab}
        labels={navLabels}
        composeLabel={t('home.compose')}
        onSelect={(key) => {
          setTab(key);
          if (key === 'search') router.push('/players');
          if (key === 'messages') router.push('/chats');
        }}
        onCompose={() => setComposeOpen(true)}
      />

      <Sheet
        visible={composeOpen}
        title={t('home.compose')}
        onClose={() => setComposeOpen(false)}>
        <Button
          label={t('home.nearby')}
          onPress={() => {
            setComposeOpen(false);
            router.push('/players');
          }}
        />
        <Button
          label={t('games.title')}
          variant="secondary"
          onPress={() => {
            setComposeOpen(false);
            router.push('/games');
          }}
        />
      </Sheet>
    </View>
  );
}

function formatDelta(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.base },
  content: { paddingBottom: Spacing.xl },
  body: { paddingHorizontal: Spacing.lg, gap: Spacing.xl, marginTop: -Spacing.xxl },
  block: { gap: Spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  periods: { flexDirection: 'row', gap: Spacing.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  ratingMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  list: { paddingVertical: Spacing.xs },
  moverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  moverBody: { flex: 1, gap: 2 },
  rank: { width: 18, textAlign: 'center' },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  feedText: { flex: 1 },
});
