import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Colors, FontFamily, Radius } from '@/theme/tokens';

import { Text } from './text';

export type AvatarProps = {
  /** Display name — first letters become the fallback when there is no photo. */
  name: string;
  uri?: string | null;
  size?: number;
  /** Ring colour, e.g. gold for the leader. */
  ring?: string;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function Avatar({ name, uri, size = 44, ring }: AvatarProps) {
  const ringWidth = ring ? 2 : 0;
  const inner = size - ringWidth * 2;

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: Radius.pill,
          borderWidth: ringWidth,
          borderColor: ring ?? 'transparent',
        },
      ]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: inner, height: inner, borderRadius: Radius.pill }}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: inner, height: inner, borderRadius: Radius.pill },
          ]}>
          <Text style={[styles.initials, { fontSize: inner * 0.36 }]}>{initials(name)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { alignItems: 'center', justifyContent: 'center' },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.elevated,
  },
  initials: { fontFamily: FontFamily.semibold, color: Colors.text.secondary },
});
