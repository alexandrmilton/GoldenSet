import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/theme/tokens';

const ball = require('@/assets/images/ball.png');

export type NavKey = 'home' | 'search' | 'messages' | 'menu';

export type BottomNavProps = {
  active: NavKey;
  labels: Record<NavKey, string>;
  composeLabel: string;
  onSelect: (key: NavKey) => void;
  onCompose: () => void;
};

const icons: Record<NavKey, keyof typeof Ionicons.glyphMap> = {
  home: 'home',
  search: 'search',
  messages: 'chatbubble-ellipses-outline',
  menu: 'menu',
};

/** Five slots with the ball in the middle, as in the reference. */
export function BottomNav({ active, labels, composeLabel, onSelect, onCompose }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const render = (key: NavKey) => {
    const isActive = key === active;
    return (
      <Pressable
        key={key}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        onPress={() => onSelect(key)}
        style={styles.slot}>
        <View style={isActive ? styles.activeIcon : undefined}>
          <Ionicons
            name={icons[key]}
            size={22}
            color={isActive ? Colors.text.onClay : Colors.text.secondary}
          />
        </View>
        <Text variant="label" tone={isActive ? 'primary' : 'secondary'} numberOfLines={1}>
          {labels[key]}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom || Spacing.sm }]}>
      {render('home')}
      {render('search')}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={composeLabel}
        onPress={onCompose}
        style={({ pressed }) => [styles.compose, pressed && styles.composePressed]}>
        <Image source={ball} style={styles.composeBall} contentFit="contain" />
      </Pressable>

      {render('messages')}
      {render('menu')}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.bg.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.subtle,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  slot: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: Spacing.xs },
  activeIcon: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.clay[500],
  },
  compose: {
    width: 62,
    height: 62,
    borderRadius: Radius.pill,
    backgroundColor: Colors.clay[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    marginHorizontal: Spacing.xs,
    borderWidth: 3,
    borderColor: Colors.bg.base,
  },
  composePressed: { backgroundColor: Colors.clay[600] },
  composeBall: { width: 38, height: 38 },
});
