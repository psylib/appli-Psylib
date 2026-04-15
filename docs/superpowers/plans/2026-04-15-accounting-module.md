# Accounting Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add integrated accounting/bookkeeping to PsyLib — auto-generated income book, expense tracking, recurring expenses, unified ledger, FEC export, 2035 prep, social charges estimator.

**Architecture:** New NestJS modules (expenses, recurring-expenses, accounting) with Prisma models, BullMQ CRON for recurring expense generation, and new Next.js pages under `/dashboard/accounting`. Income entries auto-created from existing invoice/payment flows. Plan-gated features from Free to Clinic.

**Tech Stack:** NestJS, Prisma/PostgreSQL, BullMQ (CRON), Next.js App Router, React Query, shadcn/ui, Recharts, Zod, React Hook Form

**Spec:** `docs/superpowers/specs/2026-04-15-accounting-module-design.md`

**Key architectural decisions:**
- **Event-driven income entries:** Use `@nestjs/event-emitter` (`EventEmitter2`) to emit `payment.completed` and `invoice.paid` events. `AccountingService` listens for these events. This eliminates circular dependencies and ensures ALL payment paths are covered.
- **Module import direction:** `AccountingModule` is standalone (no imports of InvoicesModule/BillingModule). `ExpensesModule` imports `AccountingModule`. `InvoicesModule` and `BillingModule` emit events, `AccountingModule` listens.
- **Token pattern:** Server components pass `token={session.accessToken}` to client components (improved pattern per MEMORY.md).
- **Multi-practitioner consolidated view (Clinic):** Deferred to Phase 2.

---

## Task 1: Prisma Schema — New enums, models, migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `packages/shared-types/src/index.ts`
- Create: `apps/api/prisma/migrations/20260415_accounting_module/migration.sql` (auto-generated)

- [ ] **Step 1: Add new enums to Prisma schema**

In `apps/api/prisma/schema.prisma`, add after the existing enums:

```prisma
enum ExpenseCategory {
  rent
  insurance
  equipment
  it_software
  phone_internet
  training
  supervision
  professional_fees
  transport
  office_supplies
  tests_tools
  bank_fees
  accounting
  cleaning
  other
}

enum ExpensePaymentMethod {
  cash
  check
  card
  transfer
  direct_debit
  stripe
  other_pm
}

enum RecurringFrequency {
  monthly
  quarterly
  yearly
}

enum AccountingEntryType {
  income
  expense
}
```

- [ ] **Step 2: Add Expense model**

```prisma
model Expense {
  id                  String               @id @default(uuid())
  psychologistId      String               @map("psychologist_id")
  psychologist        Psychologist         @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  date                DateTime             @db.Date
  label               String
  amount              Decimal              @db.Decimal(10, 2)
  amountHt            Decimal?             @map("amount_ht") @db.Decimal(10, 2)
  vatRate             Decimal?             @map("vat_rate") @db.Decimal(4, 2)
  category            ExpenseCategory
  subcategory         String?
  paymentMethod       ExpensePaymentMethod @map("payment_method")
  supplier            String?
  receiptUrl          String?              @map("receipt_url")
  recurringExpenseId  String?              @map("recurring_expense_id")
  recurringExpense    RecurringExpense?    @relation(fields: [recurringExpenseId], references: [id])
  notes               String?              // ENCRYPTED — AES-256-GCM
  isDeductible        Boolean              @default(true) @map("is_deductible")
  createdAt           DateTime             @default(now()) @map("created_at")
  updatedAt           DateTime             @updatedAt @map("updated_at")
  deletedAt           DateTime?            @map("deleted_at")

  accountingEntries   AccountingEntry[]

  @@index([psychologistId, date(sort: Desc)], name: "idx_expenses_psy_date")
  @@index([psychologistId, category], name: "idx_expenses_psy_category")
  @@map("expenses")
}
```

- [ ] **Step 3: Add RecurringExpense model**

```prisma
model RecurringExpense {
  id              String               @id @default(uuid())
  psychologistId  String               @map("psychologist_id")
  psychologist    Psychologist         @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  label           String
  amount          Decimal              @db.Decimal(10, 2)
  category        ExpenseCategory
  paymentMethod   ExpensePaymentMethod @map("payment_method")
  supplier        String?
  frequency       RecurringFrequency
  dayOfMonth      Int                  @default(1) @map("day_of_month")
  startDate       DateTime             @db.Date @map("start_date")
  endDate         DateTime?            @db.Date @map("end_date")
  isActive        Boolean              @default(true) @map("is_active")
  lastGeneratedAt DateTime?            @db.Date @map("last_generated_at")
  createdAt       DateTime             @default(now()) @map("created_at")
  updatedAt       DateTime             @updatedAt @map("updated_at")

  expenses        Expense[]

  @@index([psychologistId], name: "idx_recurring_psy")
  @@index([isActive, lastGeneratedAt], name: "idx_recurring_active")
  @@map("recurring_expenses")
}
```

- [ ] **Step 4: Add AccountingEntry model**

