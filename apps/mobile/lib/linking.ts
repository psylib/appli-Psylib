/**
 * Deep Linking Configuration for PsyLib Mobile
 *
 * Supported deep links:
 *   psylib://patients/:id      -> patient detail
 *   psylib://sessions/:id      -> session detail
 *   psylib://messages/:id      -> conversation
 *   psylib://notifications     -> notifications list
 *   psylib://auth/callback     -> Keycloak OIDC callback
 *
 * expo-router handles deep linking automatically via the file-based routing.
 * This file documents the mapping and provides helpers.
 */

/**
 * Map of deep link paths to expo-router screens.
 * expo-router resolves these automatically based on file structure.
 */
export const DEEP_LINK_ROUTES = {
  patients: '/(tabs)/patients/[id]',
  sessions: '/(tabs)/sessions/[id]',
  messages: '/messages/[id]',
  notifications: '/notifications',
  authCallback: '/auth/callback',
} as const;

/**
 * Build a deep link URL for sharing
 */
export function buildDeepLink(path: string): string {
  return `psylib://${path.replace(/^\//, '')}`;
}

/**
 * Parse a notification data payload to extract a navigation target.
 * Used by push notification handler to route users.
 */
export function parseNotificationRoute(
  data: Record<string, unknown>,
): { path: string; params?: Record<string, string> } | null {
  const type = data.type as string | undefined;
  const id = data.entityId as string | undefined;

  switch (type) {
    case 'session_reminder':
    case 'session_note':
      if (id) return { path: '/(tabs)/sessions/[id]', params: { id } };
      return { path: '/(tabs)/sessions' };

    case 'new_message':
    case 'message': {
      const conversationId = data.conversationId as string | undefined;
      if (conversationId) return { path: '/messages/[id]', params: { id: conversationId } };
      return { path: '/messages' };
    }

    case 'appointment':
    case 'appointment_reminder':
      return { path: '/(tabs)/calendar' };

    case 'patient_portal':
    case 'mood_alert':
      if (id) return { path: '/(tabs)/patients/[id]', params: { id } };
      return { path: '/(tabs)/patients' };

    case 'ai_complete':
      return { path: '/ai-summary' };

    case 'payment':
    case 'invoice':
      return { path: '/invoices' };

    default:
      return { path: '/notifications' };
  }
}
