import { describe, it, expect } from 'vitest';
import { parisToUtcIso } from './paris-time';

describe('parisToUtcIso', () => {
  // Regression: a 10:40 Paris slot used to be pushed to Google Calendar as
  // 12:40 (+2h) because the naive datetime was parsed as browser-local time
  // and the offset was applied with the wrong sign.
  it('converts a summer (CEST, +2) Paris slot to the correct UTC instant', () => {
    expect(parisToUtcIso('2026-07-02', '10:40')).toBe('2026-07-02T08:40:00.000Z');
  });

  it('converts a winter (CET, +1) Paris slot to the correct UTC instant', () => {
    expect(parisToUtcIso('2026-01-15', '10:40')).toBe('2026-01-15T09:40:00.000Z');
  });

  it('handles midnight and end-of-day boundaries', () => {
    expect(parisToUtcIso('2026-07-02', '00:00')).toBe('2026-07-01T22:00:00.000Z');
    expect(parisToUtcIso('2026-07-02', '23:30')).toBe('2026-07-02T21:30:00.000Z');
  });
});
