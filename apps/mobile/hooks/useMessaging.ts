/**
 * Messaging hook — Socket.io real-time + REST API
 */
import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useAuth } from './useAuth';

interface Conversation {
  id: string;
  psychologistId: string;
  patientId: string;
  patient?: { id: string; name: string };
  lastMessage?: { content: string; createdAt: string; senderId: string };
  unreadCount: number;
  createdAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

const CONVERSATIONS_KEY = 'conversations';
const MESSAGES_KEY = 'messages';

export function useConversations() {
  const { getValidToken } = useAuth();

  return useQuery({
    queryKey: [CONVERSATIONS_KEY],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<Conversation[]>('/messaging/conversations', token ?? undefined);
    },
    staleTime: 1000 * 30,
  });
}

export function useMessages(conversationId: string) {
  const { getValidToken, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);

  // REST fetch
  const query = useQuery({
    queryKey: [MESSAGES_KEY, conversationId],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<Message[]>(
        `/messaging/conversations/${conversationId}/messages`,
        token ?? undefined,
      );
    },
    enabled: conversationId.length > 0,
    staleTime: 1000 * 30,
  });

  // Socket.io real-time
  useEffect(() => {
    if (!isAuthenticated || !conversationId) return;

    let mounted = true;
    void (async () => {
      const socket = await connectSocket();

      socket.emit('join_conversation', { conversationId });

      socket.on('new_message', (msg: Message) => {
        if (!mounted) return;
        if (msg.conversationId === conversationId) {
          setRealtimeMessages((prev) => [...prev, msg]);
        }
        void qc.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
      });
    })();

    return () => {
      mounted = false;
      const socket = getSocket();
      if (socket) {
        socket.emit('leave_conversation', { conversationId });
        socket.off('new_message');
      }
    };
  }, [isAuthenticated, conversationId, qc]);

  // Merge REST + realtime messages
  const allMessages = [...(query.data ?? []), ...realtimeMessages];

  return { ...query, data: allMessages };
}

export function useSendMessage(conversationId: string) {
  const { getValidToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const token = await getValidToken();
      return apiClient.post<Message>(
        `/messaging/conversations/${conversationId}/messages`,
        { content },
        token ?? undefined,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [MESSAGES_KEY, conversationId] });
      void qc.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
    },
  });
}

export function useTotalUnreadMessages() {
  const { data } = useConversations();
  return data?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;
}
