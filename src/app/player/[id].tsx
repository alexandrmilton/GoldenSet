import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, Card, LevelBadge, Text } from '@/components/ui';
import { playerAge, usePlayer } from '@/features/players/queries';
import { Colors, Spacing } from '@/theme/tokens';

/**
 * Someone else's profile. Public by design — deciding whether to challenge a
 * player means seeing their level, how solid it is, and what they play with.
 */
export default function PlayerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = usePlayer(id);

  const profile = data?.profile;
  if (!profile) return <View style={styles.screen} />;

  const age = playerAge(profile.birth_year);
  const meta = [profile.city, age ? t('players.years', { count: age }) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Avatar name={profile.username} uri={profile.avatar_url} size={88} />
            <Text variant="title">{profile.username}</Text>
            {meta ? (
              <Text variant="body" tone="secondary">
                {meta}
              </Text>
            ) : null}
            {profile.level !== null ? (
              <LevelBadge value={profile.level} status={profile.rating_status} />
            ) : null}
            <Text variant="caption" tone="tertiary">
              {t(`ratingStatus.${profile.rating_status}`)}
            </Text>
          </View>

          <Button
            label={t('games.challenge')}
            size="lg"
            onPress={() => router.push(`/challenge/${id}`)}
          />

          <Card style={styles.stats}>
            <Stat label={t('profile.points')} value={String(profile.points)} tone="gold" />
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

          {data.equipment.length > 0 ? (
            <Card style={styles.block}>
              <Text variant="caption" tone="secondary">
                {t('profile.equipment')}
              </Text>
              {data.equipment.map((item) => {
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
              })}
            </Card>
          ) : null}
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
  content: { padding: Spacing.xl, gap: Spacing.lg },
  header: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.lg },
  stats: { flexDirection: 'row', gap: Spacing.lg },
  stat: { flex: 1, gap: Spacing.xs },
  block: { gap: Spacing.xs },
  equipmentRow: { gap: 2, paddingTop: Spacing.xs },
});
