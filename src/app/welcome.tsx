import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/brand/logo';
import { Button, LevelBadge, Text } from '@/components/ui';
import { useSession } from '@/features/auth/session';
import { useMyProfile } from '@/features/profile/queries';
import { Colors, Spacing } from '@/theme/tokens';

/**
 * The starting rating, on its own screen.
 *
 * It lives outside /onboarding on purpose: the moment the questionnaire is
 * applied the profile is complete, and the route guard would bounce a result
 * shown inside onboarding straight to the home screen — so the player would
 * never see the number the questionnaire produced, which is the whole payoff.
 */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useSession();
  const { data: profile } = useMyProfile(session?.user.id);

  if (!profile) return <View style={styles.screen} />;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <Logo size={26} />

        <View style={styles.middle}>
          <Text variant="label" tone="tertiary">
            {t('onboarding.result.title')}
          </Text>

          <LevelBadge
            value={profile.seed_level ?? 0}
            status="seed"
            size="lg"
            points={profile.seed_points ?? undefined}
          />

          <Text variant="body" tone="secondary" style={styles.centered}>
            {profile.seed_method === 'anchor'
              ? t('onboarding.result.assignedAnchor')
              : t('onboarding.result.assigned')}
          </Text>

          <Text variant="caption" tone="tertiary" style={styles.centered}>
            {t('onboarding.result.explain')}
          </Text>
        </View>

        <Button label={t('onboarding.result.start')} size="lg" onPress={() => router.replace('/')} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.base },
  safeArea: { flex: 1, alignItems: 'center', padding: Spacing.xl, gap: Spacing.xl },
  middle: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.lg },
  centered: { textAlign: 'center' },
});
