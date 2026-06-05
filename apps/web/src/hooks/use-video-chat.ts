'use client';

import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { useCallback, useEffect, useRef, useState } from 'react';

export type ChatSender = 'psy' | 'patient' | 'guest';

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  senderName: string;
  text: string;
  timestamp: number;
}

interface UseVideoChatOptions {
  sender: ChatSender;
  senderName: string;
}

interface UseVideoChatReturn {
  messages: ChatMessage[];
  unreadCount: number;
  sendMessage: (text: string) => void;
  clearUnread: () => void;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function useVideoChat({ sender, senderName }: UseVideoChatOptions): UseVideoChatReturn {
  const room = useRoomContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelOpenRef = useRef(false);

  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(decoder.decode(payload)) as ChatMessage;
        if (!msg.id || !msg.text || !msg.sender) return;
        setMessages((prev) => [...prev, msg]);
        if (!panelOpenRef.current) setUnreadCount((c) => c + 1);
      } catch {
        // silently drop malformed packets
      }
    };
    room.on(RoomEvent.DataReceived, handleData);
    return () => { room.off(RoomEvent.DataReceived, handleData); };
  }, [room]);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender,
      senderName,
      text: trimmed,
      timestamp: Date.now(),
    };
    room.localParticipant.publishData(encoder.encode(JSON.stringify(msg)), { reliable: true });
    setMessages((prev) => [...prev, msg]);
  }, [room, sender, senderName]);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
    panelOpenRef.current = true;
  }, []);

  return { messages, unreadCount, sendMessage, clearUnread };
}
