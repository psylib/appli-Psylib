# Auto Invoice Generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically generate invoices when a session is completed or a Stripe payment is confirmed, with psy-configurable toggles.

**Architecture:** Event-driven via BullMQ. Two triggers (session completion + Stripe webhook) enqueue a `generate-invoice` job. A worker creates the invoice, generates the PDF, and optionally sends an email. Psychologists control behavior via two toggles in Settings > Cabinet.

**Tech Stack:** NestJS, Prisma, BullMQ, pdfkit (existing), Resend (existing), React/Next.js frontend

**Spec:** `docs/superpowers/specs/2026-04-09-auto-invoice-generation-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `apps/api/src/invoices/invoice-generation.processor.ts` | BullMQ worker that creates invoices, generates PDFs, sends emails |
| `apps/api/src/invoices/invoice-generation.processor.spec.ts` | Unit tests for the worker |
| `apps/web/src/components/settings/invoice-settings.tsx` | Settings toggle component for auto-invoicing |

### Modified Files
| File | Changes |
|------|---------|
| `apps/api/prisma/schema.prisma` | Add `SessionStatus` enum, `InvoiceSource` enum, `status` on Session, 2 fields on Psychologist, 4 fields on Invoice |
| `apps/api/src/sessions/dto/session.dto.ts` | Add `status` field to `UpdateSessionDto` |
| `apps/api/src/sessions/sessions.service.ts` | Dispatch BullMQ job when session status → completed |
| `apps/api/src/invoices/invoices.service.ts` | Add `createAutoInvoice()`, `markAsPaid()` methods |
| `apps/api/src/invoices/invoices.module.ts` | Register BullMQ queue + processor |
| `apps/api/src/invoices/invoices.controller.ts` | Add `PATCH /:id/mark-paid` endpoint |
| `apps/api/src/billing/subscription.service.ts` | Dispatch job in `handleBookingPaymentCompleted()` and `handlePaymentLinkCompleted()` |
| `apps/api/src/onboarding/onboarding.service.ts` | Add `autoInvoice`, `autoInvoiceEmail` to `UpdatePsychologistProfileDto` and `updateProfile()` |
| `apps/web/src/lib/api/psychologist.ts` | Add new fields to `UpdateProfileData` interface |
| `apps/web/src/lib/api/invoices.ts` | Add `markAsPaid()` method, update `InvoiceRecord` type |
| `apps/web/src/components/invoices/invoices-page.tsx` | Add "Auto" badge, "Marquer payée" button, amber highlight |
| `apps/web/src/app/(dashboard)/dashboard/settings/practice/page.tsx` | Import and render `InvoiceSettings` component |

---

## Task 1: Prisma Schema Migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Add enums and fields to schema**

Add after existing enums (around line 90):

```prisma
enum SessionStatus {
  draft
  completed
}

enum InvoiceSource {
  manual
  auto
}
```

Add to `Session` model (after `aiMetadata` field, line 386):

```prisma
  status        SessionStatus @default(draft)
```

Add to `Psychologist` model (after `autoRefund` field, line 229):

```prisma
  autoInvoice      Boolean @default(true) @map("auto_invoice")
  autoInvoiceEmail Boolean @default(true) @map("auto_invoice_email")
```

Add to `Invoice` model (after `pdfUrl` field, line 719):

```prisma
  sessionId String?       @map("session_id")
  paymentId String?       @map("payment_id")
  paidAt    DateTime?     @map("paid_at")
  source    InvoiceSource @default(manual)

  session  Session?  @relation(fields: [sessionId], references: [id])
  payment  Payment?  @relation(fields: [paymentId], references: [id])
```

Add reverse relation to `Session` model:

```prisma
  invoices  Invoice[]
```

Add reverse relation to `Payment` model:

```prisma
  invoices  Invoice[]
```

- [ ] **Step 2: Generate and apply migration**

Run:
```bash
cd apps/api && npx prisma migrate dev --name auto-invoice-generation
```

Expected: Migration created and applied successfully.

- [ ] **Step 3: Verify Prisma client regenerated**

Run:
```bash
cd apps/api && npx prisma generate
```

Expected: Prisma Client generated.

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/
git commit -m "feat(invoices): add auto invoice schema (SessionStatus, InvoiceSource, new fields)"
```

---

## Task 2: Update Session DTO

**Files:**
- Modify: `apps/api/src/sessions/dto/session.dto.ts:67-128`

- [ ] **Step 1: Add status field to UpdateSessionDto**

Add import at top of file if not present:

```typescript
import { SessionStatus } from '@prisma/client';
```

