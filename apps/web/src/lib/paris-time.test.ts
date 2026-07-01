import { describe, it, expect } from 'vitest';
import {
  parisToUtcIso,
  parisDateTimeLocalToUtcIso,
  utcIsoToParisDateTimeLocal,
  parisNowDateTimeLocal,
} from './paris-time';

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

describe('parisDateTimeLocalToUtcIso', () => {
  it('converts a datetime-local (Paris) value to UTC ISO', () => {
    expect(parisDateTimeLocalToUtcIso('2026-07-02T10:40')).toBe('2026-07-02T08:40:00.000Z');
    expect(parisDateTimeLocalToUtcIso('2026-01-15T10:40')).toBe('2026-01-15T09:40:00.000Z');
  });

  it('returns empty string for empty/invalid input', () => {
    expect(parisDateTimeLocalToUtcIso('')).toBe('');
    expect(parisDateTimeLocalToUtcIso('2026-07-02')).toBe('');
  });
});

describe('utcIsoToParisDateTimeLocal', () => {
  it('formats a UTC ISO instant as a Paris datetime-local value', () => {
    expect(utcIsoToParisDateTimeLocal('2026-07-02T08:40:00.000Z')).toBe('2026-07-02T10:40');
    expect(utcIsoToParisDateTimeLocal('2026-01-15T09:40:00.000Z')).toBe('2026-01-15T10:40');
  });
});

describe('round-trip: datetime-local → UTC → datetime-local is stable', () => {
  for (const local of ['2026-07-02T10:40', '2026-01-15T08:05', '2026-12-31T23:59']) {
    it(local, () => {
      const iso = parisDateTimeLocalToUtcIso(local);
      expect(utcIsoToParisDateTimeLocal(iso)).toBe(local);
    });
  }
});

describe('parisNowDateTimeLocal', () => {
  it('produces a well-formed YYYY-MM-DDTHH:MM value', () => {
    expect(parisNowDateTimeLocal()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
