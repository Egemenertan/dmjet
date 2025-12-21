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
            '@core': './src/core',
            '@features': './src/features',
            '@shared': './src/shared',
            '@store': './src/store',
            '@localization': './src/localization',
          },
        },
      ],
      // Remove console.log in production
      process.env.NODE_ENV === 'production' && [
        'transform-remove-console',
        {
          exclude: ['error', 'warn'],
        },
      ],
    ].filter(Boolean),
  };
};
