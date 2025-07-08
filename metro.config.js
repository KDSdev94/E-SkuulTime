const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Suppress console warnings in production
if (process.env.NODE_ENV === 'production') {
  config.transformer.minifierConfig = {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  };
}

// Disable logs in Metro bundler output
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