```prisma
model AccountingEntry {
  id              String              @id @default(uuid())
  psychologistId  String              @map("psychologist_id")
  psychologist    Psychologist        @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  date            DateTime            @db.Date
  entryType       AccountingEntryType @map("entry_type")
  label           String
  debit           Decimal             @default(0) @db.Decimal(10, 2)
  credit          Decimal             @default(0) @db.Decimal(10, 2)
  category        String
  paymentMethod   String?             @map("payment_method")
  counterpart     String?
  invoiceId       String?             @map("invoice_id")
  invoice         Invoice?            @relation(fields: [invoiceId], references: [id])
  paymentId       String?             @map("payment_id")
  payment         Payment?            @relation(fields: [paymentId], references: [id])
  expenseId       String?             @map("expense_id")
  expense         Expense?            @relation(fields: [expenseId], references: [id])
  accountCode     String?             @map("account_code")
  pieceRef        String?             @map("piece_ref")
  ecritureNum     Int?                @map("ecriture_num")
  fiscalYear      Int                 @map("fiscal_year")
  createdAt       DateTime            @default(now()) @map("created_at")
  updatedAt       DateTime            @updatedAt @map("updated_at")
  deletedAt       DateTime?           @map("deleted_at")

  @@index([psychologistId, date(sort: Desc)], name: "idx_accounting_psy_date")
  @@index([psychologistId, entryType, date], name: "idx_accounting_psy_type_date")
  @@index([invoiceId], name: "idx_accounting_invoice")
  @@index([paymentId], name: "idx_accounting_payment")
  @@index([expenseId], name: "idx_accounting_expense")
  @@index([psychologistId, fiscalYear], name: "idx_accounting_psy_year")
  @@map("accounting_entries")
}
```

- [ ] **Step 5: Add FecSequence model**

```prisma
model FecSequence {
  id              String @id @default(uuid())
  psychologistId  String @map("psychologist_id")
  year            Int
  lastNumber      Int    @default(0) @map("last_number")

  @@unique([psychologistId, year])
  @@map("fec_sequences")
}
```

- [ ] **Step 6: Add reverse relations to existing models**

In `Psychologist` model, add:
```prisma
  expenses            Expense[]
  recurringExpenses   RecurringExpense[]
  accountingEntries   AccountingEntry[]
```

In `Invoice` model, add:
```prisma
  accountingEntries   AccountingEntry[]
```

In `Payment` model, add:
```prisma
  accountingEntries   AccountingEntry[]
```

- [ ] **Step 7: Run Prisma migration**

```bash
cd apps/api && npx prisma migrate dev --name accounting_module
```

Expected: Migration created successfully, 4 new tables + 1 sequence table.

- [ ] **Step 8: Add shared types**

In `packages/shared-types/src/index.ts`, add:

```typescript
// ── Accounting Module ─────────────────────────────────────────────────────

export enum ExpenseCategory {
  RENT = 'rent',
  INSURANCE = 'insurance',
  EQUIPMENT = 'equipment',
  IT_SOFTWARE = 'it_software',
  PHONE_INTERNET = 'phone_internet',
  TRAINING = 'training',
  SUPERVISION = 'supervision',
  PROFESSIONAL_FEES = 'professional_fees',
  TRANSPORT = 'transport',
  OFFICE_SUPPLIES = 'office_supplies',
  TESTS_TOOLS = 'tests_tools',
  BANK_FEES = 'bank_fees',
  ACCOUNTING = 'accounting',
  CLEANING = 'cleaning',
  OTHER = 'other',
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.RENT]: 'Loyer et charges',
  [ExpenseCategory.INSURANCE]: 'Assurances',
  [ExpenseCategory.EQUIPMENT]: 'Matériel professionnel',
  [ExpenseCategory.IT_SOFTWARE]: 'Informatique et logiciels',
  [ExpenseCategory.PHONE_INTERNET]: 'Téléphone et Internet',
  [ExpenseCategory.TRAINING]: 'Formation continue',
  [ExpenseCategory.SUPERVISION]: 'Supervision',
  [ExpenseCategory.PROFESSIONAL_FEES]: 'Cotisations professionnelles',
  [ExpenseCategory.TRANSPORT]: 'Déplacements',
  [ExpenseCategory.OFFICE_SUPPLIES]: 'Fournitures de bureau',
  [ExpenseCategory.TESTS_TOOLS]: 'Tests et outils',
  [ExpenseCategory.BANK_FEES]: 'Frais bancaires',
  [ExpenseCategory.ACCOUNTING]: 'Comptabilité / AGA',
  [ExpenseCategory.CLEANING]: 'Entretien locaux',
  [ExpenseCategory.OTHER]: 'Autres charges',
};

export enum ExpensePaymentMethod {
  CASH = 'cash',
  CHECK = 'check',
  CARD = 'card',
  TRANSFER = 'transfer',
  DIRECT_DEBIT = 'direct_debit',
  STRIPE = 'stripe',
  OTHER = 'other_pm',
}

export const EXPENSE_PAYMENT_METHOD_LABELS: Record<ExpensePaymentMethod, string> = {
  [ExpensePaymentMethod.CASH]: 'Espèces',
  [ExpensePaymentMethod.CHECK]: 'Chèque',
  [ExpensePaymentMethod.CARD]: 'Carte bancaire',
  [ExpensePaymentMethod.TRANSFER]: 'Virement',
  [ExpensePaymentMethod.DIRECT_DEBIT]: 'Prélèvement',
  [ExpensePaymentMethod.STRIPE]: 'Paiement en ligne',
  [ExpensePaymentMethod.OTHER]: 'Autre',
};

export enum RecurringFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  [RecurringFrequency.MONTHLY]: 'Mensuel',
  [RecurringFrequency.QUARTERLY]: 'Trimestriel',
  [RecurringFrequency.YEARLY]: 'Annuel',
};

export enum AccountingEntryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}
```

