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
    buildNumber: '1',
    infoPlist: {
      NSFaceIDUsageDescription:
        "PsyLib utilise Face ID pour securiser l'acces a vos donnees patients.",
      NSCameraUsageDescription: 'PsyLib utilise la camera pour scanner des documents.',
      NSCalendarsUsageDescription:
        'PsyLib accede a votre calendrier pour synchroniser vos rendez-vous.',
      NSPhotoLibraryUsageDescription:
        'PsyLib accede a vos photos pour ajouter des pieces jointes.',
      NSMicrophoneUsageDescription:
        'PsyLib utilise le microphone pour les consultations video.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#3D52A0',
    },
    package: 'eu.psylib.app',
    versionCode: 1,
    permissions: [
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
      'USE_BIOMETRIC',
      'USE_FINGERPRINT',
      'CAMERA',
      'READ_CALENDAR',
      'WRITE_CALENDAR',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#3D52A0',
      },
    ],
    'expo-local-authentication',
    'expo-font',
    [
      'expo-build-properties',
      {
        ios: {
          // Disable expo-dev-client network inspector on iOS dev builds
          // so it does not interfere with SSL certificate pinning (TrustKit).
          // The inspector is already disabled on production builds.
          networkInspector: false,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    keycloakUrl: process.env.EXPO_PUBLIC_KEYCLOAK_URL ?? 'https://auth.psylib.eu',
    keycloakRealm: 'psyscale',
    keycloakClientId: process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'psylib-mobile',
    apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.psylib.eu',
    eas: {
      projectId: '315b6731-a827-4472-97c2-4a1534ccce2e',
    },
  },
});
