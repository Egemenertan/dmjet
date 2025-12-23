module.exports = function (api) {
  api.cache(true);
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@core': './src/core',
            '@features': './src/features',
            '@shared': './src/shared',
            '@store': './src/store',
            '@theme': './src/theme',
            '@localization': './src/localization',
          },
        },
      ],
      // Remove console.log in production builds
      ...(isProduction ? [
        ['transform-remove-console', { exclude: ['error', 'warn'] }]
      ] : []),
      'react-native-reanimated/plugin',
    ],
  };
};
