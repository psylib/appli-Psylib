# Video Chat (LiveKit DataChannel) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un chat texte P2P pendant la visio via LiveKit DataChannel — côté psy (onglet Notes/Chat) et côté patient (drawer slide-up).

**Architecture:** LiveKit expose `room.localParticipant.publishData(Uint8Array, { reliable: true })` et `RoomEvent.DataReceived` pour le P2P sans serveur. Un hook `useVideoChat` encapsule ce canal ; `VideoChatPanel` est un composant UI partagé entre les deux layouts. Aucun changement backend, aucune persistance (les messages disparaissent à la fin de la séance — correct pour HDS).

**Tech Stack:** LiveKit components-react v2, Vitest (tests hook), Tailwind + shadcn, lucide-react (`MessageSquare`, `Send`).

---

## File Map

```
apps/web/src/
  hooks/
    use-video-chat.ts              ← NEW  hook DataChannel
  components/video/
    video-chat-panel.tsx           ← NEW  UI bulles + input
    video-controls.tsx             ← MOD  +chatSlot, +unreadCount
    video-room.tsx                 ← MOD  onglets Notes/Chat + hook
    patient-video-room.tsx         ← MOD  drawer + bouton chat
  hooks/__tests__/
    use-video-chat.test.ts         ← NEW  tests Vitest
```

---

## Task 1 — Hook `use-video-chat.ts`

**Files:**
- Create: `apps/web/src/hooks/use-video-chat.ts`
- Create: `apps/web/src/hooks/__tests__/use-video-chat.test.ts`

- [ ] **1.1 — Écrire le test (failing)**

Créer `apps/web/src/hooks/__tests__/use-video-chat.test.ts` :

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RoomEvent } from 'livekit-client';

// Mock useRoomContext
const mockPublishData = vi.fn();
const mockRoom = {
  localParticipant: { publishData: mockPublishData },
  on: vi.fn(),
  off: vi.fn(),
};
vi.mock('@livekit/components-react', () => ({
  useRoomContext: () => mockRoom,
}));

import { useVideoChat } from '../use-video-chat';

describe('useVideoChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with empty messages and zero unread', () => {
    const { result } = renderHook(() =>
      useVideoChat({ sender: 'psy', senderName: 'Dr Dupont' })
    );
    expect(result.current.messages).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('sendMessage appends to local messages and publishes data', () => {
    const { result } = renderHook(() =>
      useVideoChat({ sender: 'psy', senderName: 'Dr Dupont' })
    );
    act(() => { result.current.sendMessage('Bonjour'); });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].text).toBe('Bonjour');
    expect(result.current.messages[0].sender).toBe('psy');
    expect(mockPublishData).toHaveBeenCalledOnce();
  });

  it('sendMessage ignores blank strings', () => {
    const { result } = renderHook(() =>
      useVideoChat({ sender: 'psy', senderName: 'Dr Dupont' })
    );
    act(() => { result.current.sendMessage('   '); });
    expect(result.current.messages).toHaveLength(0);
    expect(mockPublishData).not.toHaveBeenCalled();
  });

  it('DataReceived increments unreadCount when panel is closed', () => {
    const { result } = renderHook(() =>
      useVideoChat({ sender: 'psy', senderName: 'Dr Dupont' })
    );
    // Simulate incoming data
    const handler = (mockRoom.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
    const incomingMsg = {
      id: 'abc', sender: 'patient', senderName: 'Alice', text: 'Allo', timestamp: Date.now(),
    };
    const encoder = new TextEncoder();
    act(() => { handler(encoder.encode(JSON.stringify(incomingMsg))); });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.unreadCount).toBe(1);
  });

  it('clearUnread resets unread count', () => {
    const { result } = renderHook(() =>
      useVideoChat({ sender: 'psy', senderName: 'Dr Dupont' })
    );
    const handler = (mockRoom.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
    const encoder = new TextEncoder();
    const msg = { id: 'x', sender: 'patient', senderName: 'Alice', text: 'Hi', timestamp: Date.now() };
    act(() => { handler(encoder.encode(JSON.stringify(msg))); });
    expect(result.current.unreadCount).toBe(1);
    act(() => { result.current.clearUnread(); });
    expect(result.current.unreadCount).toBe(0);
  });

  it('ignores malformed DataReceived packets silently', () => {
    const { result } = renderHook(() =>
      useVideoChat({ sender: 'psy', senderName: 'Dr Dupont' })
    );
    const handler = (mockRoom.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
    const encoder = new TextEncoder();
    act(() => { handler(encoder.encode('not json')); });
    expect(result.current.messages).toHaveLength(0);
  });

  it('registers and cleans up DataReceived listener', () => {
    const { unmount } = renderHook(() =>
      useVideoChat({ sender: 'psy', senderName: 'Dr Dupont' })
    );
    expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.DataReceived, expect.any(Function));
    unmount();
    expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.DataReceived, expect.any(Function));
  });
});
```

- [ ] **1.2 — Lancer le test (doit échouer)**

```bash
cd apps/web && pnpm vitest run src/hooks/__tests__/use-video-chat.test.ts
```
Attendu : `FAIL` — module introuvable.

- [ ] **1.3 — Implémenter `use-video-chat.ts`**

Créer `apps/web/src/hooks/use-video-chat.ts` :

```ts
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
```

- [ ] **1.4 — Lancer le test (doit passer)**

```bash
cd apps/web && pnpm vitest run src/hooks/__tests__/use-video-chat.test.ts
```
Attendu : `6 passed`.

- [ ] **1.5 — Commit**

```bash
git add apps/web/src/hooks/use-video-chat.ts apps/web/src/hooks/__tests__/use-video-chat.test.ts
git commit -m "feat(video-chat): add useVideoChat hook — LiveKit DataChannel P2P"
```

---

## Task 2 — Composant `video-chat-panel.tsx`

**Files:**
- Create: `apps/web/src/components/video/video-chat-panel.tsx`

- [ ] **2.1 — Créer `video-chat-panel.tsx`**

```tsx
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
            Aucun message. Écrivez ici si l'audio est difficile.
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
```

- [ ] **2.2 — Vérifier la compilation TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep video-chat-panel
```
Attendu : aucune erreur.

