import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/theme/tokens';

const ball = require('@/assets/images/ball.png');

export type TournamentBannerProps = {
  label: string;
  name: string;
  meta: string;
  onPress?: () => void;
};

/** The clay card at the bottom of the reference screen. */
export function TournamentBanner({ label, name, meta, onPress }: TournamentBannerProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.ballWell}>
        <Image source={ball} style={styles.ball} contentFit="contain" />
      </View>

      <View style={styles.copy}>
        <Text variant="heading" tone="onClay">
          {label}
        </Text>
        <Text variant="body" tone="onClay">
          {name}
        </Text>
        <Text variant="caption" tone="onClay" style={styles.meta}>
          {meta}
        </Text>
      </View>

      <View style={styles.arrow}>
        <Ionicons name="arrow-forward" size={20} color={Colors.text.onClay} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.clay[500],
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  pressed: { backgroundColor: Colors.clay[600] },
  ballWell: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    backgroundColor: Colors.clay[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  ball: { width: 46, height: 46 },
  copy: { flex: 1, gap: 2 },
  meta: { opacity: 0.85 },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.clay[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