Add to `UpdateSessionDto` class (after the `aiMetadata` field, around line 126):

```typescript
  @ApiPropertyOptional({ enum: SessionStatus })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;
```

- [ ] **Step 2: Verify build**

Run:
```bash
cd apps/api && npx nest build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/sessions/dto/session.dto.ts
git commit -m "feat(sessions): add status field to UpdateSessionDto"
```

---

## Task 3: Invoice Service — New Methods

**Files:**
- Modify: `apps/api/src/invoices/invoices.service.ts`
- Create: `apps/api/src/invoices/invoices.service.spec.ts` (if not exists, or extend)

- [ ] **Step 1: Write test for createAutoInvoice()**

Create or extend the spec file:

```typescript
// Test: createAutoInvoice creates a draft invoice for session_completed
describe('createAutoInvoice', () => {
  it('should create a draft invoice for session_completed', async () => {
    const result = await service.createAutoInvoice({
      type: 'session_completed',
      psychologistId: 'psy-1',
      patientId: 'pat-1',
      sessionId: 'sess-1',
      amount: 70,
      sessionDate: '2026-04-09',
    });
    expect(result).toBeDefined();
    expect(result.status).toBe('draft');
    expect(result.source).toBe('auto');
    expect(result.sessionId).toBe('sess-1');
  });

  it('should create a paid invoice for payment_received', async () => {
    const result = await service.createAutoInvoice({
      type: 'payment_received',
      psychologistId: 'psy-1',
      patientId: 'pat-1',
      appointmentId: 'apt-1',
      internalPaymentId: 'pay-uuid-1',
      amount: 70,
      sessionDate: '2026-04-09',
    });
    expect(result).toBeDefined();
    expect(result.status).toBe('paid');
    expect(result.source).toBe('auto');
    expect(result.paidAt).toBeDefined();
  });

  it('should skip if invoice already exists for session (idempotence)', async () => {
    // Mock prisma.invoice.findFirst to return existing invoice
    const result = await service.createAutoInvoice({
      type: 'session_completed',
      psychologistId: 'psy-1',
      patientId: 'pat-1',
      sessionId: 'sess-1',
      amount: 70,
      sessionDate: '2026-04-09',
    });
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd apps/api && npx vitest run src/invoices/invoices.service.spec.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `createAutoInvoice` is not a function.

- [ ] **Step 3: Implement createAutoInvoice()**

Add to `InvoicesService` (after the existing `create()` method, around line 117):

```typescript
  async createAutoInvoice(data: {
    type: 'session_completed' | 'payment_received';
    psychologistId: string;
    patientId: string;
    amount: number;
    sessionDate: string;
    sessionId?: string;
    appointmentId?: string;
    internalPaymentId?: string;
  }): Promise<Invoice | null> {
    // Idempotence check
    if (data.sessionId) {
      const existing = await this.prisma.invoice.findFirst({
        where: { sessionId: data.sessionId },
      });
      if (existing) {
        this.logger.warn(`Invoice already exists for session ${data.sessionId}, skipping`);
        return null;
      }
    }
    if (data.internalPaymentId) {
      const existing = await this.prisma.invoice.findFirst({
        where: { paymentId: data.internalPaymentId },
      });
      if (existing) {
        this.logger.warn(`Invoice already exists for payment ${data.internalPaymentId}, skipping`);
        return null;
      }
    }

    // Generate invoice number
    const year = new Date(data.sessionDate).getFullYear();
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        psychologistId: data.psychologistId,
        invoiceNumber: { startsWith: `PSY-${year}-` },
      },
      orderBy: { invoiceNumber: 'desc' },
    });
    let sequence = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-');
      const lastSeq = parseInt(parts[2] ?? '0', 10);
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }
    const invoiceNumber = `PSY-${year}-${String(sequence).padStart(3, '0')}`;

    const isPaid = data.type === 'payment_received';

    const invoice = await this.prisma.invoice.create({
      data: {
        psychologistId: data.psychologistId,
        patientId: data.patientId,
        invoiceNumber,
        amountTtc: data.amount,
        status: isPaid ? 'paid' : 'draft',
        issuedAt: new Date(data.sessionDate),
        source: 'auto',
        sessionId: data.sessionId ?? null,
        paymentId: data.internalPaymentId ?? null,
        paidAt: isPaid ? new Date() : null,
      },
    });

    return invoice;
  }
