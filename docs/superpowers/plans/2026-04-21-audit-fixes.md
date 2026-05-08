# Audit Fixes — Critical & High Severity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 10 most critical/high-severity issues from the 2026-04-21 audit (15 CRITIQUES, 62 HAUTE), bringing the security score from 57/100 toward 75+.

**Architecture:** Backend-focused fixes across NestJS API (filters, guards, queries, schema) plus one Playwright config fix. All changes are backwards-compatible. Migration adds onDelete policies to FK relations. No frontend changes needed.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Socket.io, Playwright

**Audit reference:** `memory/audit-2026-04-21.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `apps/api/src/common/prisma-exception.filter.ts` | Catch Prisma P2002/P2025/P2003 → proper HTTP codes |
| Modify | `apps/api/src/main.ts:42` | Register PrismaExceptionFilter before SentryFilter |
| Modify | `apps/api/src/messaging/messaging.gateway.ts:133-162` | Add membership check on join_conversation |
| Modify | `apps/api/prisma/schema.prisma` | Add onDelete: SetNull on 11 FK relations |
| Create | `apps/api/prisma/migrations/20260421_audit_fk_ondelete/migration.sql` | Migration for FK onDelete changes |
| Modify | `apps/api/src/accounting/accounting.service.ts:220-329` | Replace N+1 loop with single GROUP BY query |
| Modify | `apps/web/playwright.config.ts:13` | Change baseURL default to localhost:3000 |
| Modify | `apps/api/src/expenses/expenses.controller.ts` | Add ParseUUIDPipe on 5 @Param |
| Modify | `apps/api/src/ai/ai.controller.ts:198` | Add ParseUUIDPipe on @Param |
| Modify | `apps/api/src/billing/billing.controller.ts:110` | Add ParseUUIDPipe on @Param |

---

### Task 1: Fix WebSocket IDOR — add membership verification on join_conversation

**CRITICAL** — Any authenticated user can join any conversation room without being a participant.

**Files:**
- Modify: `apps/api/src/messaging/messaging.gateway.ts:133-162`

- [ ] **Step 1: Add membership check before room join**

In `handleJoinConversation`, after validating `conversationId` is present and before `client.join(room)`, add a Prisma query to verify the user is a participant (either the psychologist or the patient) of the conversation:

```typescript
@SubscribeMessage('join_conversation')
async handleJoinConversation(
  @MessageBody() payload: JoinConversationPayload,
  @ConnectedSocket() client: Socket,
): Promise<void> {
  const authSocket = client as AuthenticatedSocket;

  if (!authSocket.userId) {
    throw new WsException('Non authentifié');
  }

  const { conversationId } = payload;
  if (!conversationId) {
    throw new WsException('conversationId requis');
  }

  try {
    // AUDIT FIX: Verify membership before joining room
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        psychologist: { select: { userId: true } },
        patient: { select: { userId: true } },
      },
    });

    if (!conversation) {
      throw new WsException('Conversation introuvable');
    }

    const isMember =
      conversation.psychologist.userId === authSocket.userId ||
      conversation.patient.userId === authSocket.userId;

    if (!isMember) {
      this.logger.warn(
        `[WS] IDOR blocked: ${authSocket.userId} tried to join conversation ${conversationId}`,
      );
      throw new WsException('Accès non autorisé à cette conversation');
    }

    const room = `conversation:${conversationId}`;
    await client.join(room);
    this.logger.log(
      `[WS] ${authSocket.userId} a rejoint la room ${room}`,
    );
    client.emit('joined_conversation', { conversationId, room });
  } catch (error) {
    if (error instanceof WsException) throw error;
    this.logger.error(
      `[WS] Erreur join_conversation: ${(error as Error).message}`,
    );
    throw new WsException('Impossible de rejoindre la conversation');
  }
}
```

- [ ] **Step 2: Verify the fix compiles**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/messaging/messaging.gateway.ts
git commit -m "fix(security): add membership verification on WebSocket join_conversation

Prevents IDOR — users can no longer join conversation rooms they don't belong to.
Audit item #1 (CRITICAL)."
```

