/**
 * Expo App Configuration
 * Uses environment variables for sensitive data
 */

// Load environment variables from .env file (for local development)
// In EAS build, environment variables are already loaded from secrets
try {
require('dotenv').config();
} catch (e) {
  console.log('dotenv not available, using process.env directly');
}

// Helper function to get environment variable with fallback
const getEnvVar = (key, defaultValue = '') => {
  const value = process.env[key] || defaultValue;
  // Debug log in EAS build
  if (process.env.EAS_BUILD === 'true') {
    console.log(`[EAS Build] ${key}: ${value ? `SET (${value.length} chars)` : 'MISSING'}`);
  }
  return value;
};

// Validate required environment variables
const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

// Trim whitespace and check if values are actually set (not empty strings)
const isValidEnvValue = (value) => {
  return value && typeof value === 'string' && value.trim().length > 0;
};

const hasValidSupabaseUrl = isValidEnvValue(supabaseUrl);
const hasValidSupabaseKey = isValidEnvValue(supabaseAnonKey);

// Log environment variables for debugging (only keys, not values)
const envStatus = {
  SUPABASE_URL: hasValidSupabaseUrl ? `✅ Set (${supabaseUrl.trim().length} chars)` : '❌ Missing or Empty',
  SUPABASE_ANON_KEY: hasValidSupabaseKey ? `✅ Set (${supabaseAnonKey.trim().length} chars)` : '❌ Missing or Empty',
  GOOGLE_MAPS_API_KEY: getEnvVar('GOOGLE_MAPS_API_KEY') ? '✅ Set' : '❌ Missing',
  GOOGLE_MAPS_API_KEY_ANDROID: getEnvVar('GOOGLE_MAPS_API_KEY_ANDROID') ? '✅ Set' : '❌ Missing',
  GOOGLE_MAPS_API_KEY_IOS: getEnvVar('GOOGLE_MAPS_API_KEY_IOS') ? '✅ Set' : '❌ Missing',
  SENTRY_DSN: getEnvVar('SENTRY_DSN') ? '✅ Set' : '❌ Missing',
};

console.log('🔧 Building with environment variables:', envStatus);

