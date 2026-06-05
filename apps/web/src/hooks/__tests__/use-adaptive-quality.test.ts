import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ConnectionQuality, RoomEvent } from 'livekit-client';

const mockSetCameraEnabled = vi.fn().mockResolvedValue(undefined);
const localParticipant = { isLocal: true, setCameraEnabled: mockSetCameraEnabled };
const handlers: Record<string, (...args: unknown[]) => void> = {};
const mockRoom = {
  localParticipant,
  on: vi.fn((evt: string, cb: (...args: unknown[]) => void) => { handlers[evt] = cb; }),
  off: vi.fn(),
};

vi.mock('@livekit/components-react', () => ({
  useRoomContext: () => mockRoom,
  useLocalParticipant: () => ({ localParticipant, isCameraEnabled: true }),
}));

import { useAdaptiveQuality } from '../use-adaptive-quality';

function emitQuality(q: ConnectionQuality) {
  act(() => { handlers[RoomEvent.ConnectionQualityChanged]?.(q, localParticipant); });
}

describe('useAdaptiveQuality', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('does not degrade before 6s of poor quality', () => {
    const { result } = renderHook(() => useAdaptiveQuality());
    emitQuality(ConnectionQuality.Poor);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(mockSetCameraEnabled).not.toHaveBeenCalled();
    expect(result.current.degraded).toBe(false);
  });

  it('auto-degrades after 6s of continuous poor quality', () => {
    const { result } = renderHook(() => useAdaptiveQuality());
    emitQuality(ConnectionQuality.Poor);
    act(() => { vi.advanceTimersByTime(6000); });
    expect(mockSetCameraEnabled).toHaveBeenCalledWith(false);
    expect(result.current.degraded).toBe(true);
    expect(result.current.reason).toBe('auto');
  });

  it('cancels degrade timer if quality recovers in time', () => {
    renderHook(() => useAdaptiveQuality());
    emitQuality(ConnectionQuality.Poor);
    act(() => { vi.advanceTimersByTime(3000); });
    emitQuality(ConnectionQuality.Good);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(mockSetCameraEnabled).not.toHaveBeenCalled();
  });

  it('forceAudioOnly disables camera with manual reason', () => {
    const { result } = renderHook(() => useAdaptiveQuality());
    act(() => { result.current.forceAudioOnly(); });
    expect(mockSetCameraEnabled).toHaveBeenCalledWith(false);
    expect(result.current.reason).toBe('manual');
  });

  it('restoreVideo re-enables camera and clears degraded state', () => {
    const { result } = renderHook(() => useAdaptiveQuality());
    act(() => { result.current.forceAudioOnly(); });
    act(() => { result.current.restoreVideo(); });
    expect(mockSetCameraEnabled).toHaveBeenLastCalledWith(true);
    expect(result.current.degraded).toBe(false);
    expect(result.current.reason).toBe(null);
  });

  it('cleans up listener on unmount', () => {
    const { unmount } = renderHook(() => useAdaptiveQuality());
    unmount();
    expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.ConnectionQualityChanged, expect.any(Function));
  });
});
