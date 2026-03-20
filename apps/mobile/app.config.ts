import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PsyLib',
  slug: 'psylib',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'psylib',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#F8F7FF',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'eu.psylib.app',
    infoPlist: {
      NSFaceIDUsageDescription:
        "PsyLib utilise Face ID pour securiser l'acces a vos donnees patients.",
      NSCameraUsageDescription: 'PsyLib utilise la camera pour scanner des documents.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#3D52A0',
    },
    package: 'eu.psylib.app',
    permissions: ['RECEIVE_BOOT_COMPLETED', 'VIBRATE', 'USE_BIOMETRIC', 'USE_FINGERPRINT'],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    ['expo-auth-session', {}],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#3D52A0',
      },
    ],
    'expo-local-authentication',
    'expo-font',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    keycloakUrl: process.env.EXPO_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8080',
    keycloakRealm: 'psyscale',
    keycloakClientId: process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'psylib-mobile',
    apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000',
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? 'psylib-mobile',
    },
  },
});
