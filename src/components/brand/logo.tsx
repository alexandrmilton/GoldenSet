import { StyleSheet, View } from 'react-native';

import { Colors, FontFamily } from '@/theme/tokens';

import { Text } from '../ui/text';

/** The brand name is never translated — it is the same mark in every language. */
const WORD_GOLD = 'GOLDEN';
const WORD_CREAM = 'SET';

export type LogoProps = {
  /** Cap height in points. */
  size?: number;
};

/**
 * The brand lockup: GOLDEN in gold, SET in cream.
 *
 * Laid out with real text rather than positioned SVG glyphs, so the two words
 * are measured by the font itself and can never collide.
 */
export function Logo({ size = 26 }: LogoProps) {
  const style = { fontFamily: FontFamily.bold, fontSize: size, letterSpacing: -size * 0.03 };

  return (
    <View style={styles.row}>
      <Text style={[style, styles.gold]}>{WORD_GOLD}</Text>
      <Text style={[style, styles.cream]}>{WORD_CREAM}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  gold: { color: Colors.gold },
  cream: { color: Colors.text.primary },
});
