/**
 * Golden Set — design tokens.
 *
 * Single source of truth for colour, spacing, radius and type.
 * Rule: screens and components never hardcode a colour or a pixel value —
 * they always read it from here. See docs/PLAN.md §3.
 *
 * Palette is derived from the design reference: docs/reference/design-reference-home.jpg
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  /** Surfaces, darkest to lightest */
  bg: {
    base: '#14100D',
    surface: '#221B16',
    elevated: '#2C231C',
  },
  border: {
    subtle: '#3A2F26',
  },
  /** Clay court — primary accent (Roland Garros) */
  clay: {
    300: '#D98060',
    500: '#C05A32',
    600: '#A84A28',
  },
  /** Tennis ball — action accent */
  ball: {
    300: '#DDE87A',
    500: '#C9D94A',
  },
  /** Brand + rating */
  gold: '#E8C878',
  delta: {
    up: '#6FCF6F',
    down: '#E06B5A',
  },
  /** Reserved: one court surface per section (see PLAN §3) */
  wimbledon: '#2E6B4F',
  usopen: '#2B6CB0',
  text: {
    primary: '#F5F0EA',
    secondary: '#A99C90',
    tertiary: '#6E625A',
    onClay: '#FFF6F1',
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const Type = {
  display: { fontSize: 34, fontWeight: '700', letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  heading: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '400' },
  /** Rating figures — tabular so the column never jitters */
  numeric: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
} as const;
