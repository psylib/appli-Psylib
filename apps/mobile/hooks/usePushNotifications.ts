/**
 * Push notifications hook — register at startup, handle received/response
 */
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from './useAuth';
import { registerForPushNotifications } from '@/lib/push-notifications';

export function usePushNotifications() {
  const { isAuthenticated, getValidToken } = useAuth();
  const router = useRouter();
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Register push token when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    void (async () => {
      const token = await getValidToken();
      if (token) {
        await registerForPushNotifications(token);
      }
    })();
  }, [isAuthenticated, getValidToken]);

  // Handle notification tap (when user taps on notification)
  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, string> | undefined;
        if (!data) return;

        if (data.type === 'session_reminder' && data.sessionId) {
          router.push(`/(tabs)/sessions/${data.sessionId}`);
        } else if (data.type === 'new_message' && data.conversationId) {
          router.push(`/messages/${data.conversationId}`);
        } else if (data.type === 'appointment') {
          router.push('/(tabs)/calendar');
        } else {
          router.push('/notifications');
        }
      },
    );

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);
}
