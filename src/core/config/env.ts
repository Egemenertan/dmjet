/**
 * Environment Configuration
 * Loads environment variables from Expo Constants
 */

import Constants from 'expo-constants';

// Expo Go için environment değişkenleri
const expoConfig = Constants.expoConfig;
const extra = expoConfig?.extra || {};

export const env = {
  supabase: {
    url: extra.supabaseUrl || process.env.SUPABASE_URL || '',
    anonKey: extra.supabaseAnonKey || process.env.SUPABASE_ANON_KEY || '',
  },
  googleMaps: {
    apiKey: extra.googleMapsApiKey || 'AIzaSyCoKcbCK4QJlK2E9_ETtIO4JBn-39MUJxc',
  },
} as const;

