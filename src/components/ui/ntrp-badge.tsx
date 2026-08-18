import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Colors, FontFamily, Radius } from '@/theme/tokens';

import { Text } from './text';

export type LevelScale = 'ntrp' | 'utr';

export type NtrpBadgeProps = {
  /** NTRP runs 1.0–7.0 in 0.5 steps; UTR runs 1–16.5. */
  value: number;
  scale?: LevelScale;
  size?: number;
  /** Confirmed by a coach or organiser — see docs/PLAN.md §5. */
  verified?: boolean;
};

function format(value: number, scale: LevelScale) {
  return scale === 'ntrp' ? value.toFixed(1) : value.toFixed(1).replace(/\.0$/, '');
}

/**
 * The rating badge from the design reference: a tennis ball with its seam,
 * carrying the player's level. Shows whichever scale the player uses.
 */
export function NtrpBadge({ value, scale = 'ntrp', size = 44, verified = false }: NtrpBadgeProps) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx={50} cy={50} r={49} fill={Colors.ball[500]} />
        <Path
          d="M 11 14 Q 36 50 11 86"
          stroke={Colors.text.primary}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M 89 14 Q 64 50 89 86"
          stroke={Colors.text.primary}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.valueLayer} pointerEvents="none">
        <Text style={[styles.value, { fontSize: size * 0.34 }]}>{format(value, scale)}</Text>
      </View>
      {verified ? (
        <View style={[styles.tick, { width: size * 0.34, height: size * 0.34 }]}>
          <Ionicons name="checkmark" size={size * 0.22} color={Colors.text.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  valueLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontFamily: FontFamily.bold, color: Colors.bg.base },
  tick: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.wimbledon,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.bg.base,
  },
});
