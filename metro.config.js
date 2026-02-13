const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add path aliases
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
  '@core': path.resolve(__dirname, 'src/core'),
  '@shared': path.resolve(__dirname, 'src/shared'),
  '@features': path.resolve(__dirname, 'src/features'),
  '@services': path.resolve(__dirname, 'src/services'),
};

// Add additional module resolutions
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('readable-stream'),
  buffer: require.resolve('@craftzdog/react-native-buffer'),
  url: require.resolve('url/'),
  http: require.resolve('stream-http'),
  https: require.resolve('https-browserify'),
  os: require.resolve('os-browserify/browser.js'),
  path: require.resolve('path-browserify'),
  fs: require.resolve('empty-module'),
  zlib: require.resolve('browserify-zlib'),
};

// Add any additional asset extensions
config.resolver.assetExts = [...config.resolver.assetExts, 'db', 'sqlite'];

// Enable symlinks for monorepo support
config.resolver.enableSymlinks = true;

// Add source extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

module.exports = config; 