import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text, TextField } from '@/components/ui';
import { useSession } from '@/features/auth/session';
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
 * Seeding wizard, per docs/RATING.md §3.
 *
 * Basics, then the questionnaire read from the database, then the anchor, then
 * the rating the server decided. The rating is never computed here: the client
 * could simply claim a better one.
 */
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useSession();
  const { data: questions = [] } = useQuestionnaire();
  const updateProfile = useUpdateMyProfile(session?.user.id);
  const apply = useApplyOnboarding();

  const [index, setIndex] = useState(0);
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [anchorSearch, setAnchorSearch] = useState('');
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [anchorName, setAnchorName] = useState<string | null>(null);
  const [anchorOutcome, setAnchorOutcome] = useState<AnchorOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: candidates = [] } = useAnchorCandidates(anchorSearch);

  // basics + one screen per question + the anchor
  const total = questions.length + 2;
  const normalised = username.trim().toLowerCase();
  const usernameValid = USERNAME_SHAPE.test(normalised);
  const question = index > 0 && index <= questions.length ? questions[index - 1] : null;
  const onAnchorStep = index === questions.length + 1;

  const canAdvance = useMemo(() => {
    if (index === 0) return usernameValid;
    if (question) return Boolean(answers[question.key]);
    return true;
  }, [index, usernameValid, question, answers]);

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
      router.replace('/welcome');
    } catch (cause) {
      const code = (cause as { code?: string }).code;
      setError(code === '23505' ? t('onboarding.usernameTaken') : t('auth.errorGeneric'));
    }
  };

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
                {question.values.map((value) => {
                  const selected = answers[question.key] === value;
                  return (
                    <Pressable
                      key={value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => setAnswers((prev) => ({ ...prev, [question.key]: value }))}
                      style={[styles.option, selected && styles.optionSelected]}>
                      <Text variant="body" tone={selected ? 'onClay' : 'primary'}>
                        {t(`onboarding.opt.${question.key}.${value}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {onAnchorStep ? (
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

                {candidates.map((candidate) => {
                  const selected = anchorId === candidate.id;
                  return (
                    <Pressable
                      key={candidate.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => {
                        setAnchorId(candidate.id);
                        setAnchorName(candidate.username);
                      }}
                      style={[styles.option, selected && styles.optionSelected]}>
                      <Text variant="body" tone={selected ? 'onClay' : 'primary'}>
                        {candidate.username}
                      </Text>
                    </Pressable>
                  );
                })}

                {anchorId ? (
                  <View style={styles.block}>
                    <Text variant="label" tone="secondary">
                      {t('onboarding.anchor.outcome')}
                    </Text>
                    {OUTCOMES.map((outcome) => {
                      const selected = anchorOutcome === outcome;
                      return (
                        <Pressable
                          key={outcome}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          onPress={() => setAnchorOutcome(outcome)}
                          style={[styles.option, selected && styles.optionSelected]}>
                          <Text variant="body" tone={selected ? 'onClay' : 'primary'}>
                            {t(`onboarding.anchor.${outcome}`)}
                          </Text>
                        </Pressable>
                      );
                    })}
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

            {error ? (
              <Text variant="caption" tone="down">
                {error}
              </Text>
            ) : null}

            <View style={styles.actions}>
              {onAnchorStep ? (
                <Button
                  label={t('onboarding.finish')}
                  size="lg"
                  loading={apply.isPending || updateProfile.isPending}
                  onPress={submit}
                />
              ) : (
                <Button
                  label={t('onboarding.next')}
                  size="lg"
                  disabled={!canAdvance}
                  onPress={() => setIndex((i) => i + 1)}
                />
              )}

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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.base },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl, gap: Spacing.xl },
  header: { gap: Spacing.sm },
  progressTrack: { flexDirection: 'row', height: 3, borderRadius: Radius.pill, backgroundColor: Colors.bg.surface },
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