```

- [ ] **Step 4: Implement markAsPaid()**

Add after `createAutoInvoice()`:

```typescript
  async markAsPaid(userId: string, invoiceId: string): Promise<Invoice> {
    const psychologist = await this.prisma.psychologist.findFirstOrThrow({
      where: { userId },
    });

    const invoice = await this.prisma.invoice.findFirstOrThrow({
      where: { id: invoiceId, psychologistId: psychologist.id },
    });

    if (invoice.status === 'paid') {
      throw new BadRequestException('Invoice is already paid');
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
    });
  }
```

- [ ] **Step 5: Add Logger if not present**

Ensure the service has a logger:

```typescript
private readonly logger = new Logger(InvoicesService.name);
```

- [ ] **Step 6: Run tests**

Run:
```bash
cd apps/api && npx vitest run src/invoices/invoices.service.spec.ts --reporter=verbose 2>&1 | tail -20
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/invoices/
git commit -m "feat(invoices): add createAutoInvoice() and markAsPaid() methods"
```

---

## Task 4: Invoice Generation Processor (BullMQ Worker)

**Files:**
- Create: `apps/api/src/invoices/invoice-generation.processor.ts`
- Create: `apps/api/src/invoices/invoice-generation.processor.spec.ts`

- [ ] **Step 1: Write tests for the processor**

```typescript
// apps/api/src/invoices/invoice-generation.processor.spec.ts
import { Test } from '@nestjs/testing';
import { InvoiceGenerationProcessor } from './invoice-generation.processor';
import { InvoicesService } from './invoices.service';
import { EmailService } from '../notifications/email.service';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('InvoiceGenerationProcessor', () => {
  let processor: InvoiceGenerationProcessor;
  let invoicesService: any<InvoicesService>;
  let emailService: any<EmailService>;
  let prisma: any<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InvoiceGenerationProcessor,
        {
          provide: InvoicesService,
          useValue: {
            createAutoInvoice: vi.fn(),
            buildPdfBuffer: vi.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: { sendInvoiceSent: vi.fn() },
        },
        {
          provide: AuditService,
          useValue: { log: vi.fn() },
        },
        {
          provide: PrismaService,
          useValue: {
            psychologist: { findUnique: vi.fn() },
            patient: { findUnique: vi.fn() },
            invoice: { findUnique: vi.fn() },
          },
        },
      ],
    }).compile();

    processor = module.get(InvoiceGenerationProcessor);
    invoicesService = module.get(InvoicesService);
    emailService = module.get(EmailService);
    prisma = module.get(PrismaService);
  });

  it('should create draft invoice on session_completed', async () => {
    const mockInvoice = { id: 'inv-1', invoiceNumber: 'PSY-2026-001', status: 'draft', amountTtc: 70, issuedAt: new Date() };
    invoicesService.createAutoInvoice.mockResolvedValue(mockInvoice as any);

    await processor.process({
      data: {
        type: 'session_completed',
        psychologistId: 'psy-1',
        patientId: 'pat-1',
        sessionId: 'sess-1',
        amount: 70,
        sessionDate: '2026-04-09',
      },
    } as any);

    expect(invoicesService.createAutoInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'session_completed', sessionId: 'sess-1' }),
    );
    expect(emailService.sendInvoiceSent).not.toHaveBeenCalled();
  });

  it('should create paid invoice and send email on payment_received', async () => {
    const mockInvoice = { id: 'inv-1', invoiceNumber: 'PSY-2026-002', status: 'paid', amountTtc: 70, issuedAt: new Date(), patientId: 'pat-1' };
    invoicesService.createAutoInvoice.mockResolvedValue(mockInvoice as any);
    prisma.psychologist.findUnique.mockResolvedValue({ id: 'psy-1', name: 'Dr. Test', autoInvoiceEmail: true } as any);
    prisma.patient.findUnique.mockResolvedValue({ id: 'pat-1', name: 'Patient Test', email: 'patient@test.com' } as any);

    await processor.process({
      data: {
        type: 'payment_received',
        psychologistId: 'psy-1',
        patientId: 'pat-1',
        appointmentId: 'apt-1',
        internalPaymentId: 'pay-uuid-1',
        amount: 70,
        sessionDate: '2026-04-09',
      },
    } as any);

    expect(invoicesService.createAutoInvoice).toHaveBeenCalled();
    expect(emailService.sendInvoiceSent).toHaveBeenCalled();
  });

  it('should skip email if autoInvoiceEmail is false', async () => {
    const mockInvoice = { id: 'inv-1', invoiceNumber: 'PSY-2026-003', status: 'paid', amountTtc: 70, issuedAt: new Date(), patientId: 'pat-1' };
    invoicesService.createAutoInvoice.mockResolvedValue(mockInvoice as any);
    prisma.psychologist.findUnique.mockResolvedValue({ id: 'psy-1', name: 'Dr. Test', autoInvoiceEmail: false } as any);

    await processor.process({
      data: {
        type: 'payment_received',
        psychologistId: 'psy-1',
        patientId: 'pat-1',
        amount: 70,
        sessionDate: '2026-04-09',
      },
    } as any);

    expect(emailService.sendInvoiceSent).not.toHaveBeenCalled();
  });

  it('should skip if createAutoInvoice returns null (idempotence)', async () => {
    invoicesService.createAutoInvoice.mockResolvedValue(null);

    await processor.process({
      data: {
        type: 'session_completed',
        psychologistId: 'psy-1',
        patientId: 'pat-1',
        sessionId: 'sess-1',
        amount: 70,
        sessionDate: '2026-04-09',
      },
    } as any);

    expect(emailService.sendInvoiceSent).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd apps/api && npx vitest run src/invoices/invoice-generation.processor.spec.ts --reporter=verbose 2>&1 | tail -10
```

Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement the processor**

Create `apps/api/src/invoices/invoice-generation.processor.ts`:

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InvoicesService } from './invoices.service';
import { EmailService } from '../notifications/email.service';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma/prisma.service';

export const INVOICE_GENERATION_QUEUE = 'invoice-generation';

export interface GenerateInvoiceJobData {
  type: 'session_completed' | 'payment_received';
  psychologistId: string;
  patientId: string;
  amount: number;
  sessionDate: string;
  sessionId?: string;        // for session_completed trigger
  appointmentId?: string;    // for payment_received trigger
  internalPaymentId?: string; // internal Payment UUID (for idempotence + FK)
}

@Processor(INVOICE_GENERATION_QUEUE, {
  concurrency: 3,
})
export class InvoiceGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(InvoiceGenerationProcessor.name);

  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly email: EmailService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<GenerateInvoiceJobData>): Promise<void> {
    const { data } = job;
    this.logger.log(`Processing invoice generation: ${data.type} for psy ${data.psychologistId}`);

    // Create invoice (idempotence handled inside)
    const invoice = await this.invoicesService.createAutoInvoice(data);

    if (!invoice) {
      this.logger.log('Invoice already exists, skipping');
      return;
    }

    // Audit log
    await this.audit.log({
      actorId: data.psychologistId,
      actorType: 'system',
      action: 'INVOICE_AUTO_GENERATED',
      entityType: 'invoice',
      entityId: invoice.id,
      metadata: { type: data.type, invoiceNumber: invoice.invoiceNumber },
    });

    // Send email only for paid invoices with autoInvoiceEmail enabled
    if (data.type === 'payment_received') {
      const psychologist = await this.prisma.psychologist.findUnique({
        where: { id: data.psychologistId },
      });

      if (psychologist?.autoInvoiceEmail) {
        const patient = await this.prisma.patient.findUnique({
          where: { id: data.patientId },
        });

        if (patient?.email) {
          try {
            // Load invoice with relations for PDF
            const fullInvoice = await this.prisma.invoice.findUnique({
              where: { id: invoice.id },
              include: { psychologist: true, patient: true, session: true },
            });

            // Generate PDF for single session
            const sessions = fullInvoice?.session ? [fullInvoice.session] : [];
            const pdfBuffer = await this.invoicesService.buildPdfBufferPublic(
              fullInvoice as any,
              sessions,
            );

            await this.email.sendInvoiceSent(patient.email, {
              patientName: patient.name,
              psychologistName: psychologist.name,
              invoiceNumber: invoice.invoiceNumber,
              amountTtc: Number(invoice.amountTtc),
              issuedAt: invoice.issuedAt,
              pdfBuffer,
            });

            await this.audit.log({
              actorId: data.psychologistId,
              actorType: 'system',
              action: 'INVOICE_AUTO_EMAILED',
              entityType: 'invoice',
              entityId: invoice.id,
              metadata: { to: patient.email },
            });

            this.logger.log(`Invoice ${invoice.invoiceNumber} emailed to ${patient.email}`);
          } catch (error) {
            this.logger.error(`Failed to email invoice ${invoice.invoiceNumber}: ${error}`);
            // Don't throw — invoice was already created successfully
          }
        }
      }
    }
  }
}
```

- [ ] **Step 4: Expose buildPdfBuffer as public method**

In `apps/api/src/invoices/invoices.service.ts`, the `buildPdfBuffer` is private. Add a public wrapper:

```typescript
  /** Public accessor for auto-invoice processor */
  async buildPdfBufferPublic(invoice: any, sessions: any[]): Promise<Buffer> {
    return this.buildPdfBuffer(invoice, sessions);
  }
```

- [ ] **Step 5: Run tests**

Run:
```bash
cd apps/api && npx vitest run src/invoices/invoice-generation.processor.spec.ts --reporter=verbose 2>&1 | tail -20
```

Expected: All 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/invoices/invoice-generation.processor.ts apps/api/src/invoices/invoice-generation.processor.spec.ts apps/api/src/invoices/invoices.service.ts
git commit -m "feat(invoices): add BullMQ invoice generation processor"
```

---

## Task 5: Wire BullMQ Queue in InvoicesModule

**Files:**
- Modify: `apps/api/src/invoices/invoices.module.ts`

- [ ] **Step 1: Register queue and processor**

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoiceGenerationProcessor, INVOICE_GENERATION_QUEUE } from './invoice-generation.processor';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
    BullModule.registerQueue({
      name: INVOICE_GENERATION_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    }),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceGenerationProcessor],
  exports: [InvoicesService, BullModule],
})
export class InvoicesModule {}
```

**Note:** We export `BullModule` so that `SessionsModule` and `BillingModule` can inject the queue.

- [ ] **Step 2: Verify build**

Run:
```bash
cd apps/api && npx nest build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/invoices/invoices.module.ts
git commit -m "feat(invoices): register BullMQ invoice-generation queue"
```

---

## Task 6: Invoice Controller — Mark as Paid Endpoint

**Files:**
- Modify: `apps/api/src/invoices/invoices.controller.ts`

- [ ] **Step 1: Add mark-paid endpoint**

Add after the existing `markAsSent` endpoint (around line 73):

```typescript
  @Patch(':id/mark-paid')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  async markAsPaid(
    @CurrentUser() user: KeycloakUser,
    @Param('id') invoiceId: string,
  ) {
    return this.invoicesService.markAsPaid(user.sub, invoiceId);
  }
```

**Note:** Use the same `@CurrentUser()` decorator and `KeycloakUser` type already used by the other endpoints in this controller. Check existing imports at the top of the file.
```

- [ ] **Step 2: Verify build**

Run:
```bash
cd apps/api && npx nest build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/invoices/invoices.controller.ts
git commit -m "feat(invoices): add PATCH /invoices/:id/mark-paid endpoint"
```

---

## Task 7: Session Completion Trigger

**Files:**
- Modify: `apps/api/src/sessions/sessions.service.ts:171-236`
- Modify: `apps/api/src/sessions/sessions.module.ts` (import InvoicesModule)

- [ ] **Step 1: Import InvoicesModule in SessionsModule**

In `apps/api/src/sessions/sessions.module.ts`, add `InvoicesModule` to imports:

```typescript
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [InvoicesModule, /* ...existing imports */],
  // ...
})
```

- [ ] **Step 2: Inject queue in SessionsService**

Add to constructor in `sessions.service.ts`:

```typescript
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { INVOICE_GENERATION_QUEUE } from '../invoices/invoice-generation.processor';
import { GenerateInvoiceJobData } from '../invoices/invoice-generation.processor';

