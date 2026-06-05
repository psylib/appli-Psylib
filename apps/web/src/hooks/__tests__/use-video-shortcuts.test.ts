import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVideoShortcuts } from '../use-video-shortcuts';

function press(key: string, target?: EventTarget) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  if (target) {
    Object.defineProperty(event, 'target', { value: target, enumerable: true });
    target.dispatchEvent(event);
  } else {
    window.dispatchEvent(event);
  }
  return event;
}

describe('useVideoShortcuts', () => {
  let handlers: {
    onToggleMic: ReturnType<typeof vi.fn>;
    onToggleCamera: ReturnType<typeof vi.fn>;
    onToggleFullscreen: ReturnType<typeof vi.fn>;
    onToggleChat: ReturnType<typeof vi.fn>;
    onToggleHelp: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    handlers = {
      onToggleMic: vi.fn(),
      onToggleCamera: vi.fn(),
      onToggleFullscreen: vi.fn(),
      onToggleChat: vi.fn(),
      onToggleHelp: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('maps m/v/f/c keys to their handlers (case-insensitive)', () => {
    renderHook(() => useVideoShortcuts(handlers));
    press('m');
    press('V');
    press('f');
    press('C');
    expect(handlers.onToggleMic).toHaveBeenCalledOnce();
    expect(handlers.onToggleCamera).toHaveBeenCalledOnce();
    expect(handlers.onToggleFullscreen).toHaveBeenCalledOnce();
    expect(handlers.onToggleChat).toHaveBeenCalledOnce();
  });

  it('maps ? to the help handler', () => {
    renderHook(() => useVideoShortcuts(handlers));
    press('?');
    expect(handlers.onToggleHelp).toHaveBeenCalledOnce();
  });

  it('ignores keys when typing in an input', () => {
    renderHook(() => useVideoShortcuts(handlers));
    const input = document.createElement('input');
    document.body.appendChild(input);
    press('m', input);
    expect(handlers.onToggleMic).not.toHaveBeenCalled();
    input.remove();
  });

  it('ignores keys when typing in a textarea', () => {
    renderHook(() => useVideoShortcuts(handlers));
    const ta = document.createElement('textarea');
    document.body.appendChild(ta);
    press('v', ta);
    expect(handlers.onToggleCamera).not.toHaveBeenCalled();
    ta.remove();
  });

  it('ignores keys pressed with a modifier (Ctrl/Meta/Alt)', () => {
    renderHook(() => useVideoShortcuts(handlers));
    const event = new KeyboardEvent('keydown', { key: 'm', ctrlKey: true });
    window.dispatchEvent(event);
    expect(handlers.onToggleMic).not.toHaveBeenCalled();
  });

  it('does nothing when disabled', () => {
    renderHook(() => useVideoShortcuts({ ...handlers, enabled: false }));
    press('m');
    expect(handlers.onToggleMic).not.toHaveBeenCalled();
  });

  it('cleans up the listener on unmount', () => {
    const { unmount } = renderHook(() => useVideoShortcuts(handlers));
    unmount();
    press('m');
    expect(handlers.onToggleMic).not.toHaveBeenCalled();
  });

  it('ignores unmapped keys', () => {
    renderHook(() => useVideoShortcuts(handlers));
    press('z');
    expect(handlers.onToggleMic).not.toHaveBeenCalled();
    expect(handlers.onToggleCamera).not.toHaveBeenCalled();
  });
});