Also update `PLAN_LIMITS` — must update the **type signature** AND the values:
```typescript
// 1. Update the Record type to include expenses:
//    Record<SubscriptionPlan, { patients: number | null; sessions: number | null; aiSummaries: number; videoConsultations: number | null; courses: number | null; expenses: number | null }>
//
// 2. Add expenses field to each plan:
// FREE:    { ..., expenses: 30 }     // 30 per month
// STARTER: { ..., expenses: null }   // unlimited
// PRO:     { ..., expenses: null }   // unlimited
// CLINIC:  { ..., expenses: null }   // unlimited
```

Add TypeScript interfaces for accounting API responses:
```typescript
export interface ExpenseRecord { id: string; date: string; label: string; amount: number; category: ExpenseCategory; paymentMethod: ExpensePaymentMethod; supplier: string | null; receiptUrl: string | null; isDeductible: boolean; notes: string | null; deletedAt: string | null; }
export interface RecurringExpenseRecord { id: string; label: string; amount: number; category: ExpenseCategory; paymentMethod: ExpensePaymentMethod; supplier: string | null; frequency: RecurringFrequency; dayOfMonth: number; startDate: string; endDate: string | null; isActive: boolean; lastGeneratedAt: string | null; }
export interface AccountingEntryRecord { id: string; date: string; entryType: AccountingEntryType; label: string; debit: number; credit: number; category: string; paymentMethod: string | null; counterpart: string | null; pieceRef: string | null; }
export interface AccountingSummary { period: { from: string; to: string }; income: { total: number; count: number }; expenses: { total: number; count: number; byCategory: Record<string, number> }; netResult: number; }
export interface DashboardResponse { monthlyPnL: Array<{ month: string; income: number; expenses: number; net: number }>; expensesByCategory: Array<{ category: string; amount: number; percentage: number }>; yearToDate: { income: number; expenses: number; net: number }; }
```

- [ ] **Step 9: Build shared-types and commit**

```bash
cd packages/shared-types && npm run build
git add -A && git commit -m "feat(schema): add accounting module tables — expenses, recurring_expenses, accounting_entries, fec_sequences"
```

---

## Task 2: Backend — Expenses Module (CRUD + receipt upload)

**Files:**
- Create: `apps/api/src/expenses/expenses.module.ts`
- Create: `apps/api/src/expenses/expenses.controller.ts`
- Create: `apps/api/src/expenses/expenses.service.ts`
- Create: `apps/api/src/expenses/dto/create-expense.dto.ts`
- Create: `apps/api/src/expenses/dto/update-expense.dto.ts`
- Modify: `apps/api/src/app.module.ts` (import ExpensesModule)

- [ ] **Step 1: Create DTOs**

`create-expense.dto.ts`:
```typescript
import { IsString, IsNumber, IsDateString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, Min, Max, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({ example: '2026-04-15' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 'Loyer cabinet avril' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  label!: string;

  @ApiProperty({ example: 650 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: 541.67 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountHt?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  vatRate?: number;

  @ApiProperty({ enum: ['rent','insurance','equipment','it_software','phone_internet','training','supervision','professional_fees','transport','office_supplies','tests_tools','bank_fees','accounting','cleaning','other'] })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiProperty({ enum: ['cash','check','card','transfer','direct_debit','stripe','other_method'] })
  @IsString()
  @IsNotEmpty()
  paymentMethod!: string;

  @ApiPropertyOptional({ example: 'Bailleur SCI' })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isDeductible?: boolean;
}
```

`update-expense.dto.ts` — PartialType of CreateExpenseDto.

- [ ] **Step 2: Create ExpensesService**

Key methods:
- `create(userId, dto)` — resolve psychologistId, encrypt notes, create Expense, create AccountingEntry (in transaction), increment FecSequence
- `findAll(userId, query)` — paginated, filtered by date/category/search, decrypt notes
- `findOne(userId, id)` — single expense with tenant check, decrypt notes
- `update(userId, id, dto)` — update expense + linked AccountingEntry
- `softDelete(userId, id)` — set deletedAt on both Expense and AccountingEntry
- `uploadReceipt(userId, id, file)` — save to S3, update receiptUrl
- `getReceiptUrl(userId, id)` — return signed S3 URL

