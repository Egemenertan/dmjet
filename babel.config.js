module.exports = function (api) {
  api.cache(true);
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
      'react-native-reanimated/plugin',
    ],
  };
};
