import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Chip, Text, TextField } from '@/components/ui';
import { useSession } from '@/features/auth/session';
import { useCreateChallenge, useForecast } from '@/features/games/queries';
import { usePlayer } from '@/features/players/queries';
import type { BallsMode, GameFormat, GameKind } from '@/lib/database.types';
import { Colors, Spacing } from '@/theme/tokens';

const FORMATS: GameFormat[] = ['best_of_3', 'pro_set_9', 'single_set', 'best_of_5'];
const BALLS: BallsMode[] = ['mine', 'yours', 'agreed'];
const HOURS = [8, 10, 12, 14, 16, 18, 20];

/** Challenge screen, per docs/MODULES.md §3. */
export default function ChallengeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const { data: opponent } = usePlayer(id);

  const [kind, setKind] = useState<GameKind>('rated');
  const [format, setFormat] = useState<GameFormat>('best_of_3');
  const [ballsMode, setBallsMode] = useState<BallsMode>('agreed');
  const [dayOffset, setDayOffset] = useState(1);
  const [hour, setHour] = useState(18);
  const [courtNote, setCourtNote] = useState('');
  const [message, setMessage] = useState('');

  const { data: forecast = [] } = useForecast(id, kind);
  const create = useCreateChallenge(session?.user.id);

  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + dayOffset);
  startsAt.setHours(hour, 0, 0, 0);

  const name = opponent?.profile?.username ?? '';

  const send = async () => {
    await create.mutateAsync({
      opponentId: id,
      kind,
      format,
      startsAt,
      durationMin: 90,
      courtNote: courtNote.trim() || null,
      ballsMode,
      message: message.trim() || null,
      forecast,
    });
    router.replace('/games');
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text variant="title">{t('games.challengeTitle', { name })}</Text>

            <Group title={t('games.kind')} hint={t('games.kindHint')}>
              {(['rated', 'friendly'] as GameKind[]).map((value) => (
                <Chip
                  key={value}
                  label={t(`games.${value}`)}
                  selected={kind === value}
                  onPress={() => setKind(value)}
                />
              ))}
            </Group>

            <Card style={styles.forecast}>
              <Text variant="label" tone="tertiary">
                {t('games.forecast')}
              </Text>

              {kind === 'friendly' ? (
                <Text variant="body" tone="secondary">
                  {t('games.friendlyForecast')}
                </Text>
              ) : (
                <>
                  {forecast.map((row) => (
                    <View key={row.scenario} style={styles.forecastRow}>
                      <Text variant="body">{t(`games.${row.scenario}`)}</Text>
                      <View style={styles.deltas}>
                        <Text
                          variant="numericSmall"
                          tone={row.delta_self >= 0 ? 'up' : 'down'}>
                          {formatDelta(row.delta_self)}
                        </Text>
                        <Text variant="caption" tone="tertiary">
                          {formatDelta(row.delta_opponent)}
                        </Text>
                      </View>
                    </View>
                  ))}
                  <Text variant="caption" tone="tertiary">
                    {t('games.forecastHint')}
                  </Text>
                </>
              )}
            </Card>

            <Group title={t('games.format')}>
              {FORMATS.map((value) => (
                <Chip
                  key={value}
                  label={t(`games.${value}`)}
                  selected={format === value}
                  onPress={() => setFormat(value)}
                />
              ))}
            </Group>

            <Group title={t('games.when')}>
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const day = new Date();
                day.setDate(day.getDate() + offset);
                return (
                  <Chip
                    key={offset}
                    label={day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                    selected={dayOffset === offset}
                    onPress={() => setDayOffset(offset)}
                  />
                );
              })}
            </Group>

            <Group title={''}>
              {HOURS.map((value) => (
                <Chip
                  key={value}
                  label={`${value}:00`}
                  selected={hour === value}
                  onPress={() => setHour(value)}
                />
              ))}
            </Group>

            <Group title={t('games.balls')}>
              {BALLS.map((value) => (
                <Chip
                  key={value}
                  label={t(`games.${value}`)}
                  selected={ballsMode === value}
                  onPress={() => setBallsMode(value)}
                />
              ))}
            </Group>

            <TextField
              label={t('games.court')}
              value={courtNote}
              onChangeText={setCourtNote}
              placeholder={t('games.courtPlaceholder')}
            />

            <TextField label={t('games.message')} value={message} onChangeText={setMessage} />

            <Button
              label={t('games.send')}
              size="lg"
              loading={create.isPending}
              onPress={send}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function formatDelta(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.group}>
      {title ? (
        <Text variant="label" tone="tertiary">
          {title}
        </Text>
      ) : null}
      <View style={styles.groupBody}>{children}</View>
      {hint ? (
        <Text variant="caption" tone="tertiary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.base },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: Spacing.xxxl },
  group: { gap: Spacing.sm },
  groupBody: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  forecast: { gap: Spacing.sm },
  forecastRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deltas: { alignItems: 'flex-end' },
});
