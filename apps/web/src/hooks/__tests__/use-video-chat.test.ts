import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RoomEvent } from 'livekit-client';

// Mock useRoomContext
const mockPublishData = vi.fn().mockResolvedValue(undefined);
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
    mockPublishData.mockResolvedValue(undefined);
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
