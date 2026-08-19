import { Ionicons } from '@expo/vector-icons';
import { Image, ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/brand/logo';
import { Avatar, Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/theme/tokens';

const clay = require('@/assets/images/hero-clay.jpg');
const ball = require('@/assets/images/ball.png');

export type HeroProps = {
  tagline: string;
  playerName: string;
  avatarUri?: string | null;
  unreadCount?: number;
  onPressNotifications?: () => void;
  onPressProfile?: () => void;
};

/** The clay-court header from the design reference. */
export function Hero({
  tagline,
  playerName,
  avatarUri,
  unreadCount = 0,
  onPressNotifications,
  onPressProfile,
}: HeroProps) {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground source={clay} style={styles.container} contentFit="cover">
      <LinearGradient
        // Dark at the top so the logo reads, clear in the middle so the court
        // shows, dark again at the bottom so the content below joins seamlessly.
        colors={['rgba(20,16,13,0.92)', 'rgba(20,16,13,0.35)', Colors.bg.base]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Image source={ball} style={styles.ball} contentFit="contain" />

      <View style={[styles.content, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.topRow}>
          <View style={styles.brand}>
            <Logo size={28} />
            <Text variant="caption" tone="secondary">
              {tagline}
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onPressNotifications}
              style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={22} color={Colors.text.primary} />
              {unreadCount > 0 ? (
                <View style={styles.badge}>
                  <Text variant="label" tone="onClay">
                    {String(unreadCount)}
                  </Text>
                </View>
              ) : null}
            </Pressable>

            <Pressable accessibilityRole="button" onPress={onPressProfile}>
              <Avatar name={playerName} uri={avatarUri} size={42} ring={Colors.border.subtle} />
            </Pressable>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // overflow:hidden matters on iOS — the ball deliberately runs past the right
  // edge, and iOS does not clip children by default the way Android does.
  container: { height: 240, justifyContent: 'flex-start', overflow: 'hidden' },
  content: { paddingHorizontal: Spacing.lg },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  brand: { gap: Spacing.xs, flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(44,35,28,0.75)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.subtle,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.clay[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.bg.base,
  },
  ball: {
    position: 'absolute',
    right: -18,
    top: 74,
    width: 168,
    height: 168,
  },
});
