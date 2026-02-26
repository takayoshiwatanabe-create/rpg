const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude test files from the bundle
config.resolver.blockList = [
  /.*\.test\.(ts|tsx|js|jsx)$/,
  /.*\.spec\.(ts|tsx|js|jsx)$/,
  /.*\/__tests__\/.*/,
];

module.exports = config;
