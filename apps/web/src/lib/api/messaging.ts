import { apiClient } from './client';

export interface ConversationSummary {
  id: string;
  patientId: string;
  patientName: string;
  lastMessage?: string;
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export const messagingApi = {
  getConversations: (token: string) =>
    apiClient.get<ConversationSummary[]>('/messaging/conversations', token),

  getOrCreateConversation: (patientId: string, token: string) =>
    apiClient.post<{ id: string }>('/messaging/conversations', { patientId }, token),

  getMessages: (conversationId: string, token: string) =>
    apiClient.get<Message[]>(`/messaging/conversations/${conversationId}/messages`, token),

  markRead: (conversationId: string, token: string) =>
    apiClient.patch<void>(`/messaging/conversations/${conversationId}/read`, {}, token),
};
