import {
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_700Bold,
  useFonts,
} from '@expo-google-fonts/inter-tight';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { signOut, SessionProvider, useSession } from '@/features/auth/session';
import { needsOnboarding, useMyProfile } from '@/features/profile/queries';
import { restoreLanguage } from '@/i18n';
import { queryClient } from '@/lib/query';
import { Colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

const goldenSetTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.bg.base,
    card: Colors.bg.surface,
    border: Colors.border.subtle,
    text: Colors.text.primary,
    primary: Colors.clay[500],
  },
};

/**
 * Sends the user to the one screen that makes sense for their state:
 * signed out → sign-in, signed in but unconfigured → onboarding, otherwise the app.
 */
function AuthGate() {
  const { session, ready } = useSession();
  const { data: profile, isLoading, isSuccess } = useMyProfile(session?.user.id);
  const segments = useSegments();
  const router = useRouter();

  const route = segments[0];

  useEffect(() => {
    if (!ready) return;

    if (!session) {
      if (route !== 'sign-in') router.replace('/sign-in');
      return;
    }

    // A valid session whose profile is gone: the account was deleted while the
    // token lived on. Without this the gate waits forever and the app sits on
    // whatever screen it happened to render.
    if (isSuccess && profile === null) {
      signOut();
      return;
    }

    // Wait for the profile before deciding — otherwise we would bounce the user
    // through onboarding on every cold start.
    if (isLoading || !profile) return;

    if (needsOnboarding(profile)) {
      if (route !== 'onboarding') router.replace('/onboarding');
      return;
    }

    if (route === 'sign-in' || route === 'onboarding') router.replace('/');
  }, [ready, session, profile, isLoading, isSuccess, route, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
    InterTight_700Bold,
  });

  useEffect(() => {
    restoreLanguage();
  }, []);

  useEffect(() => {
    // Show the app once the type is ready — or anyway if the font failed, so a
    // font CDN problem can never leave the user staring at a splash screen.
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider value={goldenSetTheme}>
          <StatusBar style="light" />
          <AuthGate />
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
