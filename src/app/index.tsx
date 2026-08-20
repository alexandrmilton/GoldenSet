import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BottomNav, type NavKey } from '@/components/home/bottom-nav';
import { Hero } from '@/components/home/hero';
import { TournamentBanner } from '@/components/home/tournament-banner';
import { Button, Card, ListRow, SegmentedControl, Sheet, Text, type SegmentedOption } from '@/components/ui';
import { useSession } from '@/features/auth/session';
import { MOCK_PLAYERS, MOCK_TOURNAMENT } from '@/features/home/mock';
import { useMyProfile } from '@/features/profile/queries';
import { Colors, Spacing } from '@/theme/tokens';

type Section = 'rating' | 'tournaments' | 'calendar' | 'profile';

/**
 * Home — built 1:1 against docs/reference/design-reference-home.jpg.
 * Data is still mock (see features/home/mock.ts); Supabase arrives in Phase 4.
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useSession();
  const { data: profile } = useMyProfile(session?.user.id);
  const [section, setSection] = useState<Section>('rating');
  const [tab, setTab] = useState<NavKey>('home');
  const [composeOpen, setComposeOpen] = useState(false);

  const sections: SegmentedOption<Section>[] = [
    { value: 'rating', label: t('rating.tab'), icon: 'trophy-outline' },
    { value: 'tournaments', label: t('tournaments.tab'), icon: 'tennisball-outline' },
    { value: 'calendar', label: t('calendar.tab'), icon: 'calendar-outline' },
    { value: 'profile', label: t('profile.tab'), icon: 'person-outline' },
  ];

  const navLabels: Record<NavKey, string> = {
    home: t('nav.home'),
    search: t('nav.search'),
    messages: t('nav.messages'),
    menu: t('nav.menu'),
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[]}>
        <Hero
          tagline={t('common.tagline')}
          playerName={profile?.username ?? ''}
          avatarUri={profile?.avatar_url}
          onPressProfile={() => router.push('/profile')}
        />

        <View style={styles.body}>
          <SegmentedControl options={sections} value={section} onChange={setSection} />

          <Card padded={false} style={styles.ratingCard}>
            <View style={styles.ratingHeader}>
              <Text variant="title">{t('rating.title')}</Text>
              <Pressable accessibilityRole="button" style={styles.regionPicker}>
                <Text variant="caption" tone="secondary">
                  {t('rating.allRegions')}
                </Text>
                <Ionicons name="chevron-down" size={14} color={Colors.text.secondary} />
              </Pressable>
            </View>

            {MOCK_PLAYERS.map((player, index) => (
              <View key={player.rank}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <ListRow
                  rank={player.rank}
                  name={player.name}
                  subtitle={player.city}
                  points={player.points}
                  delta={player.delta}
                  highlighted={player.rank === 1}
                />
              </View>
            ))}
          </Card>

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
        onSelect={setTab}
        onCompose={() => setComposeOpen(true)}
      />

      <Sheet
        visible={composeOpen}
        title={t('home.compose')}
        onClose={() => setComposeOpen(false)}>
        <Button label={t('showcase.primary')} onPress={() => setComposeOpen(false)} />
        <Button
          label={t('showcase.secondary')}
          variant="secondary"
          onPress={() => setComposeOpen(false)}
        />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.base },
  content: { paddingBottom: Spacing.xl },
  body: { paddingHorizontal: Spacing.lg, gap: Spacing.lg, marginTop: -Spacing.xxl },
  ratingCard: { paddingVertical: Spacing.sm },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  regionPicker: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border.subtle,
    marginLeft: Spacing.xxl + Spacing.xl,
  },
});