// In constructor:
@InjectQueue(INVOICE_GENERATION_QUEUE)
private readonly invoiceQueue: Queue<GenerateInvoiceJobData>,
```

- [ ] **Step 3: Add auto-invoice dispatch logic**

In the `update()` method, after the existing audit log block (around line 233), add:

```typescript
    // Auto-invoice on session completion
    if (dto.status === 'completed') {
      const psychologist = await this.prisma.psychologist.findUnique({
        where: { id: session.psychologistId },
      });

      if (psychologist?.autoInvoice) {
        // Check idempotence — skip if invoice already exists
        const existingInvoice = await this.prisma.invoice.findFirst({
          where: { sessionId: sessionId },
        });

        if (!existingInvoice) {
          const amount = Number(updated.rate) || Number(psychologist.defaultSessionRate) || 0;
          if (amount > 0) {
            await this.invoiceQueue.add('generate', {
              type: 'session_completed',
              psychologistId: session.psychologistId,
              patientId: session.patientId,
              sessionId: sessionId,
              amount,
              sessionDate: updated.date.toISOString(),
            });
            this.logger.log(`Enqueued auto-invoice for session ${sessionId}`);
          }
        }
      }
    }
```

**Note:** `session` is the variable from the existing `findFirstOrThrow` call earlier in the method. `updated` is the result of the Prisma update.

- [ ] **Step 4: Add status to the Prisma update data spread**

In the `update()` method, find the `this.prisma.session.update()` call and ensure `status` is included in the data spread. Add it to the conditional field mapping:

```typescript
      ...(dto.status !== undefined && { status: dto.status }),
