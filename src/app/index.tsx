import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing, Type } from '@/theme/tokens';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <Text style={styles.appName}>{t('common.appName')}</Text>
          <Text style={styles.tagline}>{t('common.tagline')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('setup.phaseZero')}</Text>
          <Text style={styles.cardBody}>{t('setup.nextStep')}</Text>
          <Text style={styles.meta}>{t('setup.language', { lang: i18n.language })}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  safeArea: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.xxl },
  hero: { alignItems: 'center', gap: Spacing.sm },
  appName: { ...Type.display, color: Colors.gold },
  tagline: { ...Type.body, color: Colors.text.secondary },
  card: {
    backgroundColor: Colors.bg.surface,
    borderColor: Colors.border.subtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  cardTitle: { ...Type.heading, color: Colors.text.primary },
  cardBody: { ...Type.body, color: Colors.text.secondary },
  meta: { ...Type.caption, color: Colors.text.tertiary },
});