---

### Task 2: Add PrismaExceptionFilter global

**CRITICAL** — Prisma P2002/P2025/P2003 errors return as 500 instead of 400/404/409.

**Files:**
- Create: `apps/api/src/common/prisma-exception.filter.ts`
- Modify: `apps/api/src/main.ts:42`

- [ ] **Step 1: Create PrismaExceptionFilter**

```typescript
// apps/api/src/common/prisma-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const fields = (exception.meta?.target as string[])?.join(', ') ?? 'unknown';
        message = `Un enregistrement avec ces valeurs existe déjà (${fields})`;
        break;
      }
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Enregistrement introuvable';
        break;
      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;
        message = 'Référence invalide — l\'enregistrement lié n\'existe pas';
        break;
      }
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Erreur de base de données';
    }

    this.logger.warn(
      `[Prisma ${exception.code}] ${request.method} ${request.url} → ${status}`,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      code: `PRISMA_${exception.code}`,
    });
  }
}
```

- [ ] **Step 2: Register in main.ts — PrismaExceptionFilter BEFORE SentryExceptionFilter**

In `apps/api/src/main.ts`, replace line 42:

First, add the import at the top of `main.ts` near line 28 (with other imports):

```typescript
import { PrismaExceptionFilter } from './common/prisma-exception.filter';
```

Then replace line 42:

```typescript
// Before:
app.useGlobalFilters(new SentryExceptionFilter());

// After:
app.useGlobalFilters(
  new SentryExceptionFilter(),
  new PrismaExceptionFilter(),
);
```

Note: NestJS processes global filters in **reverse order** — the last one registered is evaluated first. So `PrismaExceptionFilter` (last) catches Prisma errors first; `SentryExceptionFilter` (first) catches everything else.

- [ ] **Step 3: Verify the fix compiles**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/common/prisma-exception.filter.ts apps/api/src/main.ts
git commit -m "feat(api): add PrismaExceptionFilter for proper HTTP error codes

P2002 → 409 Conflict, P2025 → 404 Not Found, P2003 → 400 Bad Request.
Prevents Prisma errors from returning as 500. Audit item #6 (CRITICAL)."
```

---

### Task 3: Fix FK onDelete for RGPD purge cascade

**CRITICAL** — 11 FK relations default to `Restrict`, blocking user/patient deletion.

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (11 relations)
- Create: `apps/api/prisma/migrations/20260421_audit_fk_ondelete/migration.sql`

**Strategy:** For billing/audit tables, use `SetNull` (keep the record but unlink the deleted entity). This preserves financial records (legal requirement) while allowing user/patient purge. For AccountingEntry optional FKs, use `SetNull`.

**Relations to fix:**

| Model | Field | Current | Target | Reason |
|-------|-------|---------|--------|--------|
| AuditLog | actor → User | Restrict | SetNull | Keep audit trail, anonymize actor |
| Payment | patient → Patient | Restrict | SetNull | Keep payment record, unlink patient |
| Payment | appointment → Appointment | Restrict | SetNull | Keep payment, unlink apt |
| Invoice | patient → Patient | Restrict | SetNull | Keep invoice, unlink patient |
| Invoice | session → Session | Restrict | SetNull | Keep invoice, unlink session |
| Invoice | payment → Payment | Restrict | SetNull | Keep invoice, unlink payment |
| Message | sender → User | Restrict | SetNull | Keep msg, anonymize sender |
| CourseEnrollment | user → User | Restrict | SetNull | Keep enrollment, unlink user |
| AccountingEntry | invoice → Invoice | Restrict | SetNull | Keep entry, unlink invoice |
| AccountingEntry | payment → Payment | Restrict | SetNull | Keep entry, unlink payment |
| AccountingEntry | expense → Expense | Restrict | SetNull | Keep entry, unlink expense |
| ReferralInvite | referred → Psychologist | Restrict | SetNull | Keep invite, unlink referred |
| Expense | recurringExpense → RecurringExpense | Restrict | SetNull | Keep expense, unlink template |
| Appointment | consultationType → ConsultationType | Restrict | SetNull | Keep apt, unlink type |
| Appointment | session → Session | Restrict | SetNull | Keep apt, unlink session |
| Patient | user → User | Restrict | SetNull | Keep patient, unlink user account |

- [ ] **Step 1: Update schema.prisma — add onDelete policies**

For `AuditLog.actor`, the `actorId` must become nullable to support `SetNull`:

```prisma
// AuditLog — actorId must become nullable
model AuditLog {
  actorId    String?  @map("actor_id")  // was String (non-nullable)
  actor      User?    @relation(fields: [actorId], references: [id], onDelete: SetNull)
}

