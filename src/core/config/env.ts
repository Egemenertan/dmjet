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
    apiKey: extra.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY || '',
  },
} as const;

// Validation: Ensure required environment variables are set
if (!env.supabase.url || !env.supabase.anonKey) {
  console.error('❌ Missing required Supabase configuration. Please check your environment variables.');
}

if (!env.googleMaps.apiKey) {
  console.warn('⚠️ Missing Google Maps API Key. Map features may not work properly.');
}

