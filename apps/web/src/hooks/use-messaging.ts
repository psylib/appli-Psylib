'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import type { Message } from '@/lib/api/messaging';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

interface UseMessagingReturn {
  messages: Message[];
  isConnected: boolean;
  sendMessage: (content: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function useMessaging(conversationId: string | null): UseMessagingReturn {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!session?.accessToken || !conversationId) return;

    const socket = io(`${API_BASE}/messaging`, {
      auth: { token: session.accessToken },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_conversation', { conversationId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('new_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('messages_read', ({ readAt }: { readAt: string }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.readAt === null ? { ...msg, readAt } : msg)),
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [session?.accessToken, conversationId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !conversationId || !content.trim()) return;
      socketRef.current.emit('send_message', { conversationId, content });
    },
    [conversationId],
  );

  return { messages, isConnected, sendMessage, setMessages };
}
