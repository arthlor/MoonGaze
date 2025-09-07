const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable TypeScript path mapping
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure asset extensions
config.resolver.assetExts.push(
  // Add any additional asset extensions your app uses
  'db',
  'mp3',
  'ttf',
  'obj',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
);

// Configure source extensions
config.resolver.sourceExts = [
  'js',
  'json',
  'ts',
  'tsx',
  'jsx',
  'cjs',
  'mjs',
];

// Enable Hermes for better performance
config.transformer.enableHermes = true;

// Configure transformer
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Configure resolver
config.resolver = {
  ...config.resolver,
  alias: {
    '@': `${__dirname  }/src`,
  },
};

module.exports = config;
