import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ExpenseCategory, ExpensePaymentMethod, $Enums } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { ExpensesService } from '../expenses/expenses.service';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';

@Injectable()
export class RecurringExpensesService {
  private readonly logger = new Logger(RecurringExpensesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly expensesService: ExpensesService,
    private readonly audit: AuditService,
  ) {}

  private async resolvePsychologistId(userId: string): Promise<string> {
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');
    return psy.id;
  }

  async create(userId: string, dto: CreateRecurringExpenseDto) {
    const psychologistId = await this.resolvePsychologistId(userId);

    const recurring = await this.prisma.recurringExpense.create({
      data: {
        psychologistId,
        label: dto.label,
        amount: dto.amount,
        category: dto.category as ExpenseCategory,
        paymentMethod: dto.paymentMethod as ExpensePaymentMethod,
        supplier: dto.supplier ?? null,
        frequency: dto.frequency as $Enums.RecurringFrequency,
        dayOfMonth: dto.dayOfMonth,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: true,
      },
    });

    await this.audit.log({
      actorId: psychologistId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'recurring_expense',
      entityId: recurring.id,
      metadata: { label: dto.label, amount: dto.amount, frequency: dto.frequency },
    });

    this.logger.log(`RecurringExpense created — id=${recurring.id} psychologistId=${psychologistId}`);

    return this.formatRecurring(recurring);
  }

  async findAll(userId: string) {
    const psychologistId = await this.resolvePsychologistId(userId);

    const recurring = await this.prisma.recurringExpense.findMany({
      where: { psychologistId },
      orderBy: { createdAt: 'desc' },
    });

    return recurring.map((r) => this.formatRecurring(r));
  }

  async update(userId: string, id: string, dto: UpdateRecurringExpenseDto) {
    const psychologistId = await this.resolvePsychologistId(userId);

    const existing = await this.prisma.recurringExpense.findFirst({
      where: { id, psychologistId },
    });
    if (!existing) throw new NotFoundException('Dépense récurrente introuvable');

    const recurring = await this.prisma.recurringExpense.update({
      where: { id },
      data: {
        ...(dto.label !== undefined ? { label: dto.label } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.category !== undefined ? { category: dto.category as ExpenseCategory } : {}),
        ...(dto.paymentMethod !== undefined ? { paymentMethod: dto.paymentMethod as ExpensePaymentMethod } : {}),
        ...(dto.supplier !== undefined ? { supplier: dto.supplier } : {}),
        ...(dto.frequency !== undefined ? { frequency: dto.frequency as $Enums.RecurringFrequency } : {}),
        ...(dto.dayOfMonth !== undefined ? { dayOfMonth: dto.dayOfMonth } : {}),
        ...(dto.startDate !== undefined ? { startDate: new Date(dto.startDate) } : {}),
        ...(dto.endDate !== undefined ? { endDate: dto.endDate ? new Date(dto.endDate) : null } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    await this.audit.log({
      actorId: psychologistId,
      actorType: 'psychologist',
      action: 'UPDATE',
      entityType: 'recurring_expense',
      entityId: recurring.id,
      metadata: { updatedFields: Object.keys(dto) },
    });

    this.logger.log(`RecurringExpense updated — id=${recurring.id} psychologistId=${psychologistId}`);

    return this.formatRecurring(recurring);
  }

  async deactivate(userId: string, id: string) {
    const psychologistId = await this.resolvePsychologistId(userId);

    const existing = await this.prisma.recurringExpense.findFirst({
      where: { id, psychologistId },
    });
    if (!existing) throw new NotFoundException('Dépense récurrente introuvable');

    await this.prisma.recurringExpense.update({
      where: { id },
      data: { isActive: false },
    });

    await this.audit.log({
      actorId: psychologistId,
      actorType: 'psychologist',
      action: 'DELETE',
      entityType: 'recurring_expense',
      entityId: id,
      metadata: { deactivated: true },
    });

    this.logger.log(`RecurringExpense deactivated — id=${id} psychologistId=${psychologistId}`);

    return { success: true, id };
  }

  async generateDueExpenses(): Promise<{ created: number; skipped: number }> {
    const today = new Date();
    const todayDay = today.getDate();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    let created = 0;
    let skipped = 0;

    // Fetch all active recurring expenses
    const recurring = await this.prisma.recurringExpense.findMany({
      where: { isActive: true },
      include: { psychologist: { select: { userId: true } } },
    });

    for (const rec of recurring) {
      try {
        // Check if endDate has passed
        if (rec.endDate && new Date(rec.endDate) < today) {
          await this.prisma.recurringExpense.update({
            where: { id: rec.id },
            data: { isActive: false },
          });
          skipped++;
          continue;
        }

        // Check if startDate is in the future
        if (new Date(rec.startDate) > today) {
          skipped++;
          continue;
        }

        // Calculate effective day (handle months with fewer days)
        const effectiveDay = Math.min(rec.dayOfMonth, lastDayOfMonth);

        // Check if today is the right day
        if (todayDay !== effectiveDay) {
          skipped++;
          continue;
        }

        // Check frequency: monthly = every month, quarterly = every 3 months, yearly = every 12 months
        if (rec.lastGeneratedAt) {
          const lastGen = new Date(rec.lastGeneratedAt);
          const monthsDiff =
            (today.getFullYear() - lastGen.getFullYear()) * 12 +
            (today.getMonth() - lastGen.getMonth());

          const requiredMonths =
            rec.frequency === 'monthly'
              ? 1
              : rec.frequency === 'quarterly'
                ? 3
                : 12;

          if (monthsDiff < requiredMonths) {
            skipped++;
            continue;
          }
        }

        // Generate the expense via ExpensesService
        // Use the psychologist's userId (sub) to go through the normal create flow
        const dateStr = today.toISOString().split('T')[0] ?? today.toISOString().substring(0, 10);
        await this.expensesService.create(rec.psychologist.userId, {
          date: dateStr,
          label: rec.label,
          amount: Number(rec.amount),
          category: rec.category as string,
          paymentMethod: rec.paymentMethod as string,
          supplier: rec.supplier ?? undefined,
          isDeductible: true,
        });

        // Update lastGeneratedAt
        await this.prisma.recurringExpense.update({
          where: { id: rec.id },
          data: { lastGeneratedAt: today },
        });

        created++;
      } catch (error) {
        this.logger.error(`Failed to generate expense for recurring ${rec.id}: ${String(error)}`);
        skipped++;
      }
    }

    return { created, skipped };
  }

  private formatRecurring(rec: {
    id: string;
    psychologistId: string;
    label: string;
    amount: unknown;
    category: string;
    paymentMethod: string;
    supplier: string | null;
    frequency: string;
    dayOfMonth: number;
    startDate: Date;
    endDate: Date | null;
    isActive: boolean;
    lastGeneratedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: rec.id,
      psychologistId: rec.psychologistId,
      label: rec.label,
      amount: Number(rec.amount),
      category: rec.category,
      paymentMethod: rec.paymentMethod,
      supplier: rec.supplier,
      frequency: rec.frequency,
      dayOfMonth: rec.dayOfMonth,
      startDate: rec.startDate,
      endDate: rec.endDate,
      isActive: rec.isActive,
      lastGeneratedAt: rec.lastGeneratedAt,
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    };
  }
}