// Payment.patient — already nullable, just add onDelete
patient Patient? @relation(fields: [patientId], references: [id], onDelete: SetNull)
// Payment.appointment — already nullable, just add onDelete
appointment Appointment? @relation(fields: [appointmentId], references: [id], onDelete: SetNull)

// Invoice — all 3 are already nullable, just add onDelete
patient Patient? @relation(fields: [patientId], references: [id], onDelete: SetNull)
session Session? @relation(fields: [sessionId], references: [id], onDelete: SetNull)
payment Payment? @relation(fields: [paymentId], references: [id], onDelete: SetNull)

// Message.sender — must become nullable
senderId String? @map("sender_id")  // was String (non-nullable)
sender   User?   @relation("MessageSender", fields: [senderId], references: [id], onDelete: SetNull)

// CourseEnrollment.user — must become nullable
userId String? @map("user_id")  // was String (non-nullable)
user   User?   @relation(fields: [userId], references: [id], onDelete: SetNull)

// AccountingEntry — all 3 are already nullable, just add onDelete
invoice Invoice? @relation(fields: [invoiceId], references: [id], onDelete: SetNull)
payment Payment? @relation(fields: [paymentId], references: [id], onDelete: SetNull)
expense Expense? @relation(fields: [expenseId], references: [id], onDelete: SetNull)

// ReferralInvite.referred — already nullable, add onDelete
referred Psychologist? @relation("InviteTo", fields: [referredId], references: [id], onDelete: SetNull)

// Expense.recurringExpense — already nullable, add onDelete
recurringExpense RecurringExpense? @relation(fields: [recurringExpenseId], references: [id], onDelete: SetNull)

// Appointment.consultationType — already nullable, add onDelete
consultationType ConsultationType? @relation(fields: [consultationTypeId], references: [id], onDelete: SetNull)

// Appointment.session — already nullable, add onDelete (check the relation line)
session Session? @relation(fields: [sessionId], references: [id], onDelete: SetNull)

// Patient.user — already nullable, add onDelete
user User? @relation("UserPatient", fields: [userId], references: [id], onDelete: SetNull)

// NOTE: AppointmentParticipant already has onDelete: Cascade on both FKs. No change needed.
```

- [ ] **Step 2: Create migration SQL**

```sql
-- 20260421_audit_fk_ondelete/migration.sql
-- Make AuditLog.actorId nullable + SetNull FK
ALTER TABLE "audit_logs" ALTER COLUMN "actor_id" DROP NOT NULL;
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_actor_id_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Make Message.senderId nullable + SetNull FK
ALTER TABLE "messages" ALTER COLUMN "sender_id" DROP NOT NULL;
ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_sender_id_fkey";
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey"
  FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Make CourseEnrollment.userId nullable + SetNull FK