```

- [ ] **Step 5: Verify build**

Run:
```bash
cd apps/api && npx nest build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/sessions/
git commit -m "feat(sessions): dispatch auto-invoice job on session completion"
```

---

## Task 8: Stripe Payment Trigger

**Files:**
- Modify: `apps/api/src/billing/subscription.service.ts:460-542`
- Modify: `apps/api/src/billing/billing.module.ts` (import InvoicesModule)

- [ ] **Step 1: Import InvoicesModule in BillingModule**

In `apps/api/src/billing/billing.module.ts`, add `InvoicesModule` to imports:

```typescript
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [InvoicesModule, /* ...existing imports */],
  // ...
})
```

- [ ] **Step 2: Inject queue in SubscriptionService**

Add to constructor:

```typescript
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { INVOICE_GENERATION_QUEUE, GenerateInvoiceJobData } from '../invoices/invoice-generation.processor';

// In constructor:
@InjectQueue(INVOICE_GENERATION_QUEUE)
private readonly invoiceQueue: Queue<GenerateInvoiceJobData>,
```

- [ ] **Step 3: Ensure appointment query includes consultationType**

In `handleBookingPaymentCompleted()`, find the `this.prisma.appointment.findUnique()` call and add `include: { consultationType: true }` if not already present. This is required to read `appointment.consultationType.rate`.

- [ ] **Step 4: Add dispatch in handleBookingPaymentCompleted()**

At the end of `handleBookingPaymentCompleted()` (after line 487, before closing brace):

```typescript
    // Auto-invoice for booking payment
    if (appointment) {
      const psychologist = await this.prisma.psychologist.findUnique({
        where: { id: appointment.psychologistId },
      });

      if (psychologist?.autoInvoice && appointment.patientId) {
        const rate = appointment.consultationType
          ? Number(appointment.consultationType.rate)
          : Number(psychologist.defaultSessionRate) || 0;

        if (rate > 0) {
          await this.invoiceQueue.add('generate', {
            type: 'payment_received',
            psychologistId: appointment.psychologistId,
            patientId: appointment.patientId,
            appointmentId: appointment.id,
            amount: rate,
            sessionDate: appointment.scheduledAt.toISOString(),
          });
          this.logger.log(`Enqueued auto-invoice for booking payment ${appointment.id}`);
        }
      }
    }
