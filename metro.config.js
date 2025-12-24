const {getSentryExpoConfig} = require('@sentry/react-native/metro');

/**
 * Metro configuration for Expo
 * https://docs.expo.dev/guides/customizing-metro
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getSentryExpoConfig(__dirname);

module.exports = config;