Pattern: Follow `invoices.service.ts` exactly. Use `resolvePsychologistId()`. Always filter by `psychologistId`. Use EncryptionService for notes. Use AuditService for logging.

- [ ] **Step 3: Create ExpensesController**

Routes:
```
POST   /expenses          → create
GET    /expenses          → findAll (query: page, limit, category, dateFrom, dateTo, search)
GET    /expenses/:id      → findOne
PUT    /expenses/:id      → update
DELETE /expenses/:id      → softDelete
POST   /expenses/:id/receipt → uploadReceipt (multipart)
GET    /expenses/:id/receipt → getReceiptUrl (returns signed S3 URL)
```

Guards: `@UseGuards(KeycloakGuard, RolesGuard)`, `@Roles('psychologist')`.
Receipt upload: requires Solo+ plan (`@UseGuards(SubscriptionGuard)` + `@RequirePlan`).

- [ ] **Step 4: Create ExpensesModule**

Import: `CommonModule` (for PrismaService, EncryptionService, AuditService), `BillingModule` (for SubscriptionGuard), `AccountingModule` (for AccountingService — to create expense entries).
Export: `ExpensesService`.

> **Note:** Task 2 depends on `AccountingModule` from Task 4. Implement Task 4's `AccountingModule` skeleton (module + service with `createExpenseEntry()`, `updateExpenseEntry()`, `softDeleteEntry()`, `getNextEcritureNum()`) BEFORE Task 2. The event listener methods and ledger queries from Task 4 can be added after Task 2.

- [ ] **Step 5: Register in AppModule**

Add `ExpensesModule` to `app.module.ts` imports.

- [ ] **Step 6: Add expense limit check to SubscriptionService**

1. In `apps/api/src/billing/decorators/require-plan.decorator.ts`, add `'expenses'` to `BillingFeature` type.
2. In `apps/api/src/billing/guards/subscription.guard.ts`, add the `expenses` case:
   ```typescript
   if (requiredFeature === 'expenses') {
     await this.subscriptionService.checkExpenseLimit(psy.id);
   }
   ```
3. Add `checkExpenseLimit(psychologistId)` method in `apps/api/src/billing/subscription.service.ts`:
   ```typescript
   async checkExpenseLimit(psychologistId: string): Promise<void> {
     const sub = await this.getSubscription(psychologistId);
     const limit = PLAN_LIMITS[sub.plan]?.expenses;
     if (limit === null || limit === undefined) return;
     const count = await this.prisma.expense.count({
       where: { psychologistId, deletedAt: null, createdAt: { gte: startOfMonth(new Date()) } },
     });
     if (count >= limit) {
       throw new ForbiddenException({ code: 'EXPENSE_LIMIT_REACHED', current: count, limit });
     }
   }
   ```
4. In ExpensesController `create()`, add `@RequireFeature('expenses')` decorator (or call check manually).

- [ ] **Step 7: Test and commit**

```bash
cd apps/api && npm run build
git add -A && git commit -m "feat(api): add expenses module — CRUD, receipt upload, encryption, plan gating"
```

---

## Task 3: Backend — Recurring Expenses Module + CRON

**Files:**
- Create: `apps/api/src/recurring-expenses/recurring-expenses.module.ts`
- Create: `apps/api/src/recurring-expenses/recurring-expenses.controller.ts`
- Create: `apps/api/src/recurring-expenses/recurring-expenses.service.ts`
- Create: `apps/api/src/recurring-expenses/recurring-expenses.cron.ts`
- Create: `apps/api/src/recurring-expenses/dto/create-recurring-expense.dto.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create DTO**

```typescript
export class CreateRecurringExpenseDto {
  @IsString() @IsNotEmpty() @MinLength(2) @MaxLength(200)
  label!: string;

  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01)
  amount!: number;

  @IsString() @IsNotEmpty()
  category!: string;  // ExpenseCategory value

  @IsString() @IsNotEmpty()
  paymentMethod!: string;  // ExpensePaymentMethod value

  @IsOptional() @IsString()
  supplier?: string;

  @IsString() @IsNotEmpty()
  frequency!: string;  // 'monthly' | 'quarterly' | 'yearly'

  @IsInt() @Min(1) @Max(31)
  dayOfMonth!: number;

  @IsDateString()
  startDate!: string;

  @IsOptional() @IsDateString()
  endDate?: string;
}
```

- [ ] **Step 2: Create RecurringExpensesService**

Key methods:
- `create(userId, dto)` — create recurring expense
- `findAll(userId)` — list active recurring expenses
- `update(userId, id, dto)` — modify
- `deactivate(userId, id)` — set isActive=false
- `generateDueExpenses()` — called by CRON, generates expenses for all active recurrences due today

Generation logic (for `generateDueExpenses`):
```typescript
// For each active RecurringExpense:
//   Calculate effective day = min(dayOfMonth, lastDayOfCurrentMonth)
//   Check if today.day >= effectiveDay AND lastGeneratedAt < current period
//   If due: create Expense (via ExpensesService.create) + update lastGeneratedAt
```

- [ ] **Step 3: Create CRON job**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RecurringExpensesCron {
  private readonly logger = new Logger(RecurringExpensesCron.name);

  constructor(private readonly recurringService: RecurringExpensesService) {}

  @Cron('0 2 * * *', { timeZone: 'Europe/Paris' })  // Daily at 02:00 Paris time
  async handleCron() {
    this.logger.log('Running recurring expenses generation...');
    const result = await this.recurringService.generateDueExpenses();
    this.logger.log(`Generated ${result.created} expenses, skipped ${result.skipped}`);
  }
}
```

