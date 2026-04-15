import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { BNC_ACCOUNT_CODES } from './bnc-account-codes';

/**
 * FEC Export Service — Fichier des Écritures Comptables
 *
 * Generates a pipe-delimited text file conforming to the French DGFiP FEC standard
 * (Article A. 47 A-1 du Livre des procédures fiscales).
 *
 * Format: 18 columns, pipe-delimited, no quotes, French decimal comma notation.
 */
@Injectable()
export class FecExportService {
  private readonly logger = new Logger(FecExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateFec(psychologistId: string, year: number): Promise<string> {
    this.logger.log(`Generating FEC for psychologistId=${psychologistId} year=${year}`);

    const entries = await this.prisma.accountingEntry.findMany({
      where: {
        psychologistId,
        fiscalYear: year,
        deletedAt: null,
      },
      orderBy: { ecritureNum: 'asc' },
    });

    const header =
      'JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcrtureLet|DateLet|ValidDate|Montantdevise|Idevise';

    const lines = entries.map((entry) => {
      const journalCode = entry.entryType === 'income' ? 'VE' : 'AC';
      const journalLib =
        entry.entryType === 'income'
          ? 'Journal des recettes'
          : 'Journal des depenses';
      const ecritureDate = formatDateFec(entry.date);

      const honorairesEntry = BNC_ACCOUNT_CODES['HONORAIRES'];
      const categoryEntry = BNC_ACCOUNT_CODES[entry.category];

      const compteNum =
        entry.entryType === 'income'
          ? (honorairesEntry?.code ?? '706000')
          : (categoryEntry?.code ?? '671000');

      const compteLib =
        entry.entryType === 'income'
          ? (honorairesEntry?.label ?? 'Honoraires')
          : (categoryEntry?.label ?? 'Charges diverses');

      return [
        journalCode,
        journalLib,
        String(entry.ecritureNum ?? ''),
        ecritureDate,
        compteNum,
        compteLib,
        entry.counterpart ?? '',   // CompAuxNum — contrepartie (patient name for income)
        entry.counterpart ?? '',   // CompAuxLib
        entry.pieceRef ?? '',      // PieceRef — numéro de facture ou reçu
        ecritureDate,              // PieceDate — same as EcritureDate
        sanitizeFecField(entry.label),
        formatAmount(Number(entry.debit)),
        formatAmount(Number(entry.credit)),
        '',  // EcrtureLet — lettrage (non utilisé)
        '',  // DateLet
        ecritureDate,  // ValidDate — date de validation
        '',  // Montantdevise (multi-devises non utilisé)
        '',  // Idevise
      ].join('|');
    });

    this.logger.log(
      `FEC generated: ${lines.length} entries for year=${year}`,
    );

    return [header, ...lines].join('\n');
  }
}

/**
 * Format a date as YYYYMMDD (DGFiP FEC format — no separators).
 */
function formatDateFec(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Format a monetary amount with 2 decimal places using French comma separator.
 * Zero is represented as "0,00".
 */
function formatAmount(amount: number): string {
  if (amount === 0) return '0,00';
  return amount.toFixed(2).replace('.', ',');
}

/**
 * Remove pipe characters from field values to avoid breaking the FEC format.
 */
function sanitizeFecField(value: string): string {
  return value.replace(/\|/g, ' ');
}
