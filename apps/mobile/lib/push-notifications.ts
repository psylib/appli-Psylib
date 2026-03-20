/**
 * Push Notifications — Expo Push Service
 * Permission, getExpoPushToken, register on backend.
 * HDS: Never include patient names in push payloads.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiClient } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(token: string): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const pushToken = await Notifications.getExpoPushTokenAsync({
    projectId: typeof projectId === 'string' ? projectId : undefined,
  });

  // Register token on backend
  await apiClient.post(
    '/notifications/push-token',
    {
      pushToken: pushToken.data,
      pushPlatform: Platform.OS,
    },
    token,
  );

  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'PsyLib',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3D52A0',
    });
  }

  return pushToken.data;
}
