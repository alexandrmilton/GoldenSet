/**
 * Supabase client.
 *
 * The publishable key is safe to ship in the app bundle — every table is
 * protected by Row Level Security, so the key alone grants nothing. The
 * service role key must never appear in this project. See docs/PLAN.md §8.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

import type { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase env vars. Copy .env.example to .env and fill it in.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    // Native only. On web, AsyncStorage is a thin wrapper over
    // window.localStorage, and Expo prerenders web pages in Node where there is
    // no window — handing it to supabase-js crashes the render before the app
    // ever mounts. Left undefined, supabase-js picks storage itself and checks
    // for a browser first.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Only the web build can have a session handed to it in the URL, from an
    // email confirmation link.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