- [ ] **Step 4: Create RecurringExpensesController**

Routes (all require Pro/Clinic plan):
```
POST   /recurring-expenses     → create
GET    /recurring-expenses     → findAll
PUT    /recurring-expenses/:id → update
DELETE /recurring-expenses/:id → deactivate
```

- [ ] **Step 5: Create RecurringExpensesModule, register in AppModule**

Import `ScheduleModule.forRoot()` in AppModule if not already imported.
Import `ExpensesModule` (to reuse ExpensesService for expense creation).

- [ ] **Step 6: Test and commit**

```bash
cd apps/api && npm run build
git add -A && git commit -m "feat(api): add recurring expenses module — CRON daily generation, Pro/Clinic gated"
```

---

## Task 4: Backend — Accounting Module (ledger, summaries, dashboard)

**Files:**
- Create: `apps/api/src/accounting/accounting.module.ts`
- Create: `apps/api/src/accounting/accounting.controller.ts`
- Create: `apps/api/src/accounting/accounting.service.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create AccountingService**

Key methods:
- `createIncomeEntry(psychologistId, data)` — called when invoice/payment becomes `paid`. Checks idempotency (existing entry for same invoiceId/paymentId). Assigns ecritureNum from FecSequence.
- `createExpenseEntry(psychologistId, data)` — called by ExpensesService on expense creation. Assigns ecritureNum.
- `updateExpenseEntry(expenseId, data)` — update linked entry.
- `softDeleteEntry(expenseId)` — soft-delete linked entry.
- `getBook(userId, query)` — unified ledger: all entries for a period, paginated, filtered by type/category.
- `getSummary(userId, dateFrom, dateTo)` — income total, expense total by category, net result.
- `getDashboard(userId)` — monthly P&L (12 months), expenses by category, income by method, YTD vs previous year.
- `getNextEcritureNum(psychologistId, year)` — atomic increment on FecSequence.

- [ ] **Step 2: Create AccountingController**

Routes:
```
GET /accounting/book       → getBook (query: page, limit, type, dateFrom, dateTo, category)
GET /accounting/summary    → getSummary (query: dateFrom, dateTo)
GET /accounting/dashboard  → getDashboard (Pro/Clinic only for full version)
```

- [ ] **Step 3: Wire income entry auto-creation via EventEmitter**

Install and configure `@nestjs/event-emitter`:
```bash
cd apps/api && npm install @nestjs/event-emitter
```

In `app.module.ts`, add `EventEmitterModule.forRoot()` to imports.

Create event payload types in `apps/api/src/accounting/events/`:
```typescript
// payment-completed.event.ts
export class PaymentCompletedEvent {
  constructor(
    public readonly psychologistId: string,
    public readonly paymentId: string,
    public readonly invoiceId: string | null,
    public readonly patientName: string,
    public readonly amount: number,
    public readonly date: Date,
    public readonly paymentMethod: string,
    public readonly pieceRef: string | null,
  ) {}
}
```

In `AccountingService`, add event listeners:
```typescript
@OnEvent('invoice.paid')
async handleInvoicePaid(event: PaymentCompletedEvent) { ... }

