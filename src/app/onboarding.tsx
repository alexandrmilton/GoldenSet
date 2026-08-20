import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text, TextField } from '@/components/ui';
import { useSession } from '@/features/auth/session';
import { useUpdateMyProfile } from '@/features/profile/queries';
import { Colors, Radius, Spacing } from '@/theme/tokens';

const USERNAME_SHAPE = /^[a-z0-9_]{3,20}$/;

/**
 * The level calibrator. Players cannot reliably name their own NTRP number, but
 * they can recognise a description of how they play — so we ask that and map it.
 */
const LEVELS = [
  { value: 3.0, key: 'level30' },
  { value: 3.5, key: 'level35' },
  { value: 4.0, key: 'level40' },
  { value: 4.5, key: 'level45' },
  { value: 5.0, key: 'level50' },
] as const;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { session } = useSession();
  const update = useUpdateMyProfile(session?.user.id);

  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [level, setLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalised = username.trim().toLowerCase();
  const usernameValid = USERNAME_SHAPE.test(normalised);

  const submit = async () => {
    setError(null);
    try {
      await update.mutateAsync({
        username: normalised,
        city: city.trim() || null,
        level_scale: 'ntrp',
        level_value: level,
      });
    } catch (cause) {
      // 23505 is the unique violation on username — the one error a player can fix.
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
              <Text variant="title">{t('onboarding.title')}</Text>
              <Text variant="body" tone="secondary">
                {t('onboarding.subtitle')}
              </Text>
            </View>

            <TextField
              label={t('onboarding.username')}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              hint={t('onboarding.usernameHint')}
              error={error ?? (username && !usernameValid ? t('onboarding.usernameInvalid') : null)}
            />

            <TextField
              label={t('onboarding.city')}
              value={city}
              onChangeText={setCity}
              placeholder={t('onboarding.cityPlaceholder')}
            />

            <View style={styles.levels}>
              <Text variant="label" tone="secondary">
                {t('onboarding.levelTitle')}
              </Text>

              {LEVELS.map((option) => {
                const selected = level === option.value;
                return (
                  <Pressable
                    key={option.key}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setLevel(option.value)}
                    style={[styles.level, selected && styles.levelSelected]}>
                    <Text variant="numericSmall" tone={selected ? 'onClay' : 'gold'}>
                      {option.value.toFixed(1)}
                    </Text>
                    <Text
                      variant="body"
                      tone={selected ? 'onClay' : 'primary'}
                      style={styles.levelLabel}>
                      {t(`onboarding.${option.key}`)}
                    </Text>
                  </Pressable>
                );
              })}

              <Text variant="caption" tone="tertiary">
                {t('onboarding.levelHint')}
              </Text>
            </View>

            <Button
              label={t('onboarding.finish')}
              size="lg"
              loading={update.isPending}
              disabled={!usernameValid || level === null}
              onPress={submit}
            />
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
  content: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl, gap: Spacing.lg },
  header: { gap: Spacing.xs },
  levels: { gap: Spacing.sm },
  level: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.bg.surface,
  },
  levelSelected: { backgroundColor: Colors.clay[500], borderColor: Colors.clay[300] },
  levelLabel: { flex: 1 },
});