ALTER TABLE "course_enrollments" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "course_enrollments" DROP CONSTRAINT IF EXISTS "course_enrollments_user_id_fkey";
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Payment.patientId — SetNull FK (already nullable)
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_patient_id_fkey";
ALTER TABLE "payments" ADD CONSTRAINT "payments_patient_id_fkey"
  FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Payment.appointmentId — SetNull FK (already nullable)
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_appointment_id_fkey";
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointment_id_fkey"
  FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Invoice.patientId — SetNull FK (already nullable)
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_patient_id_fkey";
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_fkey"
  FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Invoice.sessionId — SetNull FK (already nullable)
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_session_id_fkey";
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Invoice.paymentId — SetNull FK (already nullable)
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_payment_id_fkey";
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AccountingEntry.invoiceId — SetNull FK (already nullable)
ALTER TABLE "accounting_entries" DROP CONSTRAINT IF EXISTS "accounting_entries_invoice_id_fkey";
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AccountingEntry.paymentId — SetNull FK (already nullable)
ALTER TABLE "accounting_entries" DROP CONSTRAINT IF EXISTS "accounting_entries_payment_id_fkey";
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AccountingEntry.expenseId — SetNull FK (already nullable)
ALTER TABLE "accounting_entries" DROP CONSTRAINT IF EXISTS "accounting_entries_expense_id_fkey";
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_expense_id_fkey"
  FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ReferralInvite.referredId — SetNull FK (already nullable)
ALTER TABLE "referral_invites" DROP CONSTRAINT IF EXISTS "referral_invites_referred_id_fkey";
ALTER TABLE "referral_invites" ADD CONSTRAINT "referral_invites_referred_id_fkey"
  FOREIGN KEY ("referred_id") REFERENCES "psychologists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Expense.recurringExpenseId — SetNull FK (already nullable)
ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "expenses_recurring_expense_id_fkey";
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recurring_expense_id_fkey"
  FOREIGN KEY ("recurring_expense_id") REFERENCES "recurring_expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Patient.userId — SetNull FK (already nullable)
ALTER TABLE "patients" DROP CONSTRAINT IF EXISTS "patients_user_id_fkey";
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Appointment.consultationTypeId — SetNull FK (already nullable)
ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_consultation_type_id_fkey";
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_consultation_type_id_fkey"
  FOREIGN KEY ("consultation_type_id") REFERENCES "consultation_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Appointment.sessionId — SetNull FK (already nullable)
ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_session_id_fkey";
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- NOTE: AppointmentParticipant already has onDelete: Cascade on both FKs (appointment + patient). No change needed.
-- NOTE: Payment.appointmentId has @db.Uuid but appointments.id is TEXT — verify FK exists on live DB.
-- If payments_appointment_id_fkey doesn't exist due to type mismatch, skip that ALTER above.
```

- [ ] **Step 3: Generate Prisma migration**

Run: `cd apps/api && npx prisma migrate dev --name audit_fk_ondelete --create-only`

Then replace the generated SQL with our hand-crafted migration above (or verify Prisma's generated output matches).

- [ ] **Step 4: Verify migration applies locally**

Run: `cd apps/api && npx prisma migrate dev`
Expected: Migration applied successfully

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "fix(db): add onDelete SetNull on 16 FK relations for RGPD purge

AuditLog.actorId, Message.senderId, CourseEnrollment.userId now nullable.
Payment, Invoice, AccountingEntry FKs use SetNull to preserve billing records.
Audit item #4 (CRITICAL)."
```

---

### Task 4: Fix N+1 accounting dashboard — 24 queries → 2

**CRITICAL** — `getDashboard` runs 24 sequential aggregate queries in a loop.

**Files:**
- Modify: `apps/api/src/accounting/accounting.service.ts:220-329`

- [ ] **Step 1: Replace N+1 loop with single raw GROUP BY query**

Replace the `for` loop (lines 235-272) with a single raw SQL query using `$queryRaw`:

```typescript
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
```

This reduces from 15 DB round-trips to 3 (monthly P&L + category groupBy + YTD totals).

- [ ] **Step 2: Verify the fix compiles**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/accounting/accounting.service.ts
git commit -m "perf(accounting): replace N+1 dashboard queries with single GROUP BY

24 sequential aggregate queries → 1 raw SQL GROUP BY + 2 aggregates.
Audit item #5 (CRITICAL)."
```

---

### Task 5: Fix Playwright baseURL → localhost

**MEDIUM** — Default baseURL points to production, dangerous for E2E tests.

**Files:**
- Modify: `apps/web/playwright.config.ts:13`

- [ ] **Step 1: Change default baseURL**

```typescript
// Before:
baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'https://psylib.eu',

