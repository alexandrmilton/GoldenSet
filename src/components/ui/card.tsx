import { StyleSheet, View, type ViewProps } from 'react-native';

import { Colors, Radius, Spacing } from '@/theme/tokens';

export type CardProps = ViewProps & {
  /** `clay` is for the one card on screen that should pull the eye. */
  variant?: 'surface' | 'clay';
  padded?: boolean;
};

export function Card({ variant = 'surface', padded = true, style, ...rest }: CardProps) {
  return (
    <View
      style={[styles.base, styles[variant], padded && styles.padded, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  surface: {
    backgroundColor: Colors.bg.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.subtle,
  },
  clay: {
    backgroundColor: Colors.clay[500],
  },
  padded: {
    padding: Spacing.lg,
  },
});
