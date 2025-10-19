// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    settings: {
      'import/core-modules': [
        'expo-av',
        'expo-constants',
        'expo-file-system',
        'expo-haptics',
        'expo-image',
        'expo-linking',
        'expo-splash-screen',
        'expo-status-bar',
        'expo-symbols',
        'expo-system-ui',
        'expo-web-browser',
      ],
    },
  },
]);