```

**Note:** `handleBookingPaymentCompleted()` has no internal Payment record. The `internalPaymentId` field on the job is omitted — idempotence is handled by `appointmentId` (the worker checks by sessionId, and the appointment is a unique reference).

- [ ] **Step 5: Ensure appointment query includes consultationType in handlePaymentLinkCompleted()**

Same as step 3 — find the appointment query and add `include: { consultationType: true }` if not present.

- [ ] **Step 6: Add dispatch in handlePaymentLinkCompleted()**

At the end of `handlePaymentLinkCompleted()` (after line 539, before closing brace). In this method, a `payment` record IS loaded (around line 497-499), so we can pass `payment.id` as `internalPaymentId`:

```typescript
    // Auto-invoice for payment link
    if (appointment) {
      const psychologist = await this.prisma.psychologist.findUnique({
        where: { id: appointment.psychologistId },
      });

      if (psychologist?.autoInvoice && appointment.patientId) {
        const rate = appointment.consultationType
          ? Number(appointment.consultationType.rate)
          : Number(psychologist.defaultSessionRate) || 0;

        if (rate > 0) {
          await this.invoiceQueue.add('generate', {
            type: 'payment_received',
            psychologistId: appointment.psychologistId,
            patientId: appointment.patientId,
            appointmentId: appointment.id,
            internalPaymentId: payment?.id,
            amount: rate,
            sessionDate: appointment.scheduledAt.toISOString(),
          });
          this.logger.log(`Enqueued auto-invoice for payment link ${appointment.id}`);
        }
      }
    }
