import {
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_700Bold,
  useFonts,
} from '@expo-google-fonts/inter-tight';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import '@/i18n';
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

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
    InterTight_700Bold,
  });

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
    <ThemeProvider value={goldenSetTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
