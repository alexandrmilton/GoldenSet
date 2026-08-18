import { StyleSheet, Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { Colors, Type } from '@/theme/tokens';

type Variant = keyof typeof Type;
type Tone = 'primary' | 'secondary' | 'tertiary' | 'gold' | 'onClay' | 'up' | 'down';

const tones: Record<Tone, string> = {
  primary: Colors.text.primary,
  secondary: Colors.text.secondary,
  tertiary: Colors.text.tertiary,
  onClay: Colors.text.onClay,
  gold: Colors.gold,
  up: Colors.delta.up,
  down: Colors.delta.down,
};

export type TextProps = RNTextProps & {
  variant?: Variant;
  tone?: Tone;
};

export function Text({ variant = 'body', tone = 'primary', style, ...rest }: TextProps) {
  return <RNText style={[Type[variant], { color: tones[tone] }, style]} {...rest} />;
}

export const textStyles = StyleSheet.create({
  center: { textAlign: 'center' },
});
