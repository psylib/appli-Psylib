import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AccountingEntryType, ExpenseCategory, ExpensePaymentMethod } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { PaymentCompletedEvent } from './events/payment-completed.event';

export interface CreateExpenseEntryData {
  date: Date;
  label: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: ExpensePaymentMethod;
  expenseId: string;
}

export interface UpdateExpenseEntryData {
  date?: Date;
  label?: string;
  amount?: number;
  category?: ExpenseCategory;
  paymentMethod?: ExpensePaymentMethod;
}

export interface CreateIncomeEntryData {
  date: Date;
  label: string;
  amount: number;
  paymentMethod: string;
  invoiceId?: string | null;
  paymentId?: string | null;
  patientName: string;
  pieceRef?: string | null;
}

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Creates an AccountingEntry of type `expense` when an expense is created.
   * Assigns ecritureNum from getNextEcritureNum for the entry's fiscal year.
   */
  async createExpenseEntry(
    psychologistId: string,
    data: CreateExpenseEntryData,
  ) {
    const fiscalYear = new Date(data.date).getFullYear();
    const ecritureNum = await this.getNextEcritureNum(psychologistId, fiscalYear);

    const entry = await this.prisma.accountingEntry.create({
      data: {
        psychologistId,
        date: data.date,
        entryType: AccountingEntryType.expense,
        label: data.label,
        debit: data.amount,
        credit: 0,
        category: data.category,
        paymentMethod: data.paymentMethod,
        expenseId: data.expenseId,
        ecritureNum,
        fiscalYear,
      },
    });

    await this.audit.log({
      actorId: psychologistId,
      actorType: 'system',
      action: 'CREATE',
      entityType: 'accounting_entry',
      entityId: entry.id,
      metadata: { entryType: 'expense', expenseId: data.expenseId, ecritureNum, fiscalYear },
    });

    this.logger.log(
      `Expense entry created — id=${entry.id} expenseId=${data.expenseId} ecritureNum=${ecritureNum}`,
    );

    return entry;
  }

  /**
   * Updates the AccountingEntry linked to an expense.
   */
  async updateExpenseEntry(expenseId: string, data: UpdateExpenseEntryData) {
    const existing = await this.prisma.accountingEntry.findFirst({
      where: { expenseId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(
        `AccountingEntry not found for expenseId=${expenseId}`,
      );
    }

    const updateData: Record<string, unknown> = {};
    if (data.date !== undefined) updateData['date'] = data.date;
    if (data.label !== undefined) updateData['label'] = data.label;
    if (data.amount !== undefined) updateData['debit'] = data.amount;
    if (data.category !== undefined) updateData['category'] = data.category;
    if (data.paymentMethod !== undefined) updateData['paymentMethod'] = data.paymentMethod;

    const entry = await this.prisma.accountingEntry.update({
      where: { id: existing.id },
      data: updateData,
    });

    await this.audit.log({
      actorId: existing.psychologistId,
      actorType: 'system',
      action: 'UPDATE',
      entityType: 'accounting_entry',
      entityId: entry.id,
      metadata: { expenseId, updatedFields: Object.keys(updateData) },
    });

    return entry;
  }

  /**
   * Sets deletedAt on the AccountingEntry linked to the given expenseId.
   */
  async softDeleteEntry(expenseId: string): Promise<void> {
    const existing = await this.prisma.accountingEntry.findFirst({
      where: { expenseId, deletedAt: null },
    });

    if (!existing) {
      // No entry to delete — log and return silently
      this.logger.warn(`softDeleteEntry: no active entry found for expenseId=${expenseId}`);
      return;
    }

    await this.prisma.accountingEntry.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
    });

    await this.audit.log({
      actorId: existing.psychologistId,
      actorType: 'system',
      action: 'DELETE',
      entityType: 'accounting_entry',
      entityId: existing.id,
      metadata: { expenseId },
    });

    this.logger.log(
      `Accounting entry soft-deleted — id=${existing.id} expenseId=${expenseId}`,
    );
  }

  /**
   * Atomic increment on FecSequence table.
   * Uses raw SQL (INSERT ... ON CONFLICT DO UPDATE) for atomicity.
   * The FecSequence schema uses columns: psychologist_id, year, last_number.
   */
  async getNextEcritureNum(
    psychologistId: string,
    fiscalYear: number,
  ): Promise<number> {
    const result = await this.prisma.$queryRaw<Array<{ last_number: number }>>`
      INSERT INTO fec_sequences ("psychologist_id", "year", "last_number")
      VALUES (${psychologistId}, ${fiscalYear}, 1)
      ON CONFLICT ("psychologist_id", "year")
      DO UPDATE SET "last_number" = fec_sequences."last_number" + 1
      RETURNING "last_number"
    `;
    const row = result[0];
    if (!row) {
      throw new Error(
        `FecSequence upsert returned no rows for psychologistId=${psychologistId} year=${fiscalYear}`,
      );
    }
    return row.last_number;
  }

  /**
   * Creates an AccountingEntry of type `income`.
   * Checks idempotency: skips if an active entry already exists for the same
   * invoiceId (when provided) or paymentId (when provided).
   * This will be called by event listeners (Task 4 full).
   */
  async createIncomeEntry(
    psychologistId: string,
    data: CreateIncomeEntryData,
  ) {
    // Idempotency check
    if (data.invoiceId) {
      const existing = await this.prisma.accountingEntry.findFirst({
        where: {
          psychologistId,
          invoiceId: data.invoiceId,
          entryType: AccountingEntryType.income,
          deletedAt: null,
        },
      });
      if (existing) {
        this.logger.warn(
          `Income entry already exists for invoiceId=${data.invoiceId} — skipping`,
        );
        return existing;
      }
    } else if (data.paymentId) {
      const existing = await this.prisma.accountingEntry.findFirst({
        where: {
          psychologistId,
          paymentId: data.paymentId,
          entryType: AccountingEntryType.income,
          deletedAt: null,
        },
      });
      if (existing) {
        this.logger.warn(
          `Income entry already exists for paymentId=${data.paymentId} — skipping`,
        );
        return existing;
      }
    }

    const fiscalYear = new Date(data.date).getFullYear();
    const ecritureNum = await this.getNextEcritureNum(psychologistId, fiscalYear);

    const entry = await this.prisma.accountingEntry.create({
      data: {
        psychologistId,
        date: data.date,
        entryType: AccountingEntryType.income,
        label: data.label,
        debit: 0,
        credit: data.amount,
        category: 'income',
        paymentMethod: data.paymentMethod,
        invoiceId: data.invoiceId ?? null,
        paymentId: data.paymentId ?? null,
        counterpart: data.patientName,
        pieceRef: data.pieceRef ?? null,
        ecritureNum,
        fiscalYear,
      },
    });

    await this.audit.log({
      actorId: psychologistId,
      actorType: 'system',
      action: 'CREATE',
      entityType: 'accounting_entry',
      entityId: entry.id,
      metadata: {
        entryType: 'income',
        invoiceId: data.invoiceId,
        paymentId: data.paymentId,
        ecritureNum,
        fiscalYear,
      },
    });

    this.logger.log(
      `Income entry created — id=${entry.id} ecritureNum=${ecritureNum} amount=${data.amount}`,
    );

    return entry;
  }

  // ---------------------------------------------------------------------------
  // Event listeners (STUB — Task 4 full will wire these)
  // ---------------------------------------------------------------------------

  @OnEvent('invoice.paid')
  async handleInvoicePaid(event: PaymentCompletedEvent) {
    // TODO: Task 4 full — wire income entry creation
    this.logger.debug(`[STUB] invoice.paid event received paymentId=${event.paymentId}`);
  }

  @OnEvent('payment.completed')
  async handlePaymentCompleted(event: PaymentCompletedEvent) {
    // TODO: Task 4 full — wire income entry creation
    this.logger.debug(`[STUB] payment.completed event received paymentId=${event.paymentId}`);
  }
}
