/**
 * i18n — English is the source language, Ukrainian is the first localisation.
 *
 * Rule enforced in review: no literal user-facing string ever appears in a
 * component. Everything goes through `t('key')`. See docs/PLAN.md §11.
 */

import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import uk from './locales/uk.json';

export const resources = {
  en: { translation: en },
  uk: { translation: uk },
} as const;

export type AppLanguage = keyof typeof resources;

export const SUPPORTED_LANGUAGES = Object.keys(resources) as AppLanguage[];

/** Device language if we support it, English otherwise. */
export function resolveDeviceLanguage(): AppLanguage {
  const deviceCode = getLocales()[0]?.languageCode;
  return SUPPORTED_LANGUAGES.find((lang) => lang === deviceCode) ?? 'en';
}

// eslint-disable-next-line import/no-named-as-default-member -- i18next's default export is the instance
i18n.use(initReactI18next).init({
  resources,
  lng: resolveDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
