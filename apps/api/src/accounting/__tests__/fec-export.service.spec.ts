import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FecExportService } from '../fec-export.service';

const mockPrisma = {
  accountingEntry: {
    findMany: vi.fn(),
  },
};

function createService(): FecExportService {
  return new FecExportService(mockPrisma as never);
}

function makeEntry(overrides: Record<string, unknown> = {}) {
  return {
    entryType: 'income',
    date: new Date('2026-03-15T00:00:00Z'),
    ecritureNum: 1,
    category: 'HONORAIRES',
    counterpart: 'Jean Dupont',
    pieceRef: 'PSY-2026-0001',
    label: 'Consultation',
    debit: 0,
    credit: 60,
    ...overrides,
  };
}

describe('FecExportService — field escaping', () => {
  beforeEach(() => {
    mockPrisma.accountingEntry.findMany.mockReset();
  });

  it('keeps every data row at exactly 18 pipe-delimited columns', async () => {
    mockPrisma.accountingEntry.findMany.mockResolvedValue([makeEntry()]);
    const fec = await createService().generateFec('psy-1', 2026);
    const dataRow = fec.split('\n')[1];
    expect(dataRow.split('|')).toHaveLength(18);
  });

  it('strips injected pipes and newlines from counterpart, pieceRef and label', async () => {
    mockPrisma.accountingEntry.findMany.mockResolvedValue([
      makeEntry({
        counterpart: 'Evil|Name',
        pieceRef: 'REF|\n9999',
        label: 'Consult\r\n|injected',
      }),
    ]);
    const fec = await createService().generateFec('psy-1', 2026);
    const lines = fec.split('\n');
    // Header + exactly one data line — no extra lines smuggled in via \n.
    expect(lines).toHaveLength(2);
    const dataRow = lines[1];
    expect(dataRow.split('|')).toHaveLength(18);
    expect(dataRow).not.toContain('Evil|Name');
    expect(dataRow).toContain('Evil Name');
  });
});
