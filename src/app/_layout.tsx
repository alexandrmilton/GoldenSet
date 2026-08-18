import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import '@/i18n';
import { Colors } from '@/theme/tokens';

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
  return (
    <ThemeProvider value={goldenSetTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