// After:
baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000',
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/playwright.config.ts
git commit -m "fix(e2e): change Playwright baseURL default from production to localhost

Prevents accidental E2E tests against production. Audit item #10."
```

---

### Task 6: Add ParseUUIDPipe on 7 missing @Param endpoints

**HIGH** — Missing input validation allows non-UUID strings to reach DB queries.

**Files:**
- Modify: `apps/api/src/expenses/expenses.controller.ts` (5 params)
- Modify: `apps/api/src/ai/ai.controller.ts:198` (1 param)
- Modify: `apps/api/src/billing/billing.controller.ts:110` (1 param)

- [ ] **Step 1: Fix expenses.controller.ts — add ParseUUIDPipe to all 5 @Param('id')**

Add `ParseUUIDPipe` import and apply to each `@Param('id')`:

```typescript
import { ParseUUIDPipe } from '@nestjs/common';

// Line 68:
@Param('id', ParseUUIDPipe) id: string,
// Line 76:
@Param('id', ParseUUIDPipe) id: string,
// Line 85:
@Param('id', ParseUUIDPipe) id: string,
// Line 101:
@Param('id', ParseUUIDPipe) id: string,
// Line 110:
@Param('id', ParseUUIDPipe) id: string,
```

- [ ] **Step 2: Fix ai.controller.ts — add ParseUUIDPipe**

```typescript
// Line 198 — before:
@Param('id') id: string,
// After:
@Param('id', ParseUUIDPipe) id: string,
```

Ensure `ParseUUIDPipe` is in the imports from `@nestjs/common`.

- [ ] **Step 3: Fix billing.controller.ts — add ParseUUIDPipe**

```typescript
// Line 110 — before:
@Param('appointmentId') appointmentId: string,
// After:
@Param('appointmentId', ParseUUIDPipe) appointmentId: string,
```

Ensure `ParseUUIDPipe` is in the imports from `@nestjs/common`.

- [ ] **Step 4: Verify the fix compiles**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/expenses/expenses.controller.ts apps/api/src/ai/ai.controller.ts apps/api/src/billing/billing.controller.ts
git commit -m "fix(api): add ParseUUIDPipe on 7 missing @Param endpoints

Validates UUID format before reaching DB queries. Audit item #7."
```

---

### Task 7: Secure receipt upload path — prevent path traversal

**HIGH** — `uploadReceipt` uses `path.join(process.cwd(), ...)` with user-controlled IDs. While UUIDs limit risk, adding `path.resolve` safety and validating the final path is inside the expected directory prevents any traversal.

**Files:**
- Modify: `apps/api/src/expenses/expenses.service.ts:273-284`

- [ ] **Step 1: Add path traversal guard**

After line 273, add a safety check:

```typescript
// Build storage path — with traversal guard
const baseUploadDir = path.resolve(process.cwd(), 'uploads', 'receipts');
const uploadDir = path.resolve(baseUploadDir, psychologistId, id);

// Prevent path traversal
if (!uploadDir.startsWith(baseUploadDir)) {
  throw new BadRequestException('Chemin de fichier invalide');
}

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Sanitize filename — strip directory separators
const ext = path.extname(file.originalname).toLowerCase();
const safeFilename = `receipt_${Date.now()}${ext}`;
const filePath = path.resolve(uploadDir, safeFilename);

// Double-check final path is still inside upload dir
if (!filePath.startsWith(baseUploadDir)) {
  throw new BadRequestException('Nom de fichier invalide');
}

fs.writeFileSync(filePath, file.buffer);
```

- [ ] **Step 2: Verify the fix compiles**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/expenses/expenses.service.ts
git commit -m "fix(security): add path traversal guard on receipt upload

Validates resolved path stays inside uploads/receipts/ directory. Audit item #2."
```

---

### Task 8: Remove enableImplicitConversion from ValidationPipe

**HIGH** — `enableImplicitConversion: true` can silently coerce types, bypassing validation.

**Files:**
- Modify: `apps/api/src/main.ts:80-82`

- [ ] **Step 1: Remove enableImplicitConversion**

```typescript
// Before:
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);

