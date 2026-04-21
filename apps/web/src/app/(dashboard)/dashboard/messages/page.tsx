'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { MessageSquare, Send, CheckCheck } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { messagingApi, type ConversationSummary, type Message } from '@/lib/api/messaging';
import { useMessaging } from '@/hooks/use-messaging';

// ─── Avatar initiales coloré ─────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];

function patientColor(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index] ?? AVATAR_COLORS[0]!;
}

// ─── Sous-composant : liste des conversations ─────────────────────────────────

interface ConversationListProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (conv: ConversationSummary) => void;
  loading: boolean;
}

function ConversationList({
  conversations,
  activeId,
  onSelect,
  loading,
}: ConversationListProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageSquare size={40} className="text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground">Aucune conversation</p>
        <p className="text-xs text-muted-foreground mt-1">
          Invitez un patient à rejoindre PsyLib pour commencer à échanger.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border" role="listbox" aria-label="Conversations">
      {conversations.map((conv) => {
        const active = conv.id === activeId;
        const initials = getInitials(conv.patientName);
        const colorClass = patientColor(conv.patientName);

        return (
          <li key={conv.id}>
            <button
              role="option"
              aria-selected={active}
              onClick={() => onSelect(conv)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors min-h-[72px]',
                active
                  ? 'bg-primary/5 border-l-2 border-primary'
                  : 'hover:bg-surface border-l-2 border-transparent',
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0',
                  colorClass,
                )}
                aria-hidden
              >
                {initials}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn('text-sm font-medium truncate', active ? 'text-primary' : 'text-foreground')}>
                    {conv.patientName}
                  </p>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {formatRelativeTime(conv.updatedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground truncate">
                    {conv.lastMessage ?? 'Aucun message'}
                  </p>
                  {conv.unreadCount > 0 && (
                    <Badge
                      className="bg-red-500 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full flex-shrink-0"
                    >
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Sous-composant : bulle de message ───────────────────────────────────────

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const time = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(message.createdAt));

  return (
    <div
      className={cn(
        'flex flex-col gap-1 max-w-[75%]',
        isMine ? 'self-end items-end' : 'self-start items-start',
      )}
    >
      <div
        className={cn(
          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
          isMine
            ? 'bg-[#3D52A0] text-white rounded-br-sm'
            : 'bg-white border border-border text-foreground rounded-bl-sm',
        )}
      >
        {message.content}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground">{time}</span>
        {isMine && message.readAt && (
          <CheckCheck size={12} className="text-[#3D52A0]" aria-label="Lu" />
        )}
      </div>
    </div>
  );
}

// ─── Sous-composant : zone de chat ────────────────────────────────────────────

interface ChatPanelProps {
  conversation: ConversationSummary | null;
  currentUserId: string;
  isConnected: boolean;
}

function ChatPanel({ conversation, currentUserId, isConnected }: ChatPanelProps) {
  const { data: session } = useSession();
  const { messages, sendMessage, setMessages } = useMessaging(conversation?.id ?? null);
  const [input, setInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Charger les messages historiques quand la conversation change
  useEffect(() => {
    if (!conversation || !session?.accessToken) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    messagingApi
      .getMessages(conversation.id, session.accessToken)
      .then((data) => {
        setMessages(data);
        // Marquer comme lu
        void messagingApi.markRead(conversation.id, session.accessToken);
      })
      .catch(() => {
        setMessages([]);
      })
      .finally(() => {
        setLoadingMessages(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- we only re-fetch when conversation.id changes, not the full object
  }, [conversation?.id, session?.accessToken, setMessages]);

  // Auto-scroll vers le bas sur nouveaux messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInput('');
  }, [input, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // Placeholder quand aucune conversation sélectionnée
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <MessageSquare size={32} className="text-primary" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-foreground">Vos messages</p>
          <p className="text-sm text-muted-foreground mt-1">
            Sélectionnez une conversation pour commencer.
          </p>
        </div>
      </div>
    );
  }

  const initials = getInitials(conversation.patientName);
  const colorClass = patientColor(conversation.patientName);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-border flex-shrink-0">
        <div
          className={cn(
            'h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0',
            colorClass,
          )}
          aria-hidden
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {conversation.patientName}
          </p>
        </div>
        {isConnected && (
          <Badge variant="success" className="text-xs gap-1 flex-shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-accent inline-block" aria-hidden />
            En ligne
          </Badge>
        )}
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 min-h-0">
        {loadingMessages ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
                <Skeleton className={cn('h-10 rounded-2xl', i % 2 === 0 ? 'w-48' : 'w-36')} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Envoyez le premier message à {conversation.patientName}.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.senderId === currentUserId}
            />
          ))
        )}
        <div ref={bottomRef} aria-hidden />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-border flex-shrink-0">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message... (Entrée pour envoyer)"
            rows={1}
            className={cn(
              'flex-1 resize-none rounded-xl border border-input bg-slate-50 px-4 py-2.5 text-sm',
              'placeholder:text-muted-foreground text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              'max-h-32 overflow-y-auto',
            )}
            aria-label="Écrire un message"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              input.trim()
                ? 'bg-[#3D52A0] text-white hover:bg-[#3D52A0]/90'
                : 'bg-surface text-muted-foreground cursor-not-allowed',
            )}
            aria-label="Envoyer le message"
          >
            <Send size={16} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationSummary | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showChat, setShowChat] = useState(false); // mobile: toggle liste/chat
  const { isConnected } = useMessaging(activeConversation?.id ?? null);

  useEffect(() => {
    if (!session?.accessToken) return;

    messagingApi
      .getConversations(session.accessToken)
      .then((data) => {
        setConversations(data);
      })
      .catch(() => {
        setConversations([]);
      })
      .finally(() => {
        setLoadingConversations(false);
      });
  }, [session?.accessToken]);

  const handleSelectConversation = useCallback(
    (conv: ConversationSummary) => {
      setActiveConversation(conv);
      // Réinitialiser unreadCount localement
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)),
      );
      setShowChat(true); // mobile: afficher le chat
    },
    [],
  );

  const currentUserId = session?.user?.id ?? '';

  return (
    <div
      className="flex h-[calc(100vh-64px)] bg-white overflow-hidden"
      aria-label="Messagerie"
    >
      {/* ── Colonne gauche : liste des conversations ── */}
      <div
        className={cn(
          'w-full md:w-80 lg:w-96 flex flex-col border-r border-border flex-shrink-0',
          // Mobile: masquer si chat ouvert
          showChat ? 'hidden md:flex' : 'flex',
        )}
      >
        {/* Header liste */}
        <div className="px-5 py-4 border-b border-border flex-shrink-0">
          <h1 className="text-lg font-bold text-foreground">Messages</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {conversations.length > 0
              ? `${conversations.length} conversation${conversations.length > 1 ? 's' : ''}`
              : 'Messagerie sécurisée HDS'}
          </p>
        </div>

        {/* Liste scrollable */}
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations}
            activeId={activeConversation?.id ?? null}
            onSelect={handleSelectConversation}
            loading={loadingConversations}
          />
        </div>
      </div>

      {/* ── Colonne droite : chat actif ── */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0',
          // Mobile: masquer si liste visible
          showChat ? 'flex' : 'hidden md:flex',
        )}
      >
        {/* Bouton retour (mobile uniquement) */}
        {showChat && activeConversation && (
          <button
            onClick={() => setShowChat(false)}
            className="md:hidden flex items-center gap-2 px-4 py-3 bg-white border-b border-border text-sm text-primary font-medium"
            aria-label="Retour à la liste"
          >
            ← Retour
          </button>
        )}

        <ChatPanel
          conversation={activeConversation}
          currentUserId={currentUserId}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `${diffMin}min`;
  if (diffH < 24) return `${diffH}h`;
  if (diffD === 1) return 'Hier';
  if (diffD < 7) return `${diffD}j`;

  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
}
