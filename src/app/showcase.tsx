import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Avatar,
  Button,
  Card,
  ListRow,
  LevelBadge,
  SegmentedControl,
  Sheet,
  Text,
  type SegmentedOption,
} from '@/components/ui';
import { Colors, Radius, Spacing } from '@/theme/tokens';

type Section = 'rating' | 'tournaments' | 'calendar' | 'profile';

/** Placeholder figure from the design reference. */
const SAMPLE_POINTS = '2487';

/**
 * Component gallery — the deliverable of Phase 1. Every part the real screens
 * are made of, in one place, so we can judge the system before building with it.
 * Replaced by the real home screen in Phase 2.
 */
export default function ShowcaseScreen() {
  const { t } = useTranslation();
  const [section, setSection] = useState<Section>('rating');
  const [sheetOpen, setSheetOpen] = useState(false);

  const sections: SegmentedOption<Section>[] = [
    { value: 'rating', label: t('rating.tab'), icon: 'trophy-outline' },
    { value: 'tournaments', label: t('tournaments.tab'), icon: 'tennisball-outline' },
    { value: 'calendar', label: t('calendar.tab'), icon: 'calendar-outline' },
    { value: 'profile', label: t('profile.tab'), icon: 'person-outline' },
  ];

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text variant="display" tone="gold">
              {t('common.appName')}
            </Text>
            <Text variant="caption" tone="secondary">
              {t('showcase.subtitle')}
            </Text>
          </View>

          <Block title={t('showcase.typography')}>
            <Text variant="display">{t('showcase.title')}</Text>
            <Text variant="title">{t('rating.title')}</Text>
            <Text variant="heading">{t('tournaments.next')}</Text>
            <Text variant="body" tone="secondary">
              {t('common.tagline')}
            </Text>
            <Text variant="numeric" tone="gold">
              {SAMPLE_POINTS}
            </Text>
          </Block>

          <Block title={t('showcase.segmented')}>
            <SegmentedControl options={sections} value={section} onChange={setSection} />
          </Block>

          <Block title={t('showcase.levelBadge')}>
            <View style={styles.badgeRow}>
              <Badge caption={t('showcase.selfDeclared')}>
                <LevelBadge value={4.5} status="seed" />
              </Badge>
              <Badge caption={t('showcase.verified')}>
                <LevelBadge value={5} status="confirmed" />
              </Badge>
              <Badge caption={t('showcase.utrScale')}>
                <LevelBadge value={4} status="established" />
              </Badge>
            </View>
          </Block>

          <Block title={t('showcase.buttons')}>
            <Button label={t('showcase.primary')} />
            <Button label={t('showcase.secondary')} variant="secondary" />
            <Button label={t('showcase.ghost')} variant="ghost" />
            <Button label={t('showcase.loading')} loading />
          </Block>

          <Block title={t('showcase.ratingList')}>
            <Card padded={false} style={styles.listCard}>
              <ListRow rank={1} name="Max Volyn" subtitle="Київ" points={2487} delta={24} highlighted />
              <View style={styles.divider} />
              <ListRow rank={2} name="Olya Serve" subtitle="Львів" points={2341} delta={18} />
              <View style={styles.divider} />
              <ListRow rank={3} name="Dmytro Ace" subtitle="Харків" points={2278} delta={-15} />
            </Card>
          </Block>

          <Block title={t('showcase.sheet')}>
            <Button label={t('showcase.openSheet')} variant="secondary" onPress={() => setSheetOpen(true)} />
          </Block>

          <Block title={t('showcase.palette')}>
            <View style={styles.swatches}>
              {[
                Colors.clay[500],
                Colors.ball[500],
                Colors.gold,
                Colors.wimbledon,
                Colors.usopen,
                Colors.bg.surface,
              ].map((color) => (
                <View key={color} style={[styles.swatch, { backgroundColor: color }]} />
              ))}
            </View>
          </Block>

          <View style={styles.avatars}>
            <Avatar name="Max Volyn" size={56} ring={Colors.gold} />
            <Avatar name="Olya Serve" size={44} />
            <Avatar name="Dmytro Ace" size={32} />
          </View>
        </ScrollView>
      </SafeAreaView>

      <Sheet visible={sheetOpen} title={t('showcase.sheetTitle')} onClose={() => setSheetOpen(false)}>
        <Button label={t('showcase.primary')} onPress={() => setSheetOpen(false)} />
        <Button label={t('showcase.secondary')} variant="secondary" onPress={() => setSheetOpen(false)} />
      </Sheet>
    </View>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.block}>
      <Text variant="label" tone="tertiary" style={styles.blockTitle}>
        {title.toUpperCase()}
      </Text>
      <View style={styles.blockBody}>{children}</View>
    </View>
  );
}

function Badge({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <View style={styles.badge}>
      {children}
      <Text variant="caption" tone="tertiary">
        {caption}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.base },
  safeArea: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.xxl, paddingBottom: Spacing.xxxl },
  header: { gap: Spacing.xs, paddingTop: Spacing.sm },
  block: { gap: Spacing.md },
  blockTitle: { letterSpacing: 1.2 },
  blockBody: { gap: Spacing.md },
  badgeRow: { flexDirection: 'row', gap: Spacing.xl },
  badge: { alignItems: 'center', gap: Spacing.sm },
  listCard: { paddingVertical: Spacing.xs },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border.subtle,
    marginLeft: Spacing.xxl + Spacing.xl,
  },
  swatches: { flexDirection: 'row', gap: Spacing.sm },
  swatch: { flex: 1, height: 48, borderRadius: Radius.md },
  avatars: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
});
