import { describe, it, expect, vi } from 'vitest';
import { classifyBandwidth, measureBandwidth } from '../bandwidth';

describe('classifyBandwidth', () => {
  it('returns good at or above 1.5 Mbps', () => {
    expect(classifyBandwidth(1.5)).toBe('good');
    expect(classifyBandwidth(5)).toBe('good');
  });
  it('returns fair between 0.5 and 1.5 Mbps', () => {
    expect(classifyBandwidth(0.5)).toBe('fair');
    expect(classifyBandwidth(1.4)).toBe('fair');
  });
  it('returns poor below 0.5 Mbps', () => {
    expect(classifyBandwidth(0.49)).toBe('poor');
    expect(classifyBandwidth(0)).toBe('poor');
  });
});

describe('measureBandwidth', () => {
  it('computes mbps from payload size and elapsed time', async () => {
    const bytes = 800_000;
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(bytes),
    });
    const times = [0, 1000];
    const now = vi.fn(() => times.shift() ?? 1000);
    const result = await measureBandwidth('/bandwidth-probe.bin', { fetchImpl, now });
    expect(result.status).toBe('done');
    expect(result.mbps).toBeCloseTo(6.4, 1);
    expect(result.quality).toBe('good');
  });

  it('returns error status when fetch rejects', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network'));
    const result = await measureBandwidth('/bandwidth-probe.bin', { fetchImpl, now: () => 0 });
    expect(result.status).toBe('error');
    expect(result.quality).toBe('poor');
  });

  it('returns error status when response not ok', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, arrayBuffer: async () => new ArrayBuffer(0) });
    const result = await measureBandwidth('/bandwidth-probe.bin', { fetchImpl, now: () => 0 });
    expect(result.status).toBe('error');
  });
});
