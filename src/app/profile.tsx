import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, Card, LevelBadge, Text } from '@/components/ui';
import { signOut, useSession } from '@/features/auth/session';
import { useMyEquipment } from '@/features/equipment/queries';
import { useMyProfile } from '@/features/profile/queries';
import { Colors, Spacing } from '@/theme/tokens';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useSession();
  const { data: profile } = useMyProfile(session?.user.id);
  const { data: equipment = [] } = useMyEquipment(session?.user.id);

  if (!profile) return <View style={styles.screen} />;

  const ranked = profile.matches_played >= 5;

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

          {profile.seed_level !== null ? (
            <Card style={styles.seedCard}>
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

          <Card style={styles.stats}>
            <View style={styles.stat}>
              <Text variant="caption" tone="secondary">
                {t('profile.points')}
              </Text>
              <Text variant="numeric" tone={ranked ? 'gold' : 'tertiary'}>
                {ranked ? String(profile.points) : t('profile.unranked')}
              </Text>
            </View>

            <View style={styles.stat}>
              <Text variant="caption" tone="secondary">
                {t('profile.matches')}
              </Text>
              <Text variant="numeric">{String(profile.matches_played)}</Text>
            </View>
          </Card>

          <Card style={styles.seedCard}>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.base },
  safeArea: { flex: 1 },
  content: { padding: Spacing.xl, gap: Spacing.xl },
  header: { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.lg },
  identity: { alignItems: 'center', gap: 2 },
  seedCard: { gap: Spacing.xs },
  equipmentRow: { gap: 2, paddingTop: Spacing.xs },
  stats: { flexDirection: 'row', gap: Spacing.xl },
  stat: { flex: 1, gap: Spacing.xs },
});
