import { vi, describe, it, expect } from 'vitest';
import { InvoicesService } from './invoices.service';

// H (audit 2026-06-05): la numérotation de facture cassait au-delà de 999 à cause
// d'un tri lexicographique (PSY-2026-1000 < PSY-2026-999). nextInvoiceNumber doit
// calculer la séquence NUMÉRIQUEMENT.

function buildService(invoiceNumbers: string[]) {
  const tx = {
    invoice: {
      findMany: vi.fn().mockResolvedValue(invoiceNumbers.map((invoiceNumber) => ({ invoiceNumber }))),
    },
  };
  const service = new InvoicesService({} as any, {} as any, {} as any, {} as any);
  return { service, tx };
}

describe('InvoicesService.nextInvoiceNumber', () => {
  it('démarre à 001 sans facture existante', async () => {
    const { service, tx } = buildService([]);
    const n = await (service as any).nextInvoiceNumber(tx, 'psy1', 2026, 0);
    expect(n).toBe('PSY-2026-001');
  });

  it('passe de 999 à 1000 (le tri lexicographique cassait ici)', async () => {
    const { service, tx } = buildService(['PSY-2026-001', 'PSY-2026-999']);
    const n = await (service as any).nextInvoiceNumber(tx, 'psy1', 2026, 0);
    expect(n).toBe('PSY-2026-1000');
  });

  it('prend le max NUMÉRIQUE, pas lexicographique', async () => {
    const { service, tx } = buildService(['PSY-2026-1000', 'PSY-2026-002', 'PSY-2026-999']);
    const n = await (service as any).nextInvoiceNumber(tx, 'psy1', 2026, 0);
    expect(n).toBe('PSY-2026-1001');
  });

  it('décale la séquence avec l\'attempt (retry après P2002)', async () => {
    const { service, tx } = buildService(['PSY-2026-005']);
    const n = await (service as any).nextInvoiceNumber(tx, 'psy1', 2026, 2);
    expect(n).toBe('PSY-2026-008');
  });
});

describe('InvoicesService.update', () => {
  function buildUpdateService(invoice: any, patientExists = true) {
    const prisma = {
      psychologist: { findUnique: vi.fn().mockResolvedValue({ id: 'psy1' }) },
      patient: {
        findFirst: vi.fn().mockResolvedValue(patientExists ? { id: 'patient2' } : null),
      },
      invoice: {
        findFirst: vi.fn().mockResolvedValue(invoice),
        update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...invoice, ...data })),
      },
    };
    const service = new InvoicesService(prisma as any, {} as any, {} as any, {} as any);
    return { service, prisma };
  }

  it('modifie une facture en brouillon (montant + date)', async () => {
    const { service, prisma } = buildUpdateService({
      id: 'inv1',
      status: 'draft',
      patientId: 'patient1',
    });
    await service.update('user1', 'inv1', { amountTtc: 80, issuedAt: '2026-04-01' });
    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'inv1' },
        data: expect.objectContaining({ amountTtc: 80 }),
      }),
    );
  });

  it('refuse de modifier une facture envoyée', async () => {
    const { service } = buildUpdateService({ id: 'inv1', status: 'sent', patientId: 'p1' });
    await expect(service.update('user1', 'inv1', { amountTtc: 80 })).rejects.toThrow(
      /brouillon/i,
    );
  });

  it('refuse de modifier une facture payée', async () => {
    const { service } = buildUpdateService({ id: 'inv1', status: 'paid', patientId: 'p1' });
    await expect(service.update('user1', 'inv1', { amountTtc: 80 })).rejects.toThrow(
      /brouillon/i,
    );
  });

  it('rejette un changement vers un patient inexistant', async () => {
    const { service } = buildUpdateService(
      { id: 'inv1', status: 'draft', patientId: 'patient1' },
      false,
    );
    await expect(
      service.update('user1', 'inv1', { patientId: 'patient2' }),
    ).rejects.toThrow(/patient introuvable/i);
  });

  it('rejette une facture introuvable', async () => {
    const { service } = buildUpdateService(null);
    await expect(service.update('user1', 'inv1', { amountTtc: 80 })).rejects.toThrow(
      /facture introuvable/i,
    );
  });
});
