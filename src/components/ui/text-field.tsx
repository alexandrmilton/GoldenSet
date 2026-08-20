import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Colors, Radius, Spacing, Type } from '@/theme/tokens';

import { Text } from './text';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  /** Shown under the field when there is no error — hints, counters, formats. */
  hint?: string | null;
};

export function TextField({ label, error, hint, style, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text variant="label" tone="secondary">
        {label}
      </Text>

      <TextInput
        placeholderTextColor={Colors.text.tertiary}
        selectionColor={Colors.clay[300]}
        style={[styles.input, focused && styles.focused, !!error && styles.errored, style]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />

      {error ? (
        <Text variant="caption" tone="down">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="tertiary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  input: {
    ...Type.body,
    color: Colors.text.primary,
    backgroundColor: Colors.bg.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.subtle,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  focused: { borderColor: Colors.clay[500] },
  errored: { borderColor: Colors.delta.down },
});
