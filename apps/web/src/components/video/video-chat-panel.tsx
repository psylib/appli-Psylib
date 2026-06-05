'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import type { ChatMessage, ChatSender } from '@/hooks/use-video-chat';

interface VideoChatPanelProps {
  messages: ChatMessage[];
  localSender: ChatSender;
  onSend: (text: string) => void;
}

export function VideoChatPanel({ messages, localSender, onSend }: VideoChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto space-y-3 p-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucun message. Écrivez ici si l&apos;audio est difficile.
          </p>
        )}
        {messages.map((msg) => {
          const isLocal = msg.sender === localSender;
          return (
            <div key={msg.id} className={`flex ${isLocal ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  isLocal
                    ? 'rounded-br-sm bg-primary text-white'
                    : 'rounded-bl-sm bg-muted text-foreground'
                }`}
              >
                {!isLocal && (
                  <p className="mb-1 text-xs font-medium opacity-70">{msg.senderName}</p>
                )}
                <p className="break-words">{msg.text}</p>
                <p className={`mt-1 text-xs ${isLocal ? 'text-white/60' : 'text-muted-foreground'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-border p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Écrivez un message..."
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="rounded-lg bg-primary p-2 text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
          title="Envoyer"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
