/**
 * Expo App Configuration
 * Uses environment variables for sensitive data
 */

export default {
  expo: {
    name: "DmarJet Mobile",
    slug: "dmarjetmobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "dmarjetmobile",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.dmarjet.mobile",
      infoPlist: {
        NSCameraUsageDescription: "Bu uygulama profil fotoğrafı çekmek için kameraya erişim gerektirir.",
        NSPhotoLibraryUsageDescription: "Bu uygulama profil fotoğrafı seçmek için fotoğraf galerisine erişim gerektirir.",
        NSLocationWhenInUseUsageDescription: "Bu uygulama size yakın mağazaları göstermek ve teslimat konumunuzu belirlemek için konumunuza erişim gerektirir.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "Bu uygulama teslimat konumunuzu belirlemek için konumunuza erişim gerektirir."
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.dmarjet.mobile",
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "POST_NOTIFICATIONS",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    extra: {
      eas: {
        projectId: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"
      },
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
    },
    plugins: [
      "expo-asset",
      "expo-font",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Bu uygulama teslimat konumunuzu belirlemek için konumunuza erişim gerektirir."
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#ffffff",
          sounds: ["./assets/notification-sound.wav"],
          mode: "production"
        }
      ]
    ]
  }
};

