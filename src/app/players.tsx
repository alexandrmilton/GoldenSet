import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlayerCard } from '@/components/players/player-card';
import { Button, Chip, Sheet, Text, TextField } from '@/components/ui';
import { catalogLabel, useCatalog } from '@/features/equipment/queries';
import {
  activeFilterCount,
  emptyFilters,
  usePlayerCities,
  usePlayers,
  type PlayerFilterState,
  type SortKey,
} from '@/features/players/queries';
import type { PlayingHand, RatingStatus } from '@/lib/database.types';
import { Colors, Spacing } from '@/theme/tokens';

const SORTS: SortKey[] = ['level', 'points', 'active'];
const LEVELS = [2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0];
const AGE_BANDS: { key: string; min: number | null; max: number | null }[] = [
  { key: '18_25', min: 18, max: 25 },
  { key: '26_35', min: 26, max: 35 },
  { key: '36_45', min: 36, max: 45 },
  { key: '46_plus', min: 46, max: null },
];
const STATUSES: RatingStatus[] = ['seed', 'provisional', 'established', 'confirmed'];
const HANDS: PlayingHand[] = ['right', 'left'];

/** The player list, per docs/MODULES.md §2. */
export default function PlayersScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [filters, setFilters] = useState<PlayerFilterState>(emptyFilters);
  const [draft, setDraft] = useState<PlayerFilterState>(emptyFilters);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: players = [], isLoading } = usePlayers(filters);
  const { data: cities = [] } = usePlayerCities();
  const { data: balls = [] } = useCatalog('balls');

  const count = activeFilterCount(filters);
  const patch = (next: Partial<PlayerFilterState>) => setDraft((prev) => ({ ...prev, ...next }));
  const toggle = <T,>(current: T | null | undefined, value: T) => (current === value ? null : value);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text variant="title">{t('players.title')}</Text>

          <TextField
            label={t('players.searchPlaceholder')}
            value={filters.search ?? ''}
            onChangeText={(search) => setFilters((prev) => ({ ...prev, search }))}
            autoCapitalize="none"
          />

          <View style={styles.controls}>
            {SORTS.map((sort) => (
              <Chip
                key={sort}
                label={t(
                  sort === 'level'
                    ? 'players.sortLevel'
                    : sort === 'points'
                      ? 'players.sortPoints'
                      : 'players.sortActive',
                )}
                selected={(filters.sort ?? 'level') === sort}
                onPress={() => setFilters((prev) => ({ ...prev, sort }))}
              />
            ))}

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setDraft(filters);
                setSheetOpen(true);
              }}
              style={styles.filterButton}>
              <Ionicons name="options-outline" size={16} color={Colors.text.primary} />
              <Text variant="caption">
                {count > 0 ? t('players.filtersWith', { count }) : t('players.filters')}
              </Text>
            </Pressable>
          </View>

          {!isLoading ? (
            <Text variant="caption" tone="tertiary">
              {t('players.count', { count: players.length })}
            </Text>
          ) : null}
        </View>

        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PlayerCard player={item} onPress={() => router.push(`/player/${item.id}`)} />
          )}
          ListEmptyComponent={
            isLoading ? null : (
              <View style={styles.empty}>
                <Text variant="body" tone="secondary">
                  {t('players.empty')}
                </Text>
                <Text variant="caption" tone="tertiary">
                  {t('players.emptyHint')}
                </Text>
              </View>
            )
          }
        />
      </SafeAreaView>

      <Sheet visible={sheetOpen} title={t('players.filters')} onClose={() => setSheetOpen(false)}>
        <Group title={t('players.city')}>
          <Chip
            label={t('players.anyCity')}
            selected={!draft.city}
            onPress={() => patch({ city: null })}
          />
          {cities.map((entry) => (
            <Chip
              key={entry.city}
              label={`${entry.city} · ${entry.players}`}
              selected={draft.city === entry.city}
              onPress={() => patch({ city: toggle(draft.city, entry.city) })}
            />
          ))}
        </Group>

        <Group title={t('players.level')}>
          {LEVELS.map((level) => {
            const selected =
              draft.levelMin !== null &&
              draft.levelMin !== undefined &&
              draft.levelMax !== null &&
              draft.levelMax !== undefined &&
              level >= draft.levelMin &&
              level <= draft.levelMax;
            return (
              <Chip
                key={level}
                label={level.toFixed(1)}
                selected={selected}
                onPress={() =>
                  patch(
                    // Tap once for a single level, tap a second one to make a range.
                    draft.levelMin === null || draft.levelMin === undefined || draft.levelMax !== draft.levelMin
                      ? { levelMin: level, levelMax: level }
                      : {
                          levelMin: Math.min(draft.levelMin, level),
                          levelMax: Math.max(draft.levelMin, level),
                        },
                  )
                }
              />
            );
          })}
        </Group>

        <Group title={t('players.age')}>
          {AGE_BANDS.map((band) => (
            <Chip
              key={band.key}
              label={band.max ? `${band.min}–${band.max}` : `${band.min}+`}
              selected={draft.ageMin === band.min && draft.ageMax === band.max}
              onPress={() =>
                patch(
                  draft.ageMin === band.min
                    ? { ageMin: null, ageMax: null }
                    : { ageMin: band.min, ageMax: band.max },
                )
              }
            />
          ))}
        </Group>

        <Group title={t('players.gender')}>
          {(['male', 'female'] as const).map((gender) => (
            <Chip
              key={gender}
              label={t(`players.${gender}`)}
              selected={draft.gender === gender}
              onPress={() => patch({ gender: toggle(draft.gender, gender) })}
            />
          ))}
        </Group>

        <Group title={t('players.hand')}>
          {HANDS.map((hand) => (
            <Chip
              key={hand}
              label={t(`players.${hand}`)}
              selected={draft.hand === hand}
              onPress={() => patch({ hand: toggle(draft.hand, hand) })}
            />
          ))}
        </Group>

        <Group title={t('players.status')}>
          {STATUSES.map((status) => {
            const selected = draft.statuses?.includes(status) ?? false;
            return (
              <Chip
                key={status}
                label={t(`ratingStatus.${status}`)}
                selected={selected}
                onPress={() =>
                  patch({
                    statuses: selected
                      ? (draft.statuses ?? []).filter((value) => value !== status)
                      : [...(draft.statuses ?? []), status],
                  })
                }
              />
            );
          })}
        </Group>

        <Group title={t('players.balls')}>
          {balls.map((item) => (
            <Chip
              key={item.id}
              label={catalogLabel(item)}
              selected={draft.ballsId === item.id}
              onPress={() => patch({ ballsId: toggle(draft.ballsId, item.id) })}
            />
          ))}
        </Group>

        <Button
          label={t('players.apply')}
          onPress={() => {
            setFilters({ ...draft, search: filters.search, sort: filters.sort });
            setSheetOpen(false);
          }}
        />
        <Button
          label={t('players.reset')}
          variant="ghost"
          onPress={() => setDraft({ ...emptyFilters, search: filters.search, sort: filters.sort })}
        />
      </Sheet>
    </View>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text variant="label" tone="tertiary">
        {title}
      </Text>
      <View style={styles.groupBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.base },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.md },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 999,
    backgroundColor: Colors.bg.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.subtle,
  },
  list: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxxl },
  empty: { alignItems: 'center', gap: Spacing.xs, paddingTop: Spacing.xxl },
  group: { gap: Spacing.sm },
  groupBody: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
