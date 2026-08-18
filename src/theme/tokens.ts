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

import type { TextStyle } from 'react-native';

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

export const FontFamily = {
  regular: 'InterTight_400Regular',
  medium: 'InterTight_500Medium',
  semibold: 'InterTight_600SemiBold',
  bold: 'InterTight_700Bold',
} as const;

/**
 * Type scale. Weight comes from the font family, not `fontWeight` — with a
 * custom font, `fontWeight` is silently ignored on Android.
 */
export const Type = {
  display: { fontFamily: FontFamily.bold, fontSize: 34, letterSpacing: -0.6 },
  title: { fontFamily: FontFamily.bold, fontSize: 24, letterSpacing: -0.4 },
  heading: { fontFamily: FontFamily.semibold, fontSize: 18, letterSpacing: -0.2 },
  body: { fontFamily: FontFamily.regular, fontSize: 16 },
  bodyStrong: { fontFamily: FontFamily.semibold, fontSize: 16 },
  caption: { fontFamily: FontFamily.regular, fontSize: 13 },
  label: { fontFamily: FontFamily.medium, fontSize: 12, letterSpacing: 0.2 },
  /** Rating figures — tabular so the column never jitters as numbers change */
  numeric: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    fontVariant: ['tabular-nums'],
  },
  numericSmall: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
} satisfies Record<string, TextStyle>;