// Validate critical environment variables
if (!hasValidSupabaseUrl || !hasValidSupabaseKey) {
  const missing = [];
  if (!hasValidSupabaseUrl) missing.push('SUPABASE_URL');
  if (!hasValidSupabaseKey) missing.push('SUPABASE_ANON_KEY');
  
  const errorMessage = `\n❌ CRITICAL: Missing or empty required environment variables: ${missing.join(', ')}\n\n` +
    `Current values:\n` +
    `- SUPABASE_URL: "${supabaseUrl || '(undefined)'}" (${supabaseUrl?.length || 0} chars)\n` +
    `- SUPABASE_ANON_KEY: "${supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : '(undefined)'}" (${supabaseAnonKey?.length || 0} chars)\n\n` +
    `Please ensure these are set:\n` +
    `1. Check EAS Secrets: eas secret:list\n` +
    `2. Add missing secrets:\n` +
    `   eas secret:create --scope project --name SUPABASE_URL --value https://your-project.supabase.co\n` +
    `   eas secret:create --scope project --name SUPABASE_ANON_KEY --value your-anon-key\n` +
    `3. Verify eas.json env section uses @env:SUPABASE_URL format\n` +
    `4. Rebuild with: eas build --platform android --profile production\n\n` +
    `⚠️  Build will FAIL at runtime if these are not properly configured!\n`;
  
  console.error(errorMessage);
  // EAS build sırasında hata fırlat (local development'ta sadece uyarı)
  if (process.env.EAS_BUILD === 'true' || process.env.EAS_BUILD_PROFILE) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Check build logs for details.`);
  } else {
    console.warn('⚠️  Warning: Supabase configuration is missing. App will crash at runtime!');
  }
}

export default {
  expo: {
    name: 'Dmarjet',
    slug: 'dmarjet',
    owner: 'egemenertan',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/dmicon.png',
    userInterfaceStyle: 'light',
    scheme: 'dmarjet',
    description:
      "Dmarjet - Kuzey Kıbrıs'ın en hızlı market teslimat uygulaması! İskele ve Trikomo bölgesinde günlük ihtiyaçlarınızı kapınıza kadar getiriyoruz. Taze gıdalar, temel ihtiyaçlar, içecekler ve daha fazlası. Hızlı teslimat, güvenli ödeme ve kolay kullanım. Siparişinizi verin, kapınızda olsun! 🛒✨",
    keywords: [
      'market',
      'teslimat',
      'alışveriş',
      'kuzey kıbrıs',
      'iskele',
      'trikomo',
      'grocery',
      'delivery',
      'online market',
      'hızlı teslimat',
      'kapıda teslimat',
      'gıda',
      'içecek',
      'temel ihtiyaç',
      'online shopping',
      'supermarket',
      'food delivery',
      'cyprus',
      'north cyprus',
    ],
    privacy: 'public',
    contentRating: {
      rating: '17+',
      advisories: ['Alcohol, Tobacco, Use or References'],
    },
    splash: {
      image: './assets/dmjet.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.dmarjet',
      subtitle: 'Hızlı Market Teslimatı',
      config: {
        usesNonExemptEncryption: false,
        googleMapsApiKey: getEnvVar('GOOGLE_MAPS_API_KEY_IOS') || getEnvVar('GOOGLE_MAPS_API_KEY'),
      },
      infoPlist: {
        NSCameraUsageDescription:
          'Bu uygulama profil fotoğrafı çekmek için kameraya erişim gerektirir.',
        NSPhotoLibraryUsageDescription:
          'Bu uygulama profil fotoğrafı seçmek için fotoğraf galerisine erişim gerektirir.',
        NSLocationWhenInUseUsageDescription:
          'Bu uygulama size yakın mağazaları göstermek ve teslimat konumunuzu belirlemek için konumunuza erişim gerektirir.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Bu uygulama teslimat konumunuzu belirlemek için konumunuza erişim gerektirir.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/dmicon.png',
        backgroundColor: '#5CB85C',
      },
      splash: {
        image: './assets/dmjet.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        mdpi: './assets/dmjet.png',
        hdpi: './assets/dmjet.png',
        xhdpi: './assets/dmjet.png',
        xxhdpi: './assets/dmjet.png',
        xxxhdpi: './assets/dmjet.png',
      },
      package: 'com.dmarjet',
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'POST_NOTIFICATIONS',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
      ],
      config: {
        googleMaps: {
          apiKey: getEnvVar('GOOGLE_MAPS_API_KEY_ANDROID') || getEnvVar('GOOGLE_MAPS_API_KEY'),
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    extra: {
      eas: {
        projectId: 'f2092e32-e8f4-4c1a-83cc-8e412eab3cf2',
      },
      // Runtime'da erişilebilir environment değişkenleri
      // Trim whitespace ve boş string kontrolü yap
      supabaseUrl: hasValidSupabaseUrl ? supabaseUrl.trim() : '',
      supabaseAnonKey: hasValidSupabaseKey ? supabaseAnonKey.trim() : '',
      googleMapsApiKey: getEnvVar('GOOGLE_MAPS_API_KEY_IOS') || getEnvVar('GOOGLE_MAPS_API_KEY'),
      sentryDsn: getEnvVar('SENTRY_DSN'),
    },
    plugins: [
      'expo-asset',
      'expo-font',
      'expo-localization',
      'expo-secure-store',
      'expo-web-browser',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Bu uygulama teslimat konumunuzu belirlemek için konumunuza erişim gerektirir.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/dmicon.png',
          color: '#ffffff',
          mode: 'production',
        },
      ],
    ],
  },
};
