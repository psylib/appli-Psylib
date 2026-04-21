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

export interface BookQuery {
  page: number;
  limit: number;
  type?: 'income' | 'expense';
  dateFrom?: string;
  dateTo?: string;
  category?: string;
}

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  async resolvePsychologistId(userId: string): Promise<string> {
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');
    return psy.id;
  }

  // ---------------------------------------------------------------------------
  // Query methods (Part A)
  // ---------------------------------------------------------------------------

  /**
   * GET /accounting/book — paginated accounting entries (livre des recettes / depenses)
   */
  async getBook(userId: string, query: BookQuery) {
    const psychologistId = await this.resolvePsychologistId(userId);

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      psychologistId,
      deletedAt: null,
    };

    if (query.type) {
      where.entryType = query.type === 'income'
        ? AccountingEntryType.income
        : AccountingEntryType.expense;
    }

    if (query.dateFrom || query.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (query.dateFrom) dateFilter.gte = new Date(query.dateFrom);
      if (query.dateTo) dateFilter.lte = new Date(query.dateTo);
      where.date = dateFilter;
    }

    if (query.category) {
      where.category = query.category;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.accountingEntry.findMany({
        where: where as never,
        orderBy: [{ date: 'desc' }, { ecritureNum: 'desc' }],
        skip,
        take: limit,
        include: {
          expense: { select: { id: true, label: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
          payment: { select: { id: true, type: true } },
        },
      }),
      this.prisma.accountingEntry.count({ where: where as never }),
    ]);

    return {
      data: data.map((entry) => ({
        id: entry.id,
        date: entry.date,
        entryType: entry.entryType,
        label: entry.label,
        debit: Number(entry.debit),
        credit: Number(entry.credit),
        category: entry.category,
        paymentMethod: entry.paymentMethod,
        counterpart: entry.counterpart,
        pieceRef: entry.pieceRef,
        ecritureNum: entry.ecritureNum,
        fiscalYear: entry.fiscalYear,
        expense: entry.expense,
        invoice: entry.invoice,
        payment: entry.payment,
        createdAt: entry.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * GET /accounting/summary — income/expense summary by period
   */
  async getSummary(userId: string, dateFrom?: string, dateTo?: string) {
    const psychologistId = await this.resolvePsychologistId(userId);

    const baseWhere: Record<string, unknown> = {
      psychologistId,
      deletedAt: null,
    };

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      baseWhere.date = dateFilter;
    }

    // Income aggregates
    const incomeAgg = await this.prisma.accountingEntry.aggregate({
      _sum: { credit: true },
      _count: true,
      where: {
        ...baseWhere,
        entryType: AccountingEntryType.income,
      } as never,
    });

    // Expense aggregates
    const expenseAgg = await this.prisma.accountingEntry.aggregate({
      _sum: { debit: true },
      _count: true,
      where: {
        ...baseWhere,
        entryType: AccountingEntryType.expense,
      } as never,
    });

    // Expenses grouped by category
    const expensesByCategory = await this.prisma.accountingEntry.groupBy({
      by: ['category'],
      _sum: { debit: true },
      where: {
        ...baseWhere,
        entryType: AccountingEntryType.expense,
      } as never,
    });

    const incomeTotal = Number(incomeAgg._sum.credit ?? 0);
    const expenseTotal = Number(expenseAgg._sum.debit ?? 0);

    const byCategory: Record<string, number> = {};
    for (const group of expensesByCategory) {
      byCategory[group.category] = Number(group._sum.debit ?? 0);
    }

    return {
      period: {
        from: dateFrom ?? null,
        to: dateTo ?? null,
      },
      income: {
        total: incomeTotal,
        count: incomeAgg._count,
      },
      expenses: {
        total: expenseTotal,
        count: expenseAgg._count,
        byCategory,
      },
      netResult: incomeTotal - expenseTotal,
    };
  }

  /**
   * GET /accounting/dashboard — monthly P&L for last 12 months, YTD totals, expenses by category
   */
  async getDashboard(userId: string) {
    const psychologistId = await this.resolvePsychologistId(userId);

    const now = new Date();
    const currentYear = now.getFullYear();
    const ytdStart = new Date(currentYear, 0, 1);

    // 12-month window start
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Single query for monthly P&L (replaces 24 sequential queries)
    const monthlyRaw = await this.prisma.$queryRaw<
      Array<{
        month: string;
        income: number;
        expenses: number;
      }>
    >`
      SELECT
        TO_CHAR(date, 'YYYY-MM') AS month,
        COALESCE(SUM(CASE WHEN entry_type = 'income' THEN credit ELSE 0 END), 0)::float AS income,
        COALESCE(SUM(CASE WHEN entry_type = 'expense' THEN debit ELSE 0 END), 0)::float AS expenses
      FROM accounting_entries
      WHERE psychologist_id = ${psychologistId}
        AND deleted_at IS NULL
        AND date >= ${twelveMonthsAgo}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month ASC
    `;

    // Fill in missing months with zeros
    const monthlyPnl: Array<{ month: string; income: number; expenses: number; net: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toISOString().slice(0, 7);
      const found = monthlyRaw.find((r) => r.month === label);
      const income = found?.income ?? 0;
      const expenses = found?.expenses ?? 0;
      monthlyPnl.push({ month: label, income, expenses, net: income - expenses });
    }

    // Expenses by category YTD (already a single query — keep as-is)
    const expensesByCategory = await this.prisma.accountingEntry.groupBy({
      by: ['category'],
      _sum: { debit: true },
      where: {
        psychologistId,
        deletedAt: null,
        entryType: AccountingEntryType.expense,
        date: { gte: ytdStart },
      },
    });

    const categoryBreakdown: Record<string, number> = {};
    for (const group of expensesByCategory) {
      categoryBreakdown[group.category] = Number(group._sum.debit ?? 0);
    }

    // YTD totals (keep as-is — already efficient as a single $transaction)
    const [ytdIncomeAgg, ytdExpenseAgg] = await this.prisma.$transaction([
      this.prisma.accountingEntry.aggregate({
        _sum: { credit: true },
        _count: true,
        where: {
          psychologistId,
          deletedAt: null,
          entryType: AccountingEntryType.income,
          date: { gte: ytdStart },
        },
      }),
      this.prisma.accountingEntry.aggregate({
        _sum: { debit: true },
        _count: true,
        where: {
          psychologistId,
          deletedAt: null,
          entryType: AccountingEntryType.expense,
          date: { gte: ytdStart },
        },
      }),
    ]);

    const ytdIncome = Number(ytdIncomeAgg._sum.credit ?? 0);
    const ytdExpenses = Number(ytdExpenseAgg._sum.debit ?? 0);

    return {
      monthlyPnl,
      expensesByCategory: categoryBreakdown,
      ytd: {
        income: ytdIncome,
        expenses: ytdExpenses,
        netResult: ytdIncome - ytdExpenses,
        incomeCount: ytdIncomeAgg._count,
        expenseCount: ytdExpenseAgg._count,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Expense entry CRUD (existing)
  // ---------------------------------------------------------------------------

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
  // Event listeners (Part B — wired to createIncomeEntry)
  // ---------------------------------------------------------------------------

  @OnEvent('invoice.paid')
  async handleInvoicePaid(event: PaymentCompletedEvent) {
    try {
      await this.createIncomeEntry(event.psychologistId, {
        date: event.date,
        label: `Honoraires — ${event.patientName}`,
        amount: event.amount,
        paymentMethod: event.paymentMethod,
        invoiceId: event.invoiceId,
        paymentId: event.paymentId || undefined,
        patientName: event.patientName,
        pieceRef: event.pieceRef,
      });
    } catch (error) {
      this.logger.error(`Failed to create income entry for invoice.paid: ${error}`);
    }
  }

  @OnEvent('payment.completed')
  async handlePaymentCompleted(event: PaymentCompletedEvent) {
    try {
      // Skip if this payment has an associated invoice — the invoice.paid event will handle it
      if (event.invoiceId) {
        this.logger.debug(
          `Skipping payment.completed — invoice.paid will handle invoiceId=${event.invoiceId}`,
        );
        return;
      }
      await this.createIncomeEntry(event.psychologistId, {
        date: event.date,
        label: `Honoraires — ${event.patientName}`,
        amount: event.amount,
        paymentMethod: event.paymentMethod,
        paymentId: event.paymentId || undefined,
        patientName: event.patientName,
        pieceRef: event.pieceRef,
      });
    } catch (error) {
      this.logger.error(`Failed to create income entry for payment.completed: ${error}`);
    }
  }
}
