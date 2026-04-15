import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('multer'); // ensure Express.Multer global types are loaded
import { ExpenseCategory, ExpensePaymentMethod } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { AuditService } from '../common/audit.service';
import { AccountingService } from '../accounting/accounting.service';
import type { UpdateExpenseEntryData } from '../accounting/accounting.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface ExpenseQuery {
  page?: number;
  limit?: number;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
    private readonly accountingService: AccountingService,
  ) {}

  private async resolvePsychologistId(userId: string): Promise<string> {
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');
    return psy.id;
  }

  async create(userId: string, dto: CreateExpenseDto) {
    const psychologistId = await this.resolvePsychologistId(userId);

    const encryptedNotes = dto.notes ? this.encryption.encrypt(dto.notes) : null;

    const expense = await this.prisma.expense.create({
      data: {
        psychologistId,
        date: new Date(dto.date),
        label: dto.label,
        amount: dto.amount,
        amountHt: dto.amountHt ?? null,
        vatRate: dto.vatRate ?? null,
        category: dto.category as ExpenseCategory,
        subcategory: dto.subcategory ?? null,
        paymentMethod: dto.paymentMethod as ExpensePaymentMethod,
        supplier: dto.supplier ?? null,
        notes: encryptedNotes,
        isDeductible: dto.isDeductible ?? true,
      },
    });

    // Create linked AccountingEntry
    await this.accountingService.createExpenseEntry(psychologistId, {
      date: new Date(dto.date),
      label: dto.label,
      amount: dto.amount,
      category: dto.category as ExpenseCategory,
      paymentMethod: dto.paymentMethod as ExpensePaymentMethod,
      expenseId: expense.id,
    });

    await this.audit.log({
      actorId: psychologistId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'expense',
      entityId: expense.id,
      metadata: { label: dto.label, amount: dto.amount, category: dto.category },
    });

    this.logger.log(`Expense created — id=${expense.id} psychologistId=${psychologistId}`);

    return this.formatExpense(expense, dto.notes ?? null);
  }

  async findAll(userId: string, query: ExpenseQuery) {
    const psychologistId = await this.resolvePsychologistId(userId);

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const whereBase = {
      psychologistId,
      deletedAt: null as Date | null,
      ...(query.category ? { category: query.category as ExpenseCategory } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            date: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { label: { contains: query.search, mode: 'insensitive' as const } },
              { supplier: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [expenses, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where: whereBase,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.expense.count({ where: whereBase }),
    ]);

    return {
      expenses: expenses.map((e) =>
        this.formatExpense(e, e.notes ? this.safeDecrypt(e.notes) : null),
      ),
      total,
      page,
      limit,
    };
  }

  async findOne(userId: string, id: string) {
    const psychologistId = await this.resolvePsychologistId(userId);

    const expense = await this.prisma.expense.findFirst({
      where: { id, psychologistId, deletedAt: null },
    });

    if (!expense) throw new NotFoundException('Dépense introuvable');

    await this.audit.log({
      actorId: psychologistId,
      actorType: 'psychologist',
      action: 'READ',
      entityType: 'expense',
      entityId: expense.id,
      metadata: {},
    });

    const decryptedNotes = expense.notes ? this.safeDecrypt(expense.notes) : null;
    return this.formatExpense(expense, decryptedNotes);
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto) {
    const psychologistId = await this.resolvePsychologistId(userId);

    const existing = await this.prisma.expense.findFirst({
      where: { id, psychologistId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Dépense introuvable');

    const expense = await this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
        ...(dto.label !== undefined ? { label: dto.label } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.amountHt !== undefined ? { amountHt: dto.amountHt } : {}),
        ...(dto.vatRate !== undefined ? { vatRate: dto.vatRate } : {}),
        ...(dto.category !== undefined ? { category: dto.category as ExpenseCategory } : {}),
        ...(dto.subcategory !== undefined ? { subcategory: dto.subcategory } : {}),
        ...(dto.paymentMethod !== undefined ? { paymentMethod: dto.paymentMethod as ExpensePaymentMethod } : {}),
        ...(dto.supplier !== undefined ? { supplier: dto.supplier } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes ? this.encryption.encrypt(dto.notes) : null } : {}),
        ...(dto.isDeductible !== undefined ? { isDeductible: dto.isDeductible } : {}),
      },
    });

    // Update linked AccountingEntry with relevant fields
    const entryUpdate: UpdateExpenseEntryData = {
      ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
      ...(dto.label !== undefined ? { label: dto.label } : {}),
      ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
      ...(dto.category !== undefined ? { category: dto.category as ExpenseCategory } : {}),
      ...(dto.paymentMethod !== undefined ? { paymentMethod: dto.paymentMethod as ExpensePaymentMethod } : {}),
    };

    if (Object.keys(entryUpdate).length > 0) {
      try {
        await this.accountingService.updateExpenseEntry(id, entryUpdate);
      } catch (err) {
        this.logger.warn(`updateExpenseEntry failed for expenseId=${id}: ${String(err)}`);
      }
    }

    await this.audit.log({
      actorId: psychologistId,
      actorType: 'psychologist',
      action: 'UPDATE',
      entityType: 'expense',
      entityId: expense.id,
      metadata: { updatedFields: Object.keys(dto) },
    });

    const decryptedNotes = expense.notes ? this.safeDecrypt(expense.notes) : null;
    return this.formatExpense(expense, decryptedNotes);
  }

  async softDelete(userId: string, id: string) {
    const psychologistId = await this.resolvePsychologistId(userId);

    const existing = await this.prisma.expense.findFirst({
      where: { id, psychologistId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Dépense introuvable');

    await this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Soft-delete linked AccountingEntry
    await this.accountingService.softDeleteEntry(id);

    await this.audit.log({
      actorId: psychologistId,
      actorType: 'psychologist',
      action: 'DELETE',
      entityType: 'expense',
      entityId: id,
      metadata: {},
    });

    this.logger.log(`Expense soft-deleted — id=${id} psychologistId=${psychologistId}`);
    return { success: true, id };
  }

  async uploadReceipt(userId: string, id: string, file: Express.Multer.File) {
    const psychologistId = await this.resolvePsychologistId(userId);

    const existing = await this.prisma.expense.findFirst({
      where: { id, psychologistId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Dépense introuvable');

    if (!file) throw new BadRequestException('Fichier manquant');

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Type de fichier non autorisé. Formats acceptés : PDF, JPG, PNG.');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Fichier trop volumineux. Taille maximale : 5 Mo.');
    }

    // Build storage path
    const uploadDir = path.join(process.cwd(), 'uploads', 'receipts', psychologistId, id);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Sanitize filename
    const ext = path.extname(file.originalname).toLowerCase();
    const safeFilename = `receipt_${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, safeFilename);

    fs.writeFileSync(filePath, file.buffer);

    // Store relative path as receiptUrl
    const receiptUrl = `uploads/receipts/${psychologistId}/${id}/${safeFilename}`;

    const expense = await this.prisma.expense.update({
      where: { id },
      data: { receiptUrl },
    });

    await this.audit.log({
      actorId: psychologistId,
      actorType: 'psychologist',
      action: 'UPDATE',
      entityType: 'expense',
      entityId: id,
      metadata: { receiptUploaded: true, filename: safeFilename },
    });

    this.logger.log(`Receipt uploaded for expense ${id} — path=${receiptUrl}`);

    return {
      id: expense.id,
      receiptUrl: expense.receiptUrl,
    };
  }

  async getReceiptUrl(userId: string, id: string) {
    const psychologistId = await this.resolvePsychologistId(userId);

    const expense = await this.prisma.expense.findFirst({
      where: { id, psychologistId, deletedAt: null },
      select: { id: true, receiptUrl: true },
    });

    if (!expense) throw new NotFoundException('Dépense introuvable');
    if (!expense.receiptUrl) throw new NotFoundException('Aucun justificatif pour cette dépense');

    return { id: expense.id, receiptUrl: expense.receiptUrl };
  }

  private safeDecrypt(encrypted: string): string | null {
    try {
      return this.encryption.decrypt(encrypted);
    } catch {
      this.logger.warn('Failed to decrypt expense notes');
      return null;
    }
  }

  private formatExpense(
    expense: {
      id: string;
      psychologistId: string;
      date: Date;
      label: string;
      amount: unknown;
      amountHt?: unknown;
      vatRate?: unknown;
      category: string;
      subcategory?: string | null;
      paymentMethod: string;
      supplier?: string | null;
      receiptUrl?: string | null;
      recurringExpenseId?: string | null;
      notes?: string | null;
      isDeductible: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
    decryptedNotes: string | null,
  ) {
    return {
      id: expense.id,
      psychologistId: expense.psychologistId,
      date: expense.date,
      label: expense.label,
      amount: Number(expense.amount),
      amountHt: expense.amountHt != null ? Number(expense.amountHt) : null,
      vatRate: expense.vatRate != null ? Number(expense.vatRate) : null,
      category: expense.category,
      subcategory: expense.subcategory ?? null,
      paymentMethod: expense.paymentMethod,
      supplier: expense.supplier ?? null,
      receiptUrl: expense.receiptUrl ?? null,
      recurringExpenseId: expense.recurringExpenseId ?? null,
      notes: decryptedNotes,
      isDeductible: expense.isDeductible,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }
}
