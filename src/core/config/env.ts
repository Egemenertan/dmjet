/**
 * Environment Configuration
 * Loads environment variables from Expo Constants
 */

import Constants from 'expo-constants';

// Expo Constants'tan environment değişkenlerini al
// NOT: React Native'de process.env çalışmaz, sadece Expo Constants kullanılır
const expoConfig = Constants.expoConfig;
const extra = expoConfig?.extra || {};

// Helper function to safely get string values (trim whitespace and check for empty)
const getEnvValue = (value: string | undefined | null): string => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed === '' ? '' : trimmed;
};

export const env = {
  supabase: {
    url: getEnvValue(extra.supabaseUrl as string | undefined),
    anonKey: getEnvValue(extra.supabaseAnonKey as string | undefined),
  },
  googleMaps: {
    apiKey: getEnvValue(extra.googleMapsApiKey as string | undefined),
  },
  sentry: {
    dsn: getEnvValue(extra.sentryDsn as string | undefined),
  },
} as const;

// Validation: Ensure required environment variables are set
const isValidUrl = (url: string) => {
  if (!url || url.trim() === '') return false;
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

// Debug: Log configuration status (only in development)
if (__DEV__) {
  console.log('🔍 Environment Configuration Check:', {
    hasSupabaseUrl: !!env.supabase.url,
    hasSupabaseKey: !!env.supabase.anonKey,
    urlLength: env.supabase.url.length,
    keyLength: env.supabase.anonKey.length,
    extraKeys: Object.keys(extra),
  });
}

if (!env.supabase.url || !env.supabase.anonKey) {
  const errorMsg = `❌ CRITICAL: Missing required Supabase configuration!
  
  Configuration Status:
  - SUPABASE_URL: ${env.supabase.url ? `✅ Set (${env.supabase.url.length} chars)` : '❌ MISSING or EMPTY'}
  - SUPABASE_ANON_KEY: ${env.supabase.anonKey ? `✅ Set (${env.supabase.anonKey.length} chars)` : '❌ MISSING or EMPTY'}
  
  Debug Info:
  - Constants.expoConfig exists: ${!!Constants.expoConfig}
  - Constants.expoConfig?.extra exists: ${!!Constants.expoConfig?.extra}
  - extra keys: ${Object.keys(extra).join(', ') || 'NONE'}
  - extra.supabaseUrl type: ${typeof extra.supabaseUrl}
  - extra.supabaseUrl value: "${String(extra.supabaseUrl).substring(0, 50)}..."
  - extra.supabaseAnonKey type: ${typeof extra.supabaseAnonKey}
  
  Solution:
  1. Check EAS Secrets: eas secret:list
  2. Add missing secrets:
     eas secret:create --scope project --name SUPABASE_URL --value https://your-project.supabase.co
     eas secret:create --scope project --name SUPABASE_ANON_KEY --value your-anon-key
  3. Verify eas.json env section references secrets correctly
  4. Rebuild: eas build --platform android --profile production --clear-cache
  
  Full extra object: ${JSON.stringify(extra, null, 2)}`;
  
  console.error(errorMsg);
  throw new Error('Missing required Supabase configuration. Check console for details.');
}

// Validate URL format
if (!isValidUrl(env.supabase.url)) {
  const errorMsg = `❌ Invalid Supabase URL format!
  Current URL: "${env.supabase.url}"
  URL must be a valid HTTP or HTTPS URL (e.g., https://your-project.supabase.co)
  
  Please check:
  1. EAS Secret SUPABASE_URL value
  2. app.config.js extra.supabaseUrl value
  
  Extra values: ${JSON.stringify(extra, null, 2)}`;
  
  console.error(errorMsg);
  throw new Error(`Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL. Current value: "${env.supabase.url}"`);
}

if (!env.googleMaps.apiKey && __DEV__) {
  console.warn(
    '⚠️ Missing Google Maps API Key. Map features may not work properly.',
  );
}
