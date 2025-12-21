module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Reanimated plugin'ini devre dışı bırak
          reanimated: false,
        },
      ],
    ],
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
            '@theme': './src/theme',
            '@localization': './src/localization',
            '@store': './src/store',
          },
        },
      ],
    ],
  };
};
