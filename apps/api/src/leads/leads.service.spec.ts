import { vi, describe, it, expect } from 'vitest';
import { LeadsService } from './leads.service';

// Audit 2026-06-05: Lead.ip (PII) doit être anonymisée après 30 jours
// (rétention documentée dans le schéma, jamais appliquée).

describe('LeadsService.purgeOldLeadIps', () => {
  it('anonymise (ip=null) les leads de plus de 30 jours ayant encore une IP', async () => {
    const prisma = {
      lead: { updateMany: vi.fn().mockResolvedValue({ count: 3 }) },
    };
    const service = new LeadsService(prisma as any);

    await service.purgeOldLeadIps();

    expect(prisma.lead.updateMany).toHaveBeenCalledTimes(1);
    const arg = prisma.lead.updateMany.mock.calls[0][0];
    expect(arg.data).toEqual({ ip: null });
    expect(arg.where.ip).toEqual({ not: null });
    // borne ~30 jours dans le passé
    const cutoff = arg.where.createdAt.lt as Date;
    const days = (Date.now() - cutoff.getTime()) / 86400000;
    expect(days).toBeGreaterThan(29);
    expect(days).toBeLessThan(31);
  });
});