```

**Note:** `payment` is the Payment record loaded earlier in this method. Its `id` is a UUID that matches the FK on `Invoice.paymentId`.

- [ ] **Step 7: Verify build**

Run:
```bash
cd apps/api && npx nest build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/billing/
git commit -m "feat(billing): dispatch auto-invoice on Stripe payment completion"
```

---

## Task 9: Psychologist Settings DTO + Profile API

The psychologist update DTO is `UpdatePsychologistProfileDto` located in `apps/api/src/onboarding/onboarding.service.ts` (NOT a separate DTO file). The frontend calls `PUT /onboarding/profile` via `psychologistApi.updateProfile()`.

**Files:**
- Modify: `apps/api/src/onboarding/onboarding.service.ts` — Add fields to `UpdatePsychologistProfileDto` and spread them in `updateProfile()`
- Modify: `apps/web/src/lib/api/psychologist.ts` — Add fields to `UpdateProfileData` interface

- [ ] **Step 1: Add toggle fields to UpdatePsychologistProfileDto**

In `apps/api/src/onboarding/onboarding.service.ts`, find the `UpdatePsychologistProfileDto` class and add:

```typescript
  @ApiPropertyOptional({ description: 'Auto-generate invoices on session completion' })
  @IsOptional()
  @IsBoolean()
  autoInvoice?: boolean;

  @ApiPropertyOptional({ description: 'Auto-send invoice email on payment confirmation' })
  @IsOptional()
  @IsBoolean()
  autoInvoiceEmail?: boolean;
```

Ensure `IsBoolean` is imported from `class-validator`.

- [ ] **Step 2: Ensure updateProfile() spreads the new fields**

In the `updateProfile()` method of the same file, find the `this.prisma.psychologist.update()` call and ensure the new fields are included in the data spread:

```typescript
      ...(dto.autoInvoice !== undefined && { autoInvoice: dto.autoInvoice }),
      ...(dto.autoInvoiceEmail !== undefined && { autoInvoiceEmail: dto.autoInvoiceEmail }),
```

- [ ] **Step 3: Add fields to frontend UpdateProfileData interface**

In `apps/web/src/lib/api/psychologist.ts`, find the `UpdateProfileData` interface and add:

```typescript
  autoInvoice?: boolean;
  autoInvoiceEmail?: boolean;
```

Also add these fields to the `PsychologistProfile` interface (or wherever the profile response type is defined) so the settings page can read initial values.

- [ ] **Step 4: Verify build**

Run:
```bash
cd apps/api && npx nest build 2>&1 | tail -5
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/onboarding/onboarding.service.ts apps/web/src/lib/api/psychologist.ts
git commit -m "feat(psychologists): add autoInvoice/autoInvoiceEmail to profile DTO"
```

---

## Task 10: Run All API Tests

- [ ] **Step 1: Run full test suite**

Run:
```bash
cd apps/api && npx vitest run --reporter=verbose 2>&1 | tail -30
```

Expected: All tests pass (340+ existing + new tests).

- [ ] **Step 2: Fix any failures**

Address test failures if any. Common issues:
- Missing mocks for new constructor dependencies (InjectQueue)
- Prisma client type mismatches from new fields

- [ ] **Step 3: Commit if fixes were needed**

```bash
git add -A && git commit -m "fix(tests): fix test suite after auto-invoice changes"
```

---

## Task 11: Frontend — API Client Update

**Files:**
- Modify: `apps/web/src/lib/api/invoices.ts`

- [ ] **Step 1: Update InvoiceRecord type and add markAsPaid**

```typescript
export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  amountTtc: string;
  status: 'draft' | 'sent' | 'paid';
  issuedAt: string;
  pdfUrl: string | null;
  source: 'manual' | 'auto';
  paidAt: string | null;
  sessionId: string | null;
  patient: { id: string; name: string; email: string | null } | null;
}

