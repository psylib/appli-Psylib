import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RoomEvent } from 'livekit-client';

vi.stubGlobal('URL', Object.assign(globalThis.URL, { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} }));

const mockPublishData = vi.fn().mockResolvedValue(undefined);
const handlers: Record<string, (...args: unknown[]) => void> = {};
const mockRoom = {
  localParticipant: { publishData: mockPublishData },
  on: vi.fn((evt: string, cb: (...args: unknown[]) => void) => { handlers[evt] = cb; }),
  off: vi.fn(),
};
vi.mock('@livekit/components-react', () => ({
  useRoomContext: () => mockRoom,
}));

import { useDocPresentation } from '../use-doc-presentation';

const encoder = new TextEncoder();
function receive(obj: unknown) {
  act(() => { handlers[RoomEvent.DataReceived]?.(encoder.encode(JSON.stringify(obj))); });
}
function receiveRaw(s: string) {
  act(() => { handlers[RoomEvent.DataReceived]?.(encoder.encode(s)); });
}

describe('useDocPresentation', () => {
  beforeEach(() => { vi.clearAllMocks(); for (const k of Object.keys(handlers)) delete handlers[k]; });

  it('starts with no presented document', () => {
    const { result } = renderHook(() => useDocPresentation());
    expect(result.current.presented).toBeNull();
  });

  it('presentDocument publishes a start message then one message per chunk', () => {
    const { result } = renderHook(() => useDocPresentation());
    const bytes = new Uint8Array(700).fill(65);
    act(() => { result.current.presentDocument({ fileName: 'a.pdf', mimeType: 'application/pdf' }, bytes); });
    expect(mockPublishData.mock.calls.length).toBeGreaterThan(1);
  });

  it('reassembles received chunks into a presented document', () => {
    const { result } = renderHook(() => useDocPresentation());
    receive({ kind: 'doc-start', docId: 'd1', fileName: 'x.png', mimeType: 'image/png', totalChunks: 1 });
    receive({ kind: 'doc-chunk', docId: 'd1', i: 0, data: 'Qg==' });
    expect(result.current.presented).not.toBeNull();
    expect(result.current.presented?.fileName).toBe('x.png');
    expect(result.current.presented?.mimeType).toBe('image/png');
  });

  it('doc-close clears the presented document', () => {
    const { result } = renderHook(() => useDocPresentation());
    receive({ kind: 'doc-start', docId: 'd1', fileName: 'x.png', mimeType: 'image/png', totalChunks: 1 });
    receive({ kind: 'doc-chunk', docId: 'd1', i: 0, data: 'Qg==' });
    receive({ kind: 'doc-close', docId: 'd1' });
    expect(result.current.presented).toBeNull();
  });

  it('ignores malformed packets and foreign kinds (e.g. chat)', () => {
    const { result } = renderHook(() => useDocPresentation());
    receive({ sender: 'patient', text: 'hi', id: '1', senderName: 'A', timestamp: 1 });
    receiveRaw('not json');
    expect(result.current.presented).toBeNull();
  });

  it('cleans up the listener on unmount', () => {
    const { unmount } = renderHook(() => useDocPresentation());
    expect(mockRoom.on).toHaveBeenCalledWith(RoomEvent.DataReceived, expect.any(Function));
    unmount();
    expect(mockRoom.off).toHaveBeenCalledWith(RoomEvent.DataReceived, expect.any(Function));
  });
});