@OnEvent('payment.completed')
async handlePaymentCompleted(event: PaymentCompletedEvent) { ... }
```

Emit events from ALL code paths where payment/invoice transitions to `paid`:

1. `apps/api/src/invoices/invoices.service.ts`:
   - `markAsPaid()` → emit `invoice.paid`
   - `createAutoInvoice()` (when status=paid) → emit `invoice.paid`

2. `apps/api/src/billing/subscription.service.ts`:
   - `handleCheckoutCompleted()` (payment_link type) → emit `payment.completed`
   - `handleBookingPaymentCompleted()` → emit `payment.completed`
   - `handlePaymentLinkCompleted()` → emit `payment.completed`
   - `markPaidOnSite()` → emit `payment.completed`

3. `apps/api/src/invoices/invoice-generation.processor.ts`:
   - When auto-invoice is created with status `paid` → emit `invoice.paid`

Deduplication: `AccountingService` checks if entry already exists for same `invoiceId` or `paymentId` before creating. If invoice.paid is emitted for an invoice that also has a linked payment, only the invoice triggers the entry (payment listener skips if paymentId has a linked invoiceId).

- [ ] **Step 4: Create AccountingModule, register in AppModule**

Export `AccountingService` so InvoicesModule and BillingModule can use it.

- [ ] **Step 5: Test and commit**

```bash
cd apps/api && npm run build
git add -A && git commit -m "feat(api): add accounting module — unified ledger, summaries, dashboard, auto income entries"
```

---

## Task 5: Backend — FEC Export + Tax Prep + Social Charges

**Files:**
- Create: `apps/api/src/accounting/fec-export.service.ts`
- Create: `apps/api/src/accounting/tax-prep.service.ts`
- Create: `apps/api/src/accounting/bnc-account-codes.ts`
- Modify: `apps/api/src/accounting/accounting.controller.ts`

- [ ] **Step 1: Create BNC account codes mapping**

`bnc-account-codes.ts`:
```typescript
export const BNC_ACCOUNT_CODES: Record<string, { code: string; label: string }> = {
  HONORAIRES:           { code: '706000', label: 'Honoraires' },
  rent:                 { code: '613200', label: 'Locations immobilieres' },
  insurance:            { code: '616000', label: "Primes d'assurance" },
  equipment:            { code: '218400', label: 'Materiel de bureau et informatique' },
  it_software:          { code: '651000', label: 'Redevances et logiciels' },
  phone_internet:       { code: '626000', label: 'Frais postaux et telecommunications' },
  training:             { code: '618500', label: 'Seminaires, conferences, formations' },
  supervision:          { code: '622600', label: 'Honoraires ne constituant pas des retrocessions' },
  professional_fees:    { code: '628100', label: 'Cotisations syndicales et professionnelles' },
  transport:            { code: '625100', label: 'Voyages et deplacements' },
  office_supplies:      { code: '606400', label: 'Fournitures de bureau' },
  tests_tools:          { code: '606800', label: 'Autres matieres et fournitures' },
  bank_fees:            { code: '627000', label: 'Frais bancaires' },
  accounting:           { code: '622700', label: "Frais d'actes et de contentieux" },
  cleaning:             { code: '615500', label: 'Entretien et reparations' },
  other:                { code: '671000', label: 'Charges diverses' },
  cfe:                  { code: '635100', label: 'Cotisation fonciere des entreprises' },
};
```

- [ ] **Step 2: Create FecExportService**

Generate pipe-delimited FEC file (18 columns). Stream response for large files.
```
JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcrtureLet|DateLet|ValidDate|Montantdevise|Idevise
```

Method: `generateFec(psychologistId, year): ReadableStream`

- [ ] **Step 3: Create TaxPrepService**

Methods:
- `get2035Prep(psychologistId, year)` — aggregate expenses by 2035 lines (AA, BA-BP, BQ, CP)
- `estimateSocialCharges(psychologistId, year)` — URSSAF + CIPAV estimation based on net profit

Social charges estimation (approximate 2026 rates):
```typescript
{
  urssaf: {
    maladie: netProfit * 0.066,
    allocationsFamiliales: netProfit * 0.031,
    csgCrds: netProfit * 0.097,
    cfp: netProfit * 0.0025,
  },
  cipav: { retraiteBase, retraiteComplementaire, invaliditeDeces: 76 },
  total, monthlyProvision: total / 12,
  disclaimer: "Estimation indicative..."
}
```

- [ ] **Step 4: Add routes to AccountingController**

```
GET /accounting/export/csv   → exportCsv (query: dateFrom, dateTo)
GET /accounting/export/fec   → exportFec (query: year) — Solo+ plan
GET /accounting/tax-prep     → get2035Prep (query: year) — Pro/Clinic
GET /accounting/social-charges → estimateSocialCharges (query: year) — Pro/Clinic
```

- [ ] **Step 5: Test and commit**

```bash
cd apps/api && npm run build
git add -A && git commit -m "feat(api): add FEC export, 2035 tax prep, social charges estimator"
```

---

## Task 6: Backend — Backfill script for existing data

**Files:**
- Create: `apps/api/src/accounting/backfill-accounting-entries.ts`

- [ ] **Step 1: Create backfill script**

Script that populates `accounting_entries` from existing paid invoices and payments:
- Process psychologists in batches of 50
- For each: find paid invoices without existing AccountingEntry, create income entries
- Find paid payments without invoices and without existing AccountingEntry, create income entries
- Initialize FecSequence for each year touched
- Idempotent: safe to re-run
- Support `DRY_RUN=true` env var

- [ ] **Step 2: Test with dry run and commit**

```bash
DRY_RUN=true npx ts-node apps/api/src/accounting/backfill-accounting-entries.ts
git add -A && git commit -m "feat(api): add accounting entries backfill script for existing invoices/payments"
```

---

## Task 7: Frontend — API clients for accounting

**Files:**
- Create: `apps/web/src/lib/api/expenses.ts`
- Create: `apps/web/src/lib/api/recurring-expenses.ts`
- Create: `apps/web/src/lib/api/accounting.ts`

- [ ] **Step 1: Create expenses API client**

```typescript
export const expensesApi = {
  list: (token: string, query?: { page?: number; limit?: number; category?: string; dateFrom?: string; dateTo?: string; search?: string }) => ...,
  create: (data: CreateExpensePayload, token: string) => ...,
  get: (id: string, token: string) => ...,
  update: (id: string, data: Partial<CreateExpensePayload>, token: string) => ...,
  delete: (id: string, token: string) => ...,
  uploadReceipt: (id: string, file: File, token: string) => ...,  // multipart
};
```

- [ ] **Step 2: Create recurring-expenses API client**

```typescript
export const recurringExpensesApi = {
  list: (token: string) => ...,
  create: (data: CreateRecurringExpensePayload, token: string) => ...,
  update: (id: string, data: Partial<CreateRecurringExpensePayload>, token: string) => ...,
  delete: (id: string, token: string) => ...,
};
```

- [ ] **Step 3: Create accounting API client**

```typescript
export const accountingApi = {
  getBook: (token: string, query?: BookQuery) => ...,
  getSummary: (token: string, dateFrom: string, dateTo: string) => ...,
  getDashboard: (token: string) => ...,
  exportCsv: (token: string, dateFrom: string, dateTo: string) => ..., // blob download
  exportFec: (token: string, year: number) => ..., // blob download
  getTaxPrep: (token: string, year: number) => ...,
  getSocialCharges: (token: string, year: number) => ...,
};
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(web): add API clients for expenses, recurring-expenses, accounting"
```

---

## Task 8: Frontend — Accounting main page (Livre-journal + Expenses)

**Files:**
- Create: `apps/web/src/app/(dashboard)/dashboard/accounting/page.tsx`
- Create: `apps/web/src/components/accounting/accounting-page.tsx`
- Create: `apps/web/src/components/accounting/income-book.tsx`
- Create: `apps/web/src/components/accounting/expense-list.tsx`
- Create: `apps/web/src/components/accounting/expense-form-dialog.tsx`
- Create: `apps/web/src/components/accounting/accounting-ledger.tsx`
- Create: `apps/web/src/components/accounting/expense-category-badge.tsx`
- Create: `apps/web/src/components/accounting/recurring-expenses-card.tsx`
- Modify: `apps/web/src/components/layouts/sidebar.tsx`

- [ ] **Step 1: Add sidebar navigation**

In `sidebar.tsx`, add to the "Gestion" group:
```typescript
{ label: 'Comptabilité', href: '/dashboard/accounting', icon: Calculator },
```

Add a second entry if desired:
```typescript
{ label: 'Rapports', href: '/dashboard/accounting/reports', icon: BarChart3 },
```

Import `Calculator` and `BarChart3` from `lucide-react`.

- [ ] **Step 2: Create expense-category-badge.tsx**

Small component that renders a colored badge with icon for each ExpenseCategory. Map categories to Lucide icons and tailwind colors.

- [ ] **Step 3: Create expense-form-dialog.tsx**

Slide-in dialog for creating/editing an expense:
- Fields: date, label, amount, category (dropdown), payment method (dropdown), supplier, notes, isDeductible toggle
- Optional: amountHt + vatRate
- Receipt upload (drag-and-drop or click, for Solo+ plans)
- Form validation with Zod + React Hook Form
- Pre-fill date to today, payment method to last used (localStorage)

- [ ] **Step 4: Create income-book.tsx**

Read-only table of income entries from accounting book:
- Columns: Date, Patient, Description, Montant, Mode, N° Facture
- Filter by month/quarter/year
- Monthly subtotals
- Uses `accountingApi.getBook(token, { type: 'income', ... })`

- [ ] **Step 5: Create expense-list.tsx**

Table of expenses:
- Columns: Date, Libellé, Catégorie (badge), Montant, Mode, Fournisseur, Justificatif (icon)
- Filter by category, date range, search
- Actions: edit, delete, download receipt
- "+ Nouvelle dépense" button opens expense-form-dialog
- Pagination inside card

- [ ] **Step 6: Create accounting-ledger.tsx**

Unified view (income + expenses) chronologically:
- Columns: Date, Type (badge income/expense), Libellé, Débit, Crédit, Catégorie, Contrepartie
- Filter by type, date range
- Running balance display
- Uses `accountingApi.getBook(token, { ... })`

- [ ] **Step 7: Create recurring-expenses-card.tsx**

Card showing configured recurring expenses:
- List: label, amount, frequency, next generation date
- Toggle active/inactive
- Add/edit dialog
- Feature-locked for Free/Solo with upgrade CTA

- [ ] **Step 8: Create accounting-page.tsx**

Main page with tabs:
- Tab "Recettes" → income-book
- Tab "Dépenses" → expense-list + recurring-expenses-card
- Tab "Livre-journal" → accounting-ledger
- Financial summary card at top (monthly totals)

- [ ] **Step 9: Create page.tsx (server component)**

`apps/web/src/app/(dashboard)/dashboard/accounting/page.tsx`:
```typescript
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AccountingPageContent } from '@/components/accounting/accounting-page';