// After:
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

**CAUTION:** This may break DTOs that rely on implicit string→number/boolean conversion. After this change, DTOs must use explicit `@Type(() => Number)` decorators from `class-transformer` for numeric query params. Test locally before deploying.

- [ ] **Step 2: Check for @Query DTOs that use number/boolean without @Type**

Search for DTOs with number/boolean fields that might break:

Run: `grep -rn "IsInt\|IsNumber\|IsBoolean\|Min\|Max" apps/api/src/ --include="*.dto.ts"`

For each DTO field that takes a number from a query param (strings by default in HTTP), add:

```typescript
import { Type } from 'class-transformer';

@Type(() => Number)
@IsInt()
page: number;
```

- [ ] **Step 3: Verify the fix compiles**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Smoke test — verify query endpoints still parse page/limit correctly**

Test locally with curl or Postman that endpoints accepting `?page=1&limit=10` still work. If any DTO uses `@IsInt()` or `@IsNumber()` on a `@Query()` parameter without `@Type(() => Number)`, it will now receive a string and fail validation. Fix any broken DTOs before proceeding.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/main.ts apps/api/src/
git commit -m "fix(api): remove enableImplicitConversion from ValidationPipe

Prevents silent type coercion. Added explicit @Type() decorators where needed.
Audit HAUTE sévérité."
```

---

### Task 9: Add machine-readable error codes to SentryExceptionFilter

**HIGH** — Error responses lack structured error codes for frontend error handling.

**Files:**
- Modify: `apps/api/src/common/sentry-exception.filter.ts`

- [ ] **Step 1: Add error code to response**

```typescript
catch(exception: unknown, host: ArgumentsHost) {
  const ctx = host.switchToHttp();
  const response = ctx.getResponse<Response>();
  const request = ctx.getRequest<Request>();

  const status =
    exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

  if (status >= 500) {
    Sentry.captureException(exception, {
      extra: {
        path: request.url,
        method: request.method,
      },
    });
    this.logger.error(
      `[${request.method}] ${request.url} → ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );
  }

  // Extract message from HttpException response (handles string or object)
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  if (exception instanceof HttpException) {
    const exResponse = exception.getResponse();
    if (typeof exResponse === 'string') {
      message = exResponse;
    } else if (typeof exResponse === 'object' && exResponse !== null) {
      const obj = exResponse as Record<string, unknown>;
      message = (obj['message'] as string) ?? exception.message;
      code = (obj['code'] as string) ?? `HTTP_${status}`;
    }
  }

  response.status(status).json({
    statusCode: status,
    timestamp: new Date().toISOString(),
    path: request.url,
    message,
    code,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/common/sentry-exception.filter.ts
git commit -m "feat(api): add machine-readable error codes to exception filter

Error responses now include a 'code' field for frontend error handling.
Audit item #7 (CRITICAL)."
```

---

### Task 10: Final verification — TypeScript compile + build check

- [ ] **Step 1: Full TypeScript check**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Build check**

Run: `cd apps/api && pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Final commit with all remaining changes (if any)**

```bash
git add -A
git status
# Only commit if there are unstaged changes from prior tasks
```

---

## Out of Scope (Operational / Future)

These items from the audit require operational changes, not code fixes:

1. **Keycloak secrets rotation** — Already in `.gitignore`, file not tracked. Rotate passwords manually on VPS, then delete local file.
2. **CI lint/tests activation** — Edit `.github/workflows/ci.yml` to remove `echo` stubs.
3. **Branch protection on main** — GitHub repo settings, not code.
4. **Tests: auth guards, RGPD purge, messaging** — Separate test-writing sprint.
5. **Receipt upload to S3** — Requires S3 bucket setup + AWS SDK integration (separate feature).
6. **AI summary persistence** — Requires design decision on when/how to save streamed summary.
7. **God Component refactor** — `network/page.tsx` 1371 lines needs separate planning.
8. **Paginer endpoints sans pagination** — invoices, messages, notifications (audit TOP 10 #6). Requires DTO changes + frontend adaptation — separate sprint.