export const invoicesApi = {
  // ...existing methods...

  markAsPaid: (id: string, token: string) =>
    apiClient.patch<InvoiceRecord>(`/invoices/${id}/mark-paid`, {}, token),
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/api/invoices.ts
git commit -m "feat(web): add markAsPaid to invoices API client"
```

---

## Task 12: Frontend — Invoices Page Enhancements

**Files:**
- Modify: `apps/web/src/components/invoices/invoices-page.tsx`

- [ ] **Step 1: Add "Auto" badge and "Marquer payée" button**

In the `InvoiceRow` component (around line 217), after the status badge, add:

```tsx
{invoice.source === 'auto' && (
  <span className="ml-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
    Auto
  </span>
)}
```

Add the "Marquer payée" button in the actions section (alongside existing PDF/Send buttons):

```tsx
{invoice.status === 'sent' && (
  <Button
    size="sm"
    variant="outline"
    className="text-accent border-accent/30 hover:bg-accent/10"
    onClick={async () => {
      await invoicesApi.markAsPaid(invoice.id, token);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }}
  >
    Marquer payée
  </Button>
)}
```

- [ ] **Step 2: Add amber highlight for recent auto invoices**

In the `InvoiceRow` `<tr>` element, add conditional class:

```tsx
<tr className={cn(
  'border-b border-border/50',
  invoice.source === 'auto' && invoice.status === 'draft' && 'bg-amber-50/50'
)}>
```

- [ ] **Step 3: Verify Next.js build**

Run:
```bash
cd apps/web && npx next build 2>&1 | tail -20
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/invoices/invoices-page.tsx
git commit -m "feat(web): add Auto badge, mark-paid button, amber highlight to invoices"
```

---

## Task 13: Frontend — Invoice Settings Component

**Files:**
- Create: `apps/web/src/components/settings/invoice-settings.tsx`
- Modify: `apps/web/src/app/(dashboard)/dashboard/settings/practice/page.tsx`

- [ ] **Step 1: Create InvoiceSettings component**

Create `apps/web/src/components/settings/invoice-settings.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { psychologistApi } from '@/lib/api/psychologist';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface InvoiceSettingsProps {
  initialAutoInvoice?: boolean;
  initialAutoInvoiceEmail?: boolean;
}

export function InvoiceSettings({
  initialAutoInvoice = true,
  initialAutoInvoiceEmail = true,
}: InvoiceSettingsProps) {
  const { token } = useAuth();
  const [autoInvoice, setAutoInvoice] = useState(initialAutoInvoice);
  const [autoInvoiceEmail, setAutoInvoiceEmail] = useState(initialAutoInvoiceEmail);
  const [saving, setSaving] = useState(false);

  const handleToggle = async (field: 'autoInvoice' | 'autoInvoiceEmail', value: boolean) => {
    if (!token) return;
    setSaving(true);
    try {
      await psychologistApi.updateProfile({ [field]: value }, token);
      if (field === 'autoInvoice') {
        setAutoInvoice(value);
        if (!value) setAutoInvoiceEmail(false);
      } else {
        setAutoInvoiceEmail(value);
      }
      toast.success('Paramètre mis à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Facturation
        </CardTitle>
        <CardDescription>
          Configuration de la génération automatique de factures
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="auto-invoice" className="font-medium">
              Facturation automatique
            </Label>
            <p className="text-sm text-muted-foreground">
              Génère automatiquement une facture quand une séance est terminée ou un paiement reçu
            </p>
          </div>
          <Switch
            id="auto-invoice"
            checked={autoInvoice}
            onCheckedChange={(v) => handleToggle('autoInvoice', v)}
            disabled={saving}
          />
        </div>

        {autoInvoice && (
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="auto-invoice-email" className="font-medium">
                Envoi automatique par email
              </Label>
              <p className="text-sm text-muted-foreground">
                Envoie automatiquement la facture par email quand le paiement est confirmé (Stripe)
              </p>
            </div>
            <Switch
              id="auto-invoice-email"
              checked={autoInvoiceEmail}
              onCheckedChange={(v) => handleToggle('autoInvoiceEmail', v)}
              disabled={saving}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Import InvoiceSettings in practice page**

In `apps/web/src/app/(dashboard)/dashboard/settings/practice/page.tsx`, add import and render after the PaymentSettings component (around line 127):

```typescript
import { InvoiceSettings } from '@/components/settings/invoice-settings';
```

And in the JSX, add after `<PaymentSettings />`:

```tsx
<InvoiceSettings
  initialAutoInvoice={psychologist?.autoInvoice ?? true}
  initialAutoInvoiceEmail={psychologist?.autoInvoiceEmail ?? true}
/>
```

**Note:** Verify how `psychologist` data is loaded in this page and ensure the new fields are included in the query.

- [ ] **Step 3: Verify Next.js build**

Run:
```bash
cd apps/web && npx next build 2>&1 | tail -20
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/settings/invoice-settings.tsx apps/web/src/app/(dashboard)/dashboard/settings/practice/page.tsx
git commit -m "feat(web): add invoice auto-generation settings toggles"
```

---

## Task 14: Final Verification

- [ ] **Step 1: Run full API test suite**

Run:
```bash
cd apps/api && npx vitest run --reporter=verbose 2>&1 | tail -30
```

Expected: All tests pass.

- [ ] **Step 2: Run Next.js build**

Run:
```bash
cd apps/web && npx next build 2>&1 | tail -20
```

Expected: Build succeeds.

- [ ] **Step 3: Verify no TypeScript errors**

Run:
```bash
cd apps/api && npx tsc --noEmit 2>&1 | tail -10
cd apps/web && npx tsc --noEmit 2>&1 | tail -10
```

Expected: No errors.

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix: final adjustments for auto-invoice feature"
```