- [ ] **2.3 — Commit**

```bash
git add apps/web/src/components/video/video-chat-panel.tsx
git commit -m "feat(video-chat): add VideoChatPanel component"
```

---

## Task 3 — Modifier `video-controls.tsx` (chatSlot + badge)

**Files:**
- Modify: `apps/web/src/components/video/video-controls.tsx`

- [ ] **3.1 — Ajouter `chatSlot` et `unreadCount` à l'interface et au JSX**

Remplacer le contenu de `video-controls.tsx` par :

```tsx
'use client';

import { useLocalParticipant } from '@livekit/components-react';
import {
  Mic, MicOff, VideoIcon, VideoOff, PhoneOff,
  PanelRightOpen, PanelRightClose, Maximize, Minimize,
  MonitorUp, MonitorX, MessageSquare,
} from 'lucide-react';
import { DeviceSettingsMenu } from './device-settings-menu';

interface VideoControlsProps {
  showNotes: boolean;
  onToggleNotes: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;
  blurEnabled: boolean;
  blurPending: boolean;
  onToggleBlur: () => void;
  inviteSlot?: React.ReactNode;
  scribeSlot?: React.ReactNode;
  chatSlot?: React.ReactNode;
  onEndCall: () => void;
}

const baseBtn = 'rounded-full p-3 transition-colors text-white';
const neutralBtn = `${baseBtn} bg-white/10 hover:bg-white/20`;
const offBtn = `${baseBtn} bg-red-500/90 hover:bg-red-500`;
const activeBtn = `${baseBtn} bg-[#0D9488] hover:bg-[#0b7d72]`;

export function VideoControls({
  showNotes,
  onToggleNotes,
  isFullscreen,
  onToggleFullscreen,
  isScreenSharing,
  onToggleScreenShare,
  blurEnabled,
  blurPending,
  onToggleBlur,
  inviteSlot,
  scribeSlot,
  chatSlot,
  onEndCall,
}: VideoControlsProps) {
  const { localParticipant, isMicrophoneEnabled: isMicOn, isCameraEnabled: isCamOn } = useLocalParticipant();

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-gray-900/80 px-3 py-2 shadow-2xl backdrop-blur-md">
      <button
        onClick={() => localParticipant.setMicrophoneEnabled(!isMicOn)}
        className={isMicOn ? neutralBtn : offBtn}
        title={isMicOn ? 'Couper le micro' : 'Activer le micro'}
      >
        {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </button>

      <button
        onClick={() => localParticipant.setCameraEnabled(!isCamOn)}
        className={isCamOn ? neutralBtn : offBtn}
        title={isCamOn ? 'Couper la caméra' : 'Activer la caméra'}
      >
        {isCamOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </button>

      <button
        onClick={onToggleScreenShare}
        className={isScreenSharing ? activeBtn : neutralBtn}
        title={isScreenSharing ? "Arrêter le partage d'écran" : 'Partager mon écran'}
      >
        {isScreenSharing ? <MonitorX className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
      </button>

      {inviteSlot}
      {scribeSlot}
      {chatSlot}

      <DeviceSettingsMenu blurEnabled={blurEnabled} blurPending={blurPending} onToggleBlur={onToggleBlur} />

      <div className="mx-1 h-6 w-px bg-white/15" />

      <button
        onClick={onToggleNotes}
        className={showNotes ? activeBtn : neutralBtn}
        title={showNotes ? 'Masquer les notes' : 'Afficher les notes'}
      >
        {showNotes ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
      </button>

      <button
        onClick={onToggleFullscreen}
        className={neutralBtn}
        title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
      >
        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </button>

      <button
        onClick={onEndCall}
        className={`${baseBtn} ml-1 bg-red-600 hover:bg-red-700`}
        title="Terminer la consultation"
      >
        <PhoneOff className="h-5 w-5" />
      </button>
    </div>
  );
}
```

Note : `chatSlot` est un `React.ReactNode` — le bouton MessageSquare avec badge est rendu dans `video-room.tsx` et `patient-video-room.tsx` (chacun contrôle son propre état d'ouverture et son badge).

- [ ] **3.2 — Vérifier TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep video-controls
```
Attendu : aucune erreur.

- [ ] **3.3 — Commit**

```bash
git add apps/web/src/components/video/video-controls.tsx
git commit -m "feat(video-chat): add chatSlot prop to VideoControls"
```

---

## Task 4 — Modifier `video-room.tsx` (onglets Notes / Chat, côté psy)

**Files:**
- Modify: `apps/web/src/components/video/video-room.tsx`

- [ ] **4.1 — Mettre à jour `VideoLayout` dans `video-room.tsx`**

Remplacer l'intégralité du fichier `apps/web/src/components/video/video-room.tsx` :

```tsx
'use client';

import {
  LiveKitRoom,
  useTracks,
  useRoomContext,
  useLocalParticipant,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import { useVideoCall } from '@/hooks/use-video-call';
import { useBackgroundBlur } from '@/hooks/use-background-blur';
import { useVideoChat } from '@/hooks/use-video-chat';
import { VideoControls } from './video-controls';
import { VideoGrid } from './video-grid';
import { SessionTimer } from './session-timer';
import { GuestInvitePopover } from './guest-invite-popover';
import { WaitingGuestsBanner } from './waiting-guests-banner';
import { VideoChatPanel } from './video-chat-panel';
import { videoRoomOptions } from '@/lib/video/livekit-options';
import { useKrispNoiseFilter } from '@/hooks/use-krisp-noise-filter';
import { useScribeRecorder } from '@/hooks/use-scribe-recorder';
import { ScribeToggle } from './scribe-toggle';
import { MessageSquare } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

interface VideoRoomProps {
  token: string;
  wsUrl: string;
  appointmentId: string;
  plannedDurationMin: number;
  notesPanel: React.ReactNode;
  onCallEnd: () => void;
  scribeEnabled: boolean;
  patientScribeConsent: boolean;
  isPro: boolean;
  accessToken: string;
  onScribeToggle: () => void;
  onScribeUploadComplete: () => void;
  onScribeError: (msg: string) => void;
  /** Nom affiché dans le chat (ex: "Dr Dupont") */
  psyName: string;
}

type RightTab = 'notes' | 'chat';

function VideoLayout({
  appointmentId,
  plannedDurationMin,
  notesPanel,
  onCallEnd,
  scribeEnabled,
  patientScribeConsent,
  isPro,
  accessToken,
  onScribeToggle,
  onScribeUploadComplete,
  onScribeError,
  psyName,
}: Omit<VideoRoomProps, 'token' | 'wsUrl'>) {
  const [showNotes, setShowNotes] = useState(true);
  const [rightTab, setRightTab] = useState<RightTab>('notes');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const videoPanelRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveringControls = useRef(false);

  useKrispNoiseFilter();

  const { state: recorderState, start: startRecording, stopAndUpload, cancel: cancelRecording } =
    useScribeRecorder({
      appointmentId,
      accessToken,
      onUploadComplete: onScribeUploadComplete,
      onError: onScribeError,
    });

  const { blurEnabled, blurPending, toggleBlur } = useBackgroundBlur();
  const { elapsedSeconds, handleConnected, handleDisconnected, isReconnecting } = useVideoCall({
    onDisconnected: () => {},
  });

  const { messages: chatMessages, unreadCount, sendMessage, clearUnread } = useVideoChat({
    sender: 'psy',
    senderName: psyName,
  });

  const room = useRoomContext();
  const { localParticipant, isScreenShareEnabled } = useLocalParticipant();

  useEffect(() => {
    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    return () => {
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room, handleConnected, handleDisconnected]);

  // ----- Plein écran -----
  useEffect(() => {
    const handleChange = () => setIsFullscreen(document.fullscreenElement === videoPanelRef.current);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      videoPanelRef.current?.requestFullscreen().catch(() => {});
    }
  }, []);

  // ----- Contrôles flottants auto-masqués -----
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!hoveringControls.current) setControlsVisible(false);
    }, 3500);
  }, []);

  useEffect(() => {
    showControls();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [showControls]);

  // ----- Partage d'écran -----
  const toggleScreenShare = useCallback(() => {
    localParticipant.setScreenShareEnabled(!isScreenShareEnabled).catch(() => {});
  }, [localParticipant, isScreenShareEnabled]);

  // ----- Scribe -----
  useEffect(() => {
    if (scribeEnabled && recorderState === 'idle') startRecording();
    if (!scribeEnabled && recorderState === 'recording') cancelRecording();
  }, [scribeEnabled, recorderState, startRecording, cancelRecording]);

  const handleEndCall = useCallback(async () => {
    if (scribeEnabled && recorderState === 'recording') await stopAndUpload();
    else cancelRecording();
    onCallEnd();
  }, [scribeEnabled, recorderState, stopAndUpload, cancelRecording, onCallEnd]);

  // ----- Chat : ouvrir le panneau + switcher sur l'onglet -----
  const handleOpenChat = useCallback(() => {
    setShowNotes(true);
    setRightTab('chat');
    clearUnread();
  }, [clearUnread]);

  // Effacer les non-lus quand l'onglet Chat est actif
  useEffect(() => {
    if (rightTab === 'chat') clearUnread();
  }, [rightTab, chatMessages, clearUnread]);

  // ----- Tracks -----
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);
  const screenShareTracks = tracks.filter((t) => t.source === Track.Source.ScreenShare && t.publication);
  const remoteTracks = cameraTracks.filter((t) => !t.participant.isLocal);
  const localTrack = cameraTracks.find((t) => t.participant.isLocal);

  const chatBadge = unreadCount > 0 && rightTab !== 'chat';

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Panneau vidéo */}
      <div
        ref={videoPanelRef}
        onMouseMove={showControls}
        className={`relative bg-gray-900 ${showNotes ? 'w-[65%]' : 'w-full'} transition-all`}
      >
        {isReconnecting && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <p>Reconnexion en cours...</p>
            </div>
          </div>
        )}

        <VideoGrid remoteTracks={remoteTracks} localTrack={localTrack} screenShareTracks={screenShareTracks} />

        <div className="absolute left-4 top-4 z-20 rounded-full bg-white/90 px-3 py-1.5 shadow-md backdrop-blur">
          <SessionTimer elapsedSeconds={elapsedSeconds} plannedDurationMin={plannedDurationMin} />
        </div>

        <WaitingGuestsBanner appointmentId={appointmentId} />

        {/* Contrôles flottants */}
        <div
          onMouseEnter={() => {
            hoveringControls.current = true;
            setControlsVisible(true);
            if (hideTimer.current) clearTimeout(hideTimer.current);
          }}
          onMouseLeave={() => {
            hoveringControls.current = false;
            showControls();
          }}
          className={`absolute bottom-6 left-1/2 z-30 -translate-x-1/2 transition-opacity duration-300 ${
            controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <VideoControls
            showNotes={showNotes}
            onToggleNotes={() => setShowNotes((v) => !v)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            isScreenSharing={isScreenShareEnabled}
            onToggleScreenShare={toggleScreenShare}
            blurEnabled={blurEnabled}
            blurPending={blurPending}
            onToggleBlur={toggleBlur}
            inviteSlot={<GuestInvitePopover appointmentId={appointmentId} />}
            scribeSlot={
              <ScribeToggle
                isEnabled={scribeEnabled}
                patientConsented={patientScribeConsent}
                recorderState={recorderState}
                isPro={isPro}
                onToggle={onScribeToggle}
              />
            }
            chatSlot={
              <button
                onClick={handleOpenChat}
                className={`relative rounded-full p-3 transition-colors text-white ${
                  rightTab === 'chat' && showNotes
                    ? 'bg-[#0D9488] hover:bg-[#0b7d72]'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
                title="Chat texte"
              >
                <MessageSquare className="h-5 w-5" />
                {chatBadge && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            }
            onEndCall={handleEndCall}
          />
        </div>
      </div>

      {/* Panneau droit : Notes / Chat */}
      {showNotes && (
        <div className="flex w-[35%] flex-col overflow-hidden border-l border-border bg-white">
          {/* Tab switcher */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setRightTab('notes')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                rightTab === 'notes'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => { setRightTab('chat'); clearUnread(); }}
              className={`relative flex-1 py-3 text-sm font-medium transition-colors ${
                rightTab === 'chat'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Chat
              {chatBadge && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Contenu */}
          <div className="flex-1 overflow-hidden">
            {rightTab === 'notes' ? (
              <div className="h-full overflow-y-auto p-4">{notesPanel}</div>
            ) : (
              <VideoChatPanel
                messages={chatMessages}
                localSender="psy"
                onSend={sendMessage}
              />
            )}
          </div>
        </div>
      )}

      <RoomAudioRenderer />
    </div>
  );
}

export function PsyVideoRoom({
  token,
  wsUrl,
  appointmentId,
  plannedDurationMin,
  notesPanel,
  onCallEnd,
  scribeEnabled,
  patientScribeConsent,
  isPro,
  accessToken,
  onScribeToggle,
  onScribeUploadComplete,
  onScribeError,
  psyName,
}: VideoRoomProps) {
  return (
    <LiveKitRoom
      serverUrl={wsUrl}
      token={token}
      connect={true}
      video={true}
      audio={true}
      options={videoRoomOptions}
    >
      <VideoLayout
        appointmentId={appointmentId}
        plannedDurationMin={plannedDurationMin}
        notesPanel={notesPanel}
        onCallEnd={onCallEnd}
        scribeEnabled={scribeEnabled}
        patientScribeConsent={patientScribeConsent}
        isPro={isPro}
        accessToken={accessToken}
        onScribeToggle={onScribeToggle}
        onScribeUploadComplete={onScribeUploadComplete}
        onScribeError={onScribeError}
        psyName={psyName}
      />
    </LiveKitRoom>
  );
}
```

- [ ] **4.2 — Passer `psyName` dans la page qui instancie `PsyVideoRoom`**

Ouvrir `apps/web/src/app/(dashboard)/video/[roomId]/page.tsx`. Chercher l'endroit où `PsyVideoRoom` est rendu et ajouter la prop `psyName` :

```tsx
// Récupérer le nom du psy depuis la session (déjà disponible dans la page via useSession ou props)
// Exemple si la page expose `session.user.name` :
<PsyVideoRoom
  // ...props existantes...
  psyName={session?.user?.name ?? 'Psychologue'}
/>
```

- [ ] **4.3 — Vérifier TypeScript**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep -E "video-room|roomId"
```
Attendu : aucune erreur.

- [ ] **4.4 — Commit**

```bash
git add apps/web/src/components/video/video-room.tsx \
        apps/web/src/app/\(dashboard\)/video/\[roomId\]/page.tsx
git commit -m "feat(video-chat): integrate chat into psy video room — Notes/Chat tabs"
```

---

## Task 5 — Modifier `patient-video-room.tsx` (drawer chat)

**Files:**
- Modify: `apps/web/src/components/video/patient-video-room.tsx`

- [ ] **5.1 — Réécrire `patient-video-room.tsx` avec le drawer chat**

Remplacer l'intégralité du fichier :

```tsx
'use client';

import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  useRoomContext,
  RoomAudioRenderer,
  useLocalParticipant,
  useRemoteParticipants,
} from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, VideoIcon, VideoOff, User, PhoneOff, MessageSquare, X } from 'lucide-react';
import { videoRoomOptions } from '@/lib/video/livekit-options';
import { useKrispNoiseFilter } from '@/hooks/use-krisp-noise-filter';
import { useVideoChat } from '@/hooks/use-video-chat';
import { VideoChatPanel } from './video-chat-panel';

interface PatientLayoutProps {
  onConnectionFailed: () => void;
  exitHref?: string;
  exitLabel?: string;
  patientName?: string;
}

function PatientLayout({
  onConnectionFailed,
  exitHref = '/patient-portal',
  exitLabel = 'Retour a mon espace',
  patientName = 'Patient',
}: PatientLayoutProps) {
  const { localParticipant, isMicrophoneEnabled: isMicOn, isCameraEnabled: isCamOn } = useLocalParticipant();
  useKrispNoiseFilter();
  const room = useRoomContext();
  const [disconnected, setDisconnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const hasConnected = useRef(false);

  const { messages: chatMessages, unreadCount, sendMessage, clearUnread } = useVideoChat({
    sender: 'patient',
    senderName: patientName,
  });

  useEffect(() => {
    const onConnected = () => { hasConnected.current = true; };
    const onDisconnected = () => {
      if (hasConnected.current) setDisconnected(true);
      else onConnectionFailed();
    };
    const onReconnecting = () => setReconnecting(true);
    const onReconnected = () => setReconnecting(false);
    room.on(RoomEvent.Connected, onConnected);
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.Reconnecting, onReconnecting);
    room.on(RoomEvent.Reconnected, onReconnected);
    return () => {
      room.off(RoomEvent.Connected, onConnected);
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.Reconnecting, onReconnecting);
      room.off(RoomEvent.Reconnected, onReconnected);
    };
  }, [room, onConnectionFailed]);

  const remoteParticipants = useRemoteParticipants();
  const psyIsPresent = remoteParticipants.length > 0;
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const remoteTracks = tracks.filter((t) => !t.participant.isLocal);
  const localTrack = tracks.find((t) => t.participant.isLocal);
  const psyVideoTrack = remoteTracks.find((t) => t.publication != null);

  const handleLeave = () => {
    setDisconnected(true);
    void room.disconnect();
  };

  const handleOpenChat = () => {
    setChatOpen(true);
    clearUnread();
  };

  if (reconnecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <h1 className="mb-2 text-xl font-bold text-foreground">Reconnexion en cours...</h1>
          <p className="text-muted-foreground">Veuillez patienter, la connexion sera retablie automatiquement.</p>
        </div>
      </div>
    );
  }

  if (disconnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="p-8 text-center">
          <h1 className="mb-2 text-xl font-bold text-foreground">La consultation est terminee</h1>
          <p className="mb-4 text-muted-foreground">Merci. Prenez soin de vous.</p>
          <a
            href={exitHref}
            className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            {exitLabel}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col bg-gray-900">
      {/* Zone vidéo */}
      <div className="relative flex-1">
        {psyIsPresent ? (
          psyVideoTrack ? (
            <VideoTrack trackRef={psyVideoTrack} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-white/60">
                <User className="mx-auto mb-4 h-20 w-20 opacity-40" />
                <p>Psychologue connecté</p>
                <p className="mt-1 text-sm opacity-60">Caméra désactivée</p>
              </div>
            </div>
          )
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-white/60">
              <User className="mx-auto mb-4 h-20 w-20 opacity-40" />
              <p>En attente de votre psychologue...</p>
            </div>
          </div>
        )}

        {localTrack?.publication && (
          <div className="absolute bottom-4 right-4 h-32 w-40 overflow-hidden rounded-lg border-2 border-white/20">
            <VideoTrack trackRef={localTrack} className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      {/* Barre de contrôles */}
      <div className="flex items-center justify-center gap-3 bg-gray-900 px-4 py-4">
        <button
          onClick={() => localParticipant.setMicrophoneEnabled(!isMicOn)}
          className={`rounded-full p-3 ${isMicOn ? 'bg-gray-700 text-white' : 'bg-red-600 text-white'}`}
        >
          {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        <button
          onClick={() => localParticipant.setCameraEnabled(!isCamOn)}
          className={`rounded-full p-3 ${isCamOn ? 'bg-gray-700 text-white' : 'bg-red-600 text-white'}`}
        >
          {isCamOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>

        {/* Bouton chat avec badge */}
        <button
          onClick={handleOpenChat}
          className={`relative rounded-full p-3 text-white ${
            chatOpen ? 'bg-[#0D9488]' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Chat texte"
        >
          <MessageSquare className="h-5 w-5" />
          {unreadCount > 0 && !chatOpen && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={handleLeave}
          className="ml-2 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          <PhoneOff className="h-5 w-5" />
          Quitter
        </button>
      </div>

      {/* Drawer chat slide-up */}
      {chatOpen && (
        <div className="absolute inset-x-0 bottom-[72px] z-40 flex h-[45%] flex-col rounded-t-2xl border-t border-white/10 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Chat</h3>
            <button
              onClick={() => setChatOpen(false)}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <VideoChatPanel
              messages={chatMessages}
              localSender="patient"
              onSend={sendMessage}
            />
          </div>
        </div>
      )}

      <RoomAudioRenderer />
    </div>
  );
}

interface PatientVideoRoomProps {
  token: string;
  wsUrl: string;
  onConnectionFailed: () => void;
  exitHref?: string;
  exitLabel?: string;
  patientName?: string;
}

export function PatientVideoRoom({
  token,
  wsUrl,
  onConnectionFailed,
  exitHref,
  exitLabel,
  patientName,
}: PatientVideoRoomProps) {
  return (
    <LiveKitRoom serverUrl={wsUrl} token={token} connect={true} video={true} audio={true} options={videoRoomOptions}>
      <PatientLayout
        onConnectionFailed={onConnectionFailed}
        exitHref={exitHref}
        exitLabel={exitLabel}
        patientName={patientName}
      />
    </LiveKitRoom>
  );
}
```

- [ ] **5.2 — Passer `patientName` dans la page patient qui instancie `PatientVideoRoom`**

Ouvrir `apps/web/src/app/(patient-video)/patient-portal/video/[token]/page.tsx`. Trouver où `PatientVideoRoom` est rendu et ajouter :

```tsx
<PatientVideoRoom
  // ...props existantes...
  patientName={patientDisplayName ?? 'Patient'}
/>
```

`patientDisplayName` est typiquement disponible dans la réponse du endpoint `POST /video/join/:token` (il retourne le nom du patient). Si ce n'est pas le cas, utiliser la valeur saisie dans `WaitingRoom` (champ nom).

- [ ] **5.3 — Vérifier TypeScript (tous les fichiers vidéo)**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | grep -E "video"
```
Attendu : aucune erreur.

- [ ] **5.4 — Commit**

```bash
git add apps/web/src/components/video/patient-video-room.tsx \
        "apps/web/src/app/(patient-video)/patient-portal/video/[token]/page.tsx"
git commit -m "feat(video-chat): integrate chat into patient video room — slide-up drawer"
```

---

## Task 6 — Vérification finale et déploiement

- [ ] **6.1 — Lancer tous les tests**

```bash
cd apps/web && pnpm vitest run
```
Attendu : tous les tests passent, aucune régression.

- [ ] **6.2 — Build Next.js**

```bash
cd apps/web && pnpm build 2>&1 | tail -20
```
Attendu : build réussi, aucune erreur TypeScript.

- [ ] **6.3 — Déploiement Vercel**

```bash
cd C:/Users/tonyr/OneDrive/Projet/PsyFlow && npx vercel --prod --yes
```

- [ ] **6.4 — Test manuel rapide**

1. Ouvrir une visio en tant que psy → vérifier l'onglet "Chat" dans le panneau droit.
2. Ouvrir le lien patient dans un autre onglet → vérifier le bouton chat en bas + drawer.
3. Envoyer un message depuis le psy → vérifié reçu côté patient avec badge rouge.
4. Envoyer depuis le patient → reçu côté psy avec badge sur l'onglet Chat.

- [ ] **6.5 — Mettre à jour la mémoire projet**

Ajouter dans `C:\Users\tonyr\.claude\projects\C--Users-tonyr-OneDrive-Projet-PsyFlow\memory\video-consultation.md` (section features déployées) :

```
## Chat texte en séance ✅ DÉPLOYÉ (2026-06-05)
- LiveKit DataChannel P2P — aucun serveur, aucune persistance (HDS-safe)
- Côté psy : onglets Notes/Chat dans le panneau droit, badge rouge si non-lus
- Côté patient : drawer slide-up 45%, badge rouge sur bouton chat
- Hook `use-video-chat.ts` + composant partagé `video-chat-panel.tsx`
- `psyName` prop sur PsyVideoRoom, `patientName` prop sur PatientVideoRoom
```
