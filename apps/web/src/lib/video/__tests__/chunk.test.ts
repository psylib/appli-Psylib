import { describe, it, expect } from 'vitest';
import { bytesToChunks, chunksToBlob } from '../chunk';

describe('chunk', () => {
  it('splits bytes into chunks of the given size', () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7]);
    const chunks = bytesToChunks(bytes, 3);
    expect(chunks).toHaveLength(3);
    expect(chunks.every((c) => typeof c === 'string' && c.length > 0)).toBe(true);
  });

  it('round-trips bytes through chunks back to a Blob of the same size', async () => {
    const bytes = new Uint8Array(1000).map((_, i) => i % 256);
    const chunks = bytesToChunks(bytes, 256);
    const blob = chunksToBlob(chunks, 'application/pdf');
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBe(1000);
    const roundTripped = new Uint8Array(await blob.arrayBuffer());
    expect(Array.from(roundTripped)).toEqual(Array.from(bytes));
  });

  it('handles empty input', () => {
    expect(bytesToChunks(new Uint8Array([]), 256)).toEqual([]);
    expect(chunksToBlob([], 'image/png').size).toBe(0);
  });
});
