import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Colors, Radius, Spacing } from '@/theme/tokens';

import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        styles[size],
        styles[variant],
        state.pressed && pressedStyles[variant],
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.text.onClay : Colors.text.primary} />
      ) : (
        <Text variant="bodyStrong" tone={variant === 'primary' ? 'onClay' : 'primary'}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, minHeight: 44 },
  lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl, minHeight: 52 },
  primary: { backgroundColor: Colors.clay[500] },
  secondary: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.subtle,
  },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.45 },
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: Colors.clay[600] },
  secondary: { backgroundColor: Colors.bg.surface },
  ghost: { opacity: 0.6 },
});
