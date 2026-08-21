import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text, TextField } from '@/components/ui';
import { useSession } from '@/features/auth/session';
import { catalogLabel, useCatalog, useSaveEquipment } from '@/features/equipment/queries';
import {
  useAnchorCandidates,
  useApplyOnboarding,
  useQuestionnaire,
  type AnchorOutcome,
} from '@/features/onboarding/queries';
import { useUpdateMyProfile } from '@/features/profile/queries';
import { Colors, Radius, Spacing } from '@/theme/tokens';

const USERNAME_SHAPE = /^[a-z0-9_]{3,20}$/;
const OUTCOMES: AnchorOutcome[] = ['i_win', 'even', 'they_win'];

/**
 * Seeding wizard, per docs/RATING.md §3 and docs/MODULES.md §1.
 *
 * Basics, the questionnaire read from the database, the anchor, then gear.
 * The rating is never computed here: the client could simply claim a better one.
 */
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useSession();
  const { data: questions = [] } = useQuestionnaire();
  const { data: racquets = [] } = useCatalog('racquet');
  const { data: balls = [] } = useCatalog('balls');
  const updateProfile = useUpdateMyProfile(session?.user.id);
  const saveEquipment = useSaveEquipment(session?.user.id);
  const apply = useApplyOnboarding();

  const [index, setIndex] = useState(0);
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [anchorSearch, setAnchorSearch] = useState('');
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [anchorName, setAnchorName] = useState<string | null>(null);
  const [anchorOutcome, setAnchorOutcome] = useState<AnchorOutcome | null>(null);
  const [racquetSearch, setRacquetSearch] = useState('');
  const [racquetId, setRacquetId] = useState<string | null>(null);
  const [racquetCustom, setRacquetCustom] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [stringModel, setStringModel] = useState('');
  const [tension, setTension] = useState('');
  const [ballsId, setBallsId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: candidates = [] } = useAnchorCandidates(anchorSearch);

  // basics + one screen per question + anchor + racquet + balls
  const total = questions.length + 4;
  const normalised = username.trim().toLowerCase();
  const usernameValid = USERNAME_SHAPE.test(normalised);
  const question = index > 0 && index <= questions.length ? questions[index - 1] : null;
  const onAnchor = index === questions.length + 1;
  const onRacquet = index === questions.length + 2;
  const onBalls = index === questions.length + 3;

  const filteredRacquets = useMemo(() => {
    const needle = racquetSearch.trim().toLowerCase();
    const list = needle
      ? racquets.filter((item) => catalogLabel(item).toLowerCase().includes(needle))
      : racquets;
    return list.slice(0, 8);
  }, [racquets, racquetSearch]);

  const canAdvance = index === 0 ? usernameValid : question ? Boolean(answers[question.key]) : true;

  const submit = async () => {
    setError(null);
    try {
      await updateProfile.mutateAsync({ username: normalised, city: city.trim() || null });
      await apply.mutateAsync({
        answers,
        questions,
        anchorId,
        anchorOutcome: anchorId ? (anchorOutcome ?? 'even') : null,
      });
      await saveEquipment.mutateAsync([
        {
          kind: 'racquet',
          catalogId: customMode ? null : racquetId,
          customName: customMode ? racquetCustom.trim() || null : null,
          stringModel: stringModel.trim() || null,
          tensionKg: tension ? Number(tension.replace(',', '.')) : null,
        },
        { kind: 'balls', catalogId: ballsId },
      ]);
      router.replace('/welcome');
    } catch (cause) {
      const code = (cause as { code?: string }).code;
      setError(code === '23505' ? t('onboarding.usernameTaken') : t('auth.errorGeneric'));
    }
  };

  const busy = apply.isPending || updateProfile.isPending || saveEquipment.isPending;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text variant="label" tone="tertiary">
                {t('onboarding.stepOf', { current: index + 1, total })}
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { flex: index + 1 }]} />
                <View style={{ flex: total - index - 1 }} />
              </View>
            </View>

            {index === 0 ? (
              <View style={styles.block}>
                <Text variant="title">{t('onboarding.title')}</Text>
                <Text variant="body" tone="secondary">
                  {t('onboarding.subtitle')}
                </Text>
                <TextField
                  label={t('onboarding.username')}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  hint={t('onboarding.usernameHint')}
                  error={username && !usernameValid ? t('onboarding.usernameInvalid') : null}
                />
                <TextField
                  label={t('onboarding.city')}
                  value={city}
                  onChangeText={setCity}
                  placeholder={t('onboarding.cityPlaceholder')}
                />
              </View>
            ) : null}

            {question ? (
              <View style={styles.block}>
                <Text variant="title">{t(`onboarding.q.${question.key}`)}</Text>
                {question.values.map((value) => (
                  <Option
                    key={value}
                    label={t(`onboarding.opt.${question.key}.${value}`)}
                    selected={answers[question.key] === value}
                    onPress={() => setAnswers((prev) => ({ ...prev, [question.key]: value }))}
                  />
                ))}
              </View>
            ) : null}

            {onAnchor ? (
              <View style={styles.block}>
                <Text variant="title">{t('onboarding.q.anchor')}</Text>
                <Text variant="caption" tone="secondary">
                  {t('onboarding.anchor.hint')}
                </Text>

                <TextField
                  label={t('onboarding.anchor.search')}
                  value={anchorSearch}
                  onChangeText={setAnchorSearch}
                  autoCapitalize="none"
                />

                {candidates.map((candidate) => (
                  <Option
                    key={candidate.id}
                    label={candidate.username}
                    selected={anchorId === candidate.id}
                    onPress={() => {
                      setAnchorId(candidate.id);
                      setAnchorName(candidate.username);
                    }}
                  />
                ))}

                {anchorId ? (
                  <View style={styles.block}>
                    <Text variant="label" tone="secondary">
                      {t('onboarding.anchor.outcome')}
                    </Text>
                    {OUTCOMES.map((outcome) => (
                      <Option
                        key={outcome}
                        label={t(`onboarding.anchor.${outcome}`)}
                        selected={anchorOutcome === outcome}
                        onPress={() => setAnchorOutcome(outcome)}
                      />
                    ))}
                    <Text variant="caption" tone="tertiary">
                      {t('onboarding.anchor.chosen', { name: anchorName })}
                    </Text>
                  </View>
                ) : (
                  <Text variant="caption" tone="tertiary">
                    {t('onboarding.anchor.none')}
                  </Text>
                )}
              </View>
            ) : null}

            {onRacquet ? (
              <View style={styles.block}>
                <Text variant="title">{t('onboarding.racquetTitle')}</Text>
                <Text variant="caption" tone="secondary">
                  {t('onboarding.racquetHint')}
                </Text>

                {customMode ? (
                  <TextField
                    label={t('onboarding.racquetCustom')}
                    value={racquetCustom}
                    onChangeText={setRacquetCustom}
                  />
                ) : (
                  <>
                    <TextField
                      label={t('onboarding.racquetSearch')}
                      value={racquetSearch}
                      onChangeText={setRacquetSearch}
                    />
                    {filteredRacquets.map((item) => (
                      <Option
                        key={item.id}
                        label={catalogLabel(item)}
                        selected={racquetId === item.id}
                        onPress={() => setRacquetId(item.id)}
                      />
                    ))}
                  </>
                )}

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setCustomMode((prev) => !prev);
                    setRacquetId(null);
                  }}>
                  <Text variant="caption" tone="secondary">
                    {t('onboarding.racquetOther')}
                  </Text>
                </Pressable>

                {/* Strings and tension are optional on purpose — see MODULES §1. */}
                <TextField
                  label={t('onboarding.strings')}
                  value={stringModel}
                  onChangeText={setStringModel}
                  placeholder={t('onboarding.stringsUnknown')}
                  hint={t('onboarding.optional')}
                />
                <TextField
                  label={t('onboarding.tension')}
                  value={tension}
                  onChangeText={setTension}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                />
              </View>
            ) : null}

            {onBalls ? (
              <View style={styles.block}>
                <Text variant="title">{t('onboarding.ballsTitle')}</Text>
                <Text variant="caption" tone="secondary">
                  {t('onboarding.ballsHint')}
                </Text>
                {balls.map((item) => (
                  <Option
                    key={item.id}
                    label={catalogLabel(item)}
                    selected={ballsId === item.id}
                    onPress={() => setBallsId(item.id)}
                  />
                ))}
              </View>
            ) : null}

            {error ? (
              <Text variant="caption" tone="down">
                {error}
              </Text>
            ) : null}

            <View style={styles.actions}>
              {onBalls ? (
                <Button label={t('onboarding.finish')} size="lg" loading={busy} onPress={submit} />
              ) : (
                <Button
                  label={t('onboarding.next')}
                  size="lg"
                  disabled={!canAdvance}
                  onPress={() => setIndex((i) => i + 1)}
                />
              )}

              {onRacquet || onAnchor ? (
                <Button
                  label={t('onboarding.skip')}
                  variant="ghost"
                  onPress={() => setIndex((i) => i + 1)}
                />
              ) : null}

              {index > 0 ? (
                <Button
                  label={t('onboarding.back')}
                  variant="ghost"
                  onPress={() => setIndex((i) => i - 1)}
                />
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Option({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}>
      <Text variant="body" tone={selected ? 'onClay' : 'primary'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.base },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl, gap: Spacing.xl },
  header: { gap: Spacing.sm },
  progressTrack: {
    flexDirection: 'row',
    height: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.bg.surface,
  },
  progressFill: { backgroundColor: Colors.clay[500], borderRadius: Radius.pill },
  block: { gap: Spacing.md },
  option: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.bg.surface,
  },
  optionSelected: { backgroundColor: Colors.clay[500], borderColor: Colors.clay[300] },
  actions: { gap: Spacing.sm },
});
