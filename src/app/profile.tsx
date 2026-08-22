import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MatchRow } from '@/components/stats/match-row';
import { RatingChart } from '@/components/stats/rating-chart';
import { Avatar, Button, Card, Chip, LevelBadge, Text } from '@/components/ui';
import { signOut, useSession } from '@/features/auth/session';
import { useMyEquipment } from '@/features/equipment/queries';
import { useMyProfile } from '@/features/profile/queries';
import {
  useMatchHistory,
  usePlayerStats,
  useRacquetStats,
  useRatingSeries,
} from '@/features/stats/queries';
import { SUPPORTED_LANGUAGES, setLanguage } from '@/i18n';
import { Colors, Spacing } from '@/theme/tokens';

/** Language names are shown in their own language, never translated. */
const LANGUAGE_LABELS: Record<string, string> = { en: 'English', uk: 'Українська' };

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { session } = useSession();
  const me = session?.user.id;

  const { data: profile } = useMyProfile(me);
  const { data: equipment = [] } = useMyEquipment(me);
  const { data: stats } = usePlayerStats(me);
  const { data: series = [] } = useRatingSeries(me);
  const { data: racquets = [] } = useRacquetStats(me);
  const { data: history = [] } = useMatchHistory(me, 5);

  if (!profile) return <View style={styles.screen} />;

  const ranked = profile.matches_played >= 5;
  const bestWin = stats?.best_win_name
    ? `${t('stats.bestWin')}: ${t('stats.bestWinValue', {
        name: stats.best_win_name,
        points: stats.best_win_points,
      })}`
    : null;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Avatar name={profile.username} uri={profile.avatar_url} size={88} ring={Colors.gold} />
            <View style={styles.identity}>
              <Text variant="title">{profile.username}</Text>
              {profile.city ? (
                <Text variant="body" tone="secondary">
                  {profile.city}
                </Text>
              ) : null}
            </View>
            {profile.level !== null ? (
              <LevelBadge value={profile.level} status={profile.rating_status} />
            ) : null}
          </View>

          <Card style={styles.stats}>
            <Stat
              label={t('profile.points')}
              value={ranked ? String(profile.points) : t('profile.unranked')}
              tone={ranked ? 'gold' : undefined}
            />
            <Stat label={t('profile.matches')} value={String(profile.matches_played)} />
            <Stat label={t('players.reliabilityLabel')} value={`${profile.reliability}%`} />
          </Card>

          {profile.seed_level !== null ? (
            <Card style={styles.block}>
              <Text variant="caption" tone="secondary">
                {t('profile.seedRating')}
              </Text>
              <Text variant="bodyStrong" tone="secondary">
                {t('profile.seedValue', {
                  level: profile.seed_level.toFixed(1),
                  points: profile.seed_points,
                  date: profile.seed_at ? new Date(profile.seed_at).toLocaleDateString() : '',
                })}
              </Text>
            </Card>
          ) : null}

          <Card style={styles.block}>
            <Text variant="label" tone="tertiary">
              {t('stats.chart')}
            </Text>
            <RatingChart series={series} />
          </Card>

          {stats && stats.matches > 0 ? (
            <Card style={styles.block}>
              <Text variant="label" tone="tertiary">
                {t('stats.record')}
              </Text>
              <View style={styles.recordRow}>
                <Stat label={t('stats.wins')} value={String(stats.wins)} tone="gold" />
                <Stat label={t('stats.losses')} value={String(stats.losses)} />
                <Stat label={t('stats.winPct')} value={`${stats.win_pct}%`} />
              </View>
              <Text variant="caption" tone="secondary">
                {stats.current_streak > 0
                  ? t('stats.streak', { count: stats.current_streak })
                  : t('stats.noStreak')}
              </Text>
              {bestWin ? (
                <Text variant="caption" tone="secondary">
                  {bestWin}
                </Text>
              ) : null}
            </Card>
          ) : null}

          <View style={styles.block}>
            <View style={styles.sectionHead}>
              <Text variant="heading">{t('stats.history')}</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/matches')}>
                <Text variant="caption" tone="secondary">
                  {t('stats.allMatches')}
                </Text>
              </Pressable>
            </View>
            {history.length === 0 ? (
              <Text variant="caption" tone="tertiary">
                {t('stats.noHistory')}
              </Text>
            ) : (
              history.map((row) => (
                <MatchRow
                  key={row.match_id}
                  row={row}
                  onPress={() => router.push(`/player/${row.opponent_id}`)}
                />
              ))
            )}
          </View>

          <Card style={styles.block}>
            <Text variant="label" tone="tertiary">
              {t('stats.racquets')}
            </Text>
            {racquets.length === 0 ? (
              <Text variant="caption" tone="tertiary">
                {t('stats.noRacquets')}
              </Text>
            ) : (
              racquets.map((racquet) => (
                <View key={racquet.equipment_id} style={styles.equipmentRow}>
                  <Text variant="body">{racquet.label ?? ''}</Text>
                  <Text variant="caption" tone="tertiary">
                    {t('stats.racquetLine', {
                      matches: racquet.matches,
                      pct: racquet.win_pct,
                      delta: racquet.avg_delta,
                    })}
                  </Text>
                </View>
              ))
            )}
          </Card>

          <Card style={styles.block}>
            <Text variant="caption" tone="secondary">
              {t('profile.equipment')}
            </Text>
            {equipment.length === 0 ? (
              <Text variant="body" tone="tertiary">
                {t('profile.noEquipment')}
              </Text>
            ) : (
              equipment.map((item) => {
                const catalog = item.equipment_catalog;
                const name = catalog ? `${catalog.brand} ${catalog.model}` : item.custom_name;
                const detail = [item.string_model, item.tension_kg ? `${item.tension_kg} kg` : null]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <View key={item.id} style={styles.equipmentRow}>
                    <Text variant="caption" tone="tertiary">
                      {t(item.kind === 'balls' ? 'profile.balls' : 'profile.racquet')}
                    </Text>
                    <Text variant="body">{name ?? ''}</Text>
                    {detail ? (
                      <Text variant="caption" tone="tertiary">
                        {detail}
                      </Text>
                    ) : null}
                  </View>
                );
              })
            )}
          </Card>

          <Card style={styles.block}>
            <Text variant="caption" tone="secondary">
              {t('profile.language')}
            </Text>
            <View style={styles.languages}>
              {SUPPORTED_LANGUAGES.map((code) => (
                <Chip
                  key={code}
                  label={LANGUAGE_LABELS[code]}
                  selected={i18n.language === code}
                  onPress={() => setLanguage(code)}
                />
              ))}
            </View>
          </Card>

          <Button
            label={t('auth.signOut')}
            variant="secondary"
            onPress={async () => {
              await signOut();
              router.replace('/sign-in');
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'gold' }) {
  return (
    <View style={styles.stat}>
      <Text variant="caption" tone="secondary" numberOfLines={1}>
        {label}
      </Text>
      <Text variant="numeric" tone={tone}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.base },
  safeArea: { flex: 1 },
  content: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: Spacing.xxxl },
  header: { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.lg },
  identity: { alignItems: 'center', gap: 2 },
  stats: { flexDirection: 'row', gap: Spacing.xl },
  stat: { flex: 1, gap: Spacing.xs },
  block: { gap: Spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recordRow: { flexDirection: 'row', gap: Spacing.lg },
  equipmentRow: { gap: 2, paddingTop: Spacing.xs },
  languages: { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.xs },
});
