const APP_ENV = process.env.APP_ENV ?? 'development';

const variants = {
  development: {
    name: 'klopilot (dev)',
    bundleId: 'ch.klopilot.app.dev',
  },
  preview: {
    name: 'klopilot (beta)',
    bundleId: 'ch.klopilot.app',
  },
  production: {
    name: 'klopilot',
    bundleId: 'ch.klopilot.app',
  },
};

const v = variants[APP_ENV] ?? variants.development;

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  name: v.name,
  slug: 'klopilot',
  owner: '4cpa',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'klopilot',
  userInterfaceStyle: 'automatic',

  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#FF6B35',
  },

  platforms: ['ios', 'android'],
  assetBundlePatterns: ['**/*'],

  ios: {
    supportsTablet: true,
    bundleIdentifier: v.bundleId,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Wir nutzen deinen Standort, um Toiletten in deiner Nähe zu finden.',
      NSPhotoLibraryUsageDescription: 'Wir nutzen deine Fotobibliothek für Toilettenfotos.',
      NSCameraUsageDescription: 'Wir nutzen deine Kamera für Toilettenfotos.',
    },
  },

  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FF6B35',
    },
    package: v.bundleId,
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'CAMERA',
    ],
  },

  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },

  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-updates',
    ['expo-location', { locationAlwaysAndWhenInUsePermission: 'Für Toiletten in deiner Nähe.' }],
    ['expo-image-picker', { photosPermission: 'Für Toilettenfotos.' }],
    'expo-font',
    ['expo-notifications', { icon: './assets/icon.png', color: '#FF6B35' }],
  ],

  experiments: {
    typedRoutes: true,
  },

  runtimeVersion: {
    policy: 'appVersion',
  },

  updates: {
    url: 'https://u.expo.dev/8ae62da2-ef2f-4867-92ae-40ab86b1ac7b',
  },

  extra: {
    eas: {
      projectId: '8ae62da2-ef2f-4867-92ae-40ab86b1ac7b',
    },
  },
});
