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
