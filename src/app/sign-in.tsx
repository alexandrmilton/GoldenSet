import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/brand/logo';
import { Button, Text, TextField } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing } from '@/theme/tokens';

type Mode = 'signIn' | 'signUp';

export default function SignInScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);

    const credentials = { email: email.trim(), password };
    const { data, error: authError } =
      mode === 'signIn'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);

    setBusy(false);

    if (authError) {
      // Supabase messages are English-only and often technical; show ours.
      setError(authError.message || t('auth.errorGeneric'));
      return;
    }

    // Sign-up with email confirmation on returns a user but no session.
    if (mode === 'signUp' && !data.session) {
      setNotice(t('auth.checkInbox'));
      setMode('signIn');
    }
  };

  const isSignIn = mode === 'signIn';

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Logo size={30} />
              <Text variant="title">{isSignIn ? t('auth.signInTitle') : t('auth.signUpTitle')}</Text>
              <Text variant="body" tone="secondary">
                {t('auth.signInSubtitle')}
              </Text>
            </View>

            <View style={styles.form}>
              <TextField
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                inputMode="email"
                textContentType="emailAddress"
              />

              <TextField
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete={isSignIn ? 'current-password' : 'new-password'}
                textContentType={isSignIn ? 'password' : 'newPassword'}
                hint={isSignIn ? null : t('auth.passwordHint')}
                error={error}
              />

              {notice ? (
                <Text variant="caption" tone="up">
                  {notice}
                </Text>
              ) : null}

              <Button
                label={isSignIn ? t('auth.signIn') : t('auth.signUp')}
                size="lg"
                loading={busy}
                disabled={!email.trim() || password.length < 8}
                onPress={submit}
              />

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setMode(isSignIn ? 'signUp' : 'signIn');
                  setError(null);
                }}
                style={styles.switch}>
                <Text variant="caption" tone="secondary">
                  {isSignIn ? t('auth.toSignUp') : t('auth.toSignIn')}
                </Text>
              </Pressable>
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
  content: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl, gap: Spacing.xxl },
  header: { gap: Spacing.sm },
  form: { gap: Spacing.lg },
  switch: { alignItems: 'center', paddingVertical: Spacing.sm },
});