export default async function AccountingPage() {
  const session = await auth();
  if (!session) redirect('/login');
  return <AccountingPageContent token={session.accessToken} />;
}
```

- [ ] **Step 10: Test and commit**

```bash
cd apps/web && npm run build
git add -A && git commit -m "feat(web): add accounting main page — income book, expenses, ledger, recurring"
```

---

## Task 9: Frontend — Reports & Exports page

**Files:**
- Create: `apps/web/src/app/(dashboard)/dashboard/accounting/reports/page.tsx`
- Create: `apps/web/src/components/accounting/financial-dashboard.tsx`
- Create: `apps/web/src/components/accounting/export-section.tsx`
- Create: `apps/web/src/components/accounting/tax-prep-panel.tsx`
- Create: `apps/web/src/components/accounting/social-charges-card.tsx`
- Create: `apps/web/src/components/accounting/financial-summary-card.tsx`

- [ ] **Step 1: Create financial-summary-card.tsx**

4 KPI cards: Total recettes, Total dépenses, Résultat net, Provision mensuelle charges.
Uses `accountingApi.getSummary()`.

- [ ] **Step 2: Create financial-dashboard.tsx**

Charts (using Recharts, already in the project for analytics):
- Bar chart: Monthly income vs expenses (12 months)
- Pie chart: Expenses by category
- Table: Monthly P&L breakdown

Uses `accountingApi.getDashboard()`. Pro/Clinic only for full version; Solo gets basic summary.

- [ ] **Step 3: Create export-section.tsx**

Export buttons:
- "Télécharger CSV" — date range selector + download
- "Télécharger FEC" — year selector + download (Solo+ plan)
- Both trigger blob download via API client

- [ ] **Step 4: Create tax-prep-panel.tsx (Pro/Clinic)**

Pre-filled 2035 declaration fields:
- Recettes (AA): total income
- Grouped expenses by 2035 lines (BA through BP)
- Total dépenses (BQ)
- Résultat net (CP)
- "Copier" button next to each field
- Disclaimer: "Document d'aide à la déclaration. Ne remplace pas un expert-comptable."

Uses `accountingApi.getTaxPrep()`.

- [ ] **Step 5: Create social-charges-card.tsx (Pro/Clinic)**

URSSAF + CIPAV estimation:
- Detail: maladie, allocations, CSG/CRDS, retraite base, retraite complémentaire
- Total annuel estimé
- Provision mensuelle recommandée
- Disclaimer: "Estimation indicative. Consultez votre URSSAF/CIPAV."

Uses `accountingApi.getSocialCharges()`.

- [ ] **Step 6: Create reports page.tsx**

Server component + client content:
- financial-summary-card at top
- financial-dashboard (charts)
- export-section
- tax-prep-panel (Pro/Clinic)
- social-charges-card (Pro/Clinic)

- [ ] **Step 7: Test and commit**

```bash
cd apps/web && npm run build
git add -A && git commit -m "feat(web): add accounting reports page — dashboard, exports, 2035 prep, charges estimator"
```

---

## Task 10: Integration testing + final wiring

**Files:**
- Modify: Various files for integration fixes

- [ ] **Step 1: End-to-end backend test**

Test the full flow:
1. Create expense → verify AccountingEntry created
2. Create recurring expense → manually trigger generation → verify expense + entry created
3. Mark invoice as paid → verify income entry auto-created
4. GET /accounting/book → verify both income and expense entries
5. GET /accounting/export/csv → verify file format
6. GET /accounting/export/fec → verify 18-column format
7. Plan gating: verify Free user gets 403 on receipt upload, recurring expenses, FEC export

- [ ] **Step 2: Frontend smoke test**

1. Navigate to /dashboard/accounting → page loads
2. Switch tabs (Recettes, Dépenses, Livre-journal)
3. Create expense via dialog
4. Navigate to /dashboard/accounting/reports → charts render
5. Export CSV download works

- [ ] **Step 3: Fix any build issues**

```bash
cd apps/web && npm run build
cd apps/api && npm run build
```

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "feat: accounting module complete — expenses, recurring, ledger, FEC, 2035, dashboard"
```

---

## Summary

| Task | Description | Depends On | Notes |
|------|-------------|------------|-------|
| 1 | Prisma schema + shared types + migration | — | |
| 4* | Accounting module skeleton (entry creation + FecSequence) | 1 | Create skeleton FIRST so Task 2 can import it |
| 2 | Expenses module (CRUD + receipts) | 1, 4* | Imports AccountingModule for entry creation |
| 3 | Recurring expenses module + CRON | 1, 2 | |
| 4 | Accounting module completion (ledger, summaries, dashboard, events) | 2 | Wire event listeners, add query methods |
| 5 | FEC export + tax prep + social charges | 4 | |
| 6 | Backfill script | 4 | |
| 7 | Frontend API clients | 2, 3, 4, 5 | |
| 8 | Frontend accounting main page | 7 | |
| 9 | Frontend reports page | 7, 8 | |
| 10 | Integration testing + final wiring | All | |

**Execution order:** 1 → 4 (skeleton) → 2 → 3 → 4 (complete) → 5 → 6 → 7 → 8 → 9 → 10
