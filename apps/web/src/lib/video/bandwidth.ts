export type BandwidthQuality = 'good' | 'fair' | 'poor';
export type BandwidthStatus = 'testing' | 'done' | 'error';

export interface BandwidthResult {
  mbps: number;
  quality: BandwidthQuality;
  status: BandwidthStatus;
}

/** Seuils alignés sur LiveKit VP9 720p. */
export function classifyBandwidth(mbps: number): BandwidthQuality {
  if (mbps >= 1.5) return 'good';
  if (mbps >= 0.5) return 'fair';
  return 'poor';
}

interface MeasureOptions {
  fetchImpl?: typeof fetch;
  now?: () => number;
}

/**
 * Sonde de débit active : télécharge un asset de taille connue et mesure le
 * débit descendant. Non bloquant — en cas d'échec renvoie status 'error'.
 */
export async function measureBandwidth(
  probeUrl: string,
  opts: MeasureOptions = {},
): Promise<BandwidthResult> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const now = opts.now ?? (() => performance.now());
  try {
    const start = now();
    const res = await fetchImpl(`${probeUrl}?t=${start}`, { cache: 'no-store' });
    if (!res.ok) return { mbps: 0, quality: 'poor', status: 'error' };
    const buf = await res.arrayBuffer();
    const elapsedSec = Math.max((now() - start) / 1000, 0.001);
    const mbps = (buf.byteLength * 8) / 1e6 / elapsedSec;
    return { mbps, quality: classifyBandwidth(mbps), status: 'done' };
  } catch {
    return { mbps: 0, quality: 'poor', status: 'error' };
  }
}
