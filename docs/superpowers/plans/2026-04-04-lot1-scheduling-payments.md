# Lot 1 — Consultation Types, Mon Soutien Psy, Online Payment, Waitlist, SMS Reminders

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add session type flexibility (45min/60min), Mon Soutien Psy government reimbursement tracking, online payment at booking via Stripe Connect, waitlist management, and SMS reminder architecture.

**Architecture:** New `consultation_types` table drives the booking flow — patients choose a motif, slots adapt to its duration. Stripe Connect Express routes payments directly to psychologists. MSP tracking increments on Session creation (post-consultation). Waitlist notifies psy on cancellation. SMS architecture uses provider abstraction (stub for now).

**Tech Stack:** NestJS, Prisma, PostgreSQL, Stripe Connect Express, Next.js, shadcn/ui, Resend, Vitest

**Spec:** `docs/superpowers/specs/2026-04-04-lot1-scheduling-payments-design.md`

---

## File Map

### New Files (Backend)
| File | Responsibility |
|------|---------------|
| `apps/api/src/consultation-types/consultation-types.module.ts` | Module registration |
| `apps/api/src/consultation-types/consultation-types.service.ts` | CRUD + MSP rate lock |
| `apps/api/src/consultation-types/consultation-types.controller.ts` | REST endpoints |
| `apps/api/src/consultation-types/dto/create-consultation-type.dto.ts` | Create DTO + Zod |
| `apps/api/src/consultation-types/dto/update-consultation-type.dto.ts` | Update DTO |
| `apps/api/src/consultation-types/__tests__/consultation-types.service.spec.ts` | Unit tests |
| `apps/api/src/mon-soutien-psy/mon-soutien-psy.module.ts` | Module registration |
| `apps/api/src/mon-soutien-psy/mon-soutien-psy.service.ts` | Tracking + counter + alerts |
| `apps/api/src/mon-soutien-psy/mon-soutien-psy.controller.ts` | REST endpoints |
| `apps/api/src/mon-soutien-psy/__tests__/mon-soutien-psy.service.spec.ts` | Unit tests |
| `apps/api/src/waitlist/waitlist.module.ts` | Module registration |
| `apps/api/src/waitlist/waitlist.service.ts` | CRUD + cancellation notification |
| `apps/api/src/waitlist/waitlist.controller.ts` | REST endpoints |
| `apps/api/src/waitlist/dto/create-waitlist-entry.dto.ts` | DTOs |
| `apps/api/src/waitlist/__tests__/waitlist.service.spec.ts` | Unit tests |
| `apps/api/src/reminder/reminder.module.ts` | Module registration |
| `apps/api/src/reminder/reminder.service.ts` | Cron + template processing |
| `apps/api/src/reminder/sms-provider.interface.ts` | SMS provider interface |
| `apps/api/src/reminder/stub-sms.provider.ts` | Stub provider |
| `apps/api/src/reminder/__tests__/reminder.service.spec.ts` | Unit tests |

### New Files (Frontend)
| File | Responsibility |
|------|---------------|
| `apps/web/src/components/settings/consultation-types-settings.tsx` | Motifs CRUD UI |
| `apps/web/src/components/settings/reminder-settings.tsx` | Reminder config UI |
| `apps/web/src/components/settings/payment-settings.tsx` | Online payment toggle + Stripe Connect |
| `apps/web/src/components/settings/msp-settings.tsx` | Mon Soutien Psy toggle |
| `apps/web/src/components/patients/msp-tracker.tsx` | MSP counter on patient page |
| `apps/web/src/components/booking/consultation-type-picker.tsx` | Motif selection cards |
| `apps/web/src/components/booking/payment-choice.tsx` | Pay online / pay at office radio |
| `apps/web/src/app/(dashboard)/dashboard/waitlist/page.tsx` | Waitlist management page |
| `apps/web/src/components/waitlist/waitlist-content.tsx` | Waitlist table + actions |
| (modify `apps/web/src/app/psy/[slug]/confirmation/page.tsx`) | Extend for paid booking confirmation |
| `apps/web/src/lib/api/consultation-types.ts` | API client |
| `apps/web/src/lib/api/waitlist.ts` | API client |
| `apps/web/src/lib/api/mon-soutien-psy.ts` | API client |

### Modified Files
| File | Changes |
|------|---------|
| `apps/api/prisma/schema.prisma` | New models + enums + columns on Appointment, Psychologist, PsyNetworkProfile |
| `apps/api/src/app.module.ts` | Import 4 new modules |
| `apps/api/src/appointments/appointments.service.ts` | Use consultationType duration for conflict check |
| `apps/api/src/appointments/appointments.controller.ts` | Return consultationType in responses |
| `apps/api/src/public-booking/public-booking.service.ts` | Accept consultationTypeId, payment flow |
| `apps/api/src/public-booking/public-booking.controller.ts` | New checkout endpoint |
| `apps/api/src/billing/stripe.service.ts` | Add createBookingCheckoutSession() |
| `apps/api/src/billing/webhook.controller.ts` | Handle checkout.session.completed for bookings |
| `apps/api/src/billing/billing.controller.ts` | Stripe Connect onboarding endpoints |
| `apps/api/src/billing/billing.module.ts` | Export new services |
| `apps/api/src/sessions/sessions.service.ts` | Trigger MSP counter on create/delete |
| `apps/api/src/notifications/email.service.ts` | Waitlist proposal + booking receipt emails |
| `packages/shared-types/src/index.ts` | New enums + interfaces + constants |
| `apps/web/src/app/psy/[slug]/public-profile-client.tsx` | Booking with motif + payment choice |
| `apps/web/src/app/(dashboard)/dashboard/settings/practice/page.tsx` | Add motifs + reminders + payment sections |
| `apps/web/src/app/(dashboard)/dashboard/patients/[id]/page.tsx` | MSP tracker section |
| `apps/web/src/components/calendar/calendar-content.tsx` | Payment badge on appointments |
| `apps/web/src/components/layouts/sidebar.tsx` | Add "Liste d'attente" nav item |
| `apps/web/src/app/(dashboard)/dashboard/page.tsx` | Add MSP summary widget |

---

## Task 1: Prisma Schema — New Models & Migrations

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `packages/shared-types/src/index.ts`

- [ ] **Step 1: Add new enums to schema.prisma**

Add after line 39 (after existing enums):

```prisma
enum ConsultationCategory {
  standard
  mon_soutien_psy
}

enum BookingPaymentStatus {
  none
  pending_payment
  paid
  payment_failed
}

enum WaitlistUrgency {
  low
  medium
  high
}

enum WaitlistStatus {
  waiting
  contacted
  scheduled
  removed
}
```

- [ ] **Step 2: Add ConsultationType model**

Add after the Psychologist model (after line 187):

```prisma
model ConsultationType {
  id              String               @id @default(uuid())
  psychologistId  String               @map("psychologist_id")
  name            String
  duration        Int
  rate            Decimal              @db.Decimal(10, 2)
  color           String               @default("#3D52A0")
  category        ConsultationCategory @default(standard)
  isPublic        Boolean              @default(true) @map("is_public")
  isActive        Boolean              @default(true) @map("is_active")
  sortOrder       Int                  @default(0) @map("sort_order")
  createdAt       DateTime             @default(now()) @map("created_at")
  updatedAt       DateTime             @updatedAt @map("updated_at")

  psychologist    Psychologist          @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  appointments    Appointment[]
  waitlistEntries WaitlistEntry[]

  @@index([psychologistId], name: "idx_consultation_types_psy")
  @@map("consultation_types")
}
```

- [ ] **Step 3: Add MonSoutienPsyTracking model**

Add after ConsultationType:

```prisma
model MonSoutienPsyTracking {
  id              String       @id @default(uuid())
  psychologistId  String       @map("psychologist_id")
  patientId       String       @map("patient_id")
  year            Int
  sessionsUsed    Int          @default(0) @map("sessions_used")
  maxSessions     Int          @default(12) @map("max_sessions")
  firstSessionAt  DateTime?    @map("first_session_at")
  lastSessionAt   DateTime?    @map("last_session_at")
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")

  psychologist    Psychologist @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  patient         Patient      @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@unique([psychologistId, patientId, year])
  @@index([psychologistId, year], name: "idx_msp_psy_year")
  @@map("mon_soutien_psy_tracking")
}
```

- [ ] **Step 4: Add WaitlistEntry model**

Add after MonSoutienPsyTracking:

```prisma
model WaitlistEntry {
  id                 String            @id @default(uuid())
  psychologistId     String            @map("psychologist_id")
  patientName        String            @map("patient_name")
  patientEmail       String            @map("patient_email")
  patientPhone       String?           @map("patient_phone")
  consultationTypeId String?           @map("consultation_type_id")
  urgency            WaitlistUrgency   @default(low)
  preferredSlots     Json?             @map("preferred_slots")
  note               String?           // ENCRYPTED AES-256-GCM
  status             WaitlistStatus    @default(waiting)
  contactedAt        DateTime?         @map("contacted_at")
  createdAt          DateTime          @default(now()) @map("created_at")

  psychologist       Psychologist      @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  consultationType   ConsultationType? @relation(fields: [consultationTypeId], references: [id])

  @@index([psychologistId, status], name: "idx_waitlist_psy_status")
  @@map("waitlist_entries")
}
```

- [ ] **Step 5: Modify Appointment model (lines 388-409)**

Add these fields to the existing Appointment model:

```prisma
  consultationTypeId   String?              @map("consultation_type_id")
  consultationType     ConsultationType?    @relation(fields: [consultationTypeId], references: [id])
  paymentIntentId      String?              @map("payment_intent_id")
  paidOnline           Boolean              @default(false) @map("paid_online")
  bookingPaymentStatus BookingPaymentStatus @default(none) @map("booking_payment_status")
  createdAt            DateTime             @default(now()) @map("created_at")
```

Add index:
```prisma
  @@index([consultationTypeId], name: "idx_appointments_consultation_type")
```

- [ ] **Step 6: Modify Psychologist model (lines 143-187)**

Add these fields:

```prisma
  allowOnlinePayment       Boolean  @default(false) @map("allow_online_payment")
  stripeAccountId          String?  @unique @map("stripe_account_id")
  stripeOnboardingComplete Boolean  @default(false) @map("stripe_onboarding_complete")
  reminderDelay            Int      @default(24) @map("reminder_delay")
  reminderSmsEnabled       Boolean  @default(false) @map("reminder_sms_enabled")
  reminderEmailEnabled     Boolean  @default(true) @map("reminder_email_enabled")
  reminderTemplate         String?  @map("reminder_template")
```

Add relations:
```prisma
  consultationTypes       ConsultationType[]
  monSoutienPsyTrackings  MonSoutienPsyTracking[]
  waitlistEntries         WaitlistEntry[]
```

- [ ] **Step 7: Rename PsyNetworkProfile.acceptsMonPsy (line 329)**

Change `acceptsMonPsy` to `acceptsMonSoutienPsy`:

```prisma
  acceptsMonSoutienPsy Boolean  @default(false) @map("accepts_mon_soutien_psy")
```

- [ ] **Step 8: Add Patient relations**

Add to Patient model:
```prisma
  monSoutienPsyTrackings MonSoutienPsyTracking[]
```

- [ ] **Step 9: Run migration**

```bash
cd apps/api && npx prisma migrate dev --name lot1_consultation_types_msp_waitlist_payments
```

Expected: Migration created successfully, Prisma client regenerated.

**Note:** The migration adds `createdAt` to existing Appointment rows. Prisma will use `@default(now())` for new rows. For existing rows, manually edit the generated SQL migration file before applying to prod — add: `UPDATE appointments SET created_at = scheduled_at WHERE created_at IS NULL;` to backfill existing data.

**Note:** The rename of `accepts_mon_psy` → `accepts_mon_soutien_psy` on `psy_network_profiles` needs a `ALTER TABLE psy_network_profiles RENAME COLUMN accepts_mon_psy TO accepts_mon_soutien_psy;` in the migration SQL. Grep the codebase for all references to `acceptsMonPsy` and update them (likely in `public-booking.service.ts`, `public-profile-client.tsx`, `network.service.ts`, shared-types).

- [ ] **Step 10: Update shared-types**

Add to `packages/shared-types/src/index.ts`:

```typescript
// === Lot 1: Consultation Types, MSP, Waitlist ===

export enum ConsultationCategory {
  STANDARD = 'standard',
  MON_SOUTIEN_PSY = 'mon_soutien_psy',
}

export enum BookingPaymentStatus {
  NONE = 'none',
  PENDING_PAYMENT = 'pending_payment',
  PAID = 'paid',
  PAYMENT_FAILED = 'payment_failed',
}

export enum WaitlistUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum WaitlistStatus {
  WAITING = 'waiting',
  CONTACTED = 'contacted',
  SCHEDULED = 'scheduled',
  REMOVED = 'removed',
}

export interface ConsultationType {
  id: string;
  psychologistId: string;
  name: string;
  duration: number;
  rate: number;
  color: string;
  category: ConsultationCategory;
  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface MonSoutienPsyTracking {
  id: string;
  patientId: string;
  year: number;
  sessionsUsed: number;
  maxSessions: number;
  firstSessionAt: string | null;
  lastSessionAt: string | null;
}

export interface WaitlistEntry {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  consultationTypeId: string | null;
  consultationType?: ConsultationType;
  urgency: WaitlistUrgency;
  preferredSlots: PreferredSlots | null;
  note: string | null;
  status: WaitlistStatus;
  contactedAt: string | null;
  createdAt: string;
}

export interface PreferredSlots {
  mornings: boolean;
  afternoons: boolean;
  preferredDays: number[];
}

export const MON_SOUTIEN_PSY_RATE = 50.00;
export const MON_SOUTIEN_PSY_MAX_SESSIONS = 12;
```

- [ ] **Step 11: Commit**

```bash
git add apps/api/prisma/ packages/shared-types/
git commit -m "feat(schema): add consultation_types, msp_tracking, waitlist tables + new enums"
```

---

## Task 2: ConsultationTypes Module (Backend)

**Files:**
- Create: `apps/api/src/consultation-types/consultation-types.module.ts`
- Create: `apps/api/src/consultation-types/consultation-types.service.ts`
- Create: `apps/api/src/consultation-types/consultation-types.controller.ts`
- Create: `apps/api/src/consultation-types/dto/create-consultation-type.dto.ts`
- Create: `apps/api/src/consultation-types/dto/update-consultation-type.dto.ts`
- Create: `apps/api/src/consultation-types/__tests__/consultation-types.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/api/src/consultation-types/__tests__/consultation-types.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { ConsultationTypesService } from '../consultation-types.service';
import { PrismaService } from '../../common/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ConsultationTypesService', () => {
  let service: ConsultationTypesService;
  let prisma: any;

  const mockPrisma = {
    consultationType: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    psychologist: {
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ConsultationTypesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(ConsultationTypesService);
    prisma = module.get(PrismaService);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return consultation types for a psychologist', async () => {
      const types = [{ id: '1', name: 'Séance individuelle', duration: 60, rate: 70 }];
      mockPrisma.consultationType.findMany.mockResolvedValue(types);

      const result = await service.findAll('psy-1');
      expect(result).toEqual(types);
      expect(mockPrisma.consultationType.findMany).toHaveBeenCalledWith({
        where: { psychologistId: 'psy-1' },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('create', () => {
    it('should create a standard consultation type', async () => {
      mockPrisma.consultationType.count.mockResolvedValue(2);
      const dto = { name: 'Séance individuelle', duration: 60, rate: 70, color: '#3D52A0' };
      const created = { id: '1', psychologistId: 'psy-1', ...dto, category: 'standard' };
      mockPrisma.consultationType.create.mockResolvedValue(created);

      const result = await service.create('psy-1', dto);
      expect(result.name).toBe('Séance individuelle');
      expect(result.rate).toBe(70);
    });

    it('should force rate to 50 for mon_soutien_psy category', async () => {
      mockPrisma.consultationType.count.mockResolvedValue(2);
      const dto = { name: 'MSP Suivi', duration: 45, rate: 999, color: '#0D9488', category: 'mon_soutien_psy' };
      mockPrisma.consultationType.create.mockResolvedValue({
        id: '2', psychologistId: 'psy-1', ...dto, rate: 50,
      });

      await service.create('psy-1', dto);
      expect(mockPrisma.consultationType.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ rate: 50 }),
      });
    });

    it('should reject if max 20 types reached', async () => {
      mockPrisma.consultationType.count.mockResolvedValue(20);
      const dto = { name: 'Extra', duration: 60, rate: 70 };

      await expect(service.create('psy-1', dto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deactivate', () => {
    it('should set isActive to false', async () => {
      mockPrisma.consultationType.findFirst.mockResolvedValue({ id: '1', psychologistId: 'psy-1' });
      mockPrisma.consultationType.update.mockResolvedValue({ id: '1', isActive: false });

      const result = await service.deactivate('psy-1', '1');
      expect(result.isActive).toBe(false);
    });

    it('should throw if type not found or not owned', async () => {
      mockPrisma.consultationType.findFirst.mockResolvedValue(null);
      await expect(service.deactivate('psy-1', 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/api && npx vitest run src/consultation-types/__tests__/consultation-types.service.spec.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create DTOs**

Create `apps/api/src/consultation-types/dto/create-consultation-type.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsNumber, IsOptional, IsEnum, IsBoolean, Min, Max, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateConsultationTypeDto {
  @ApiProperty({ example: 'Séance individuelle' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 60, description: 'Duration in minutes' })
  @IsInt()
  @Min(5)
  @Max(480)
  duration!: number;

  @ApiProperty({ example: 70, description: 'Rate in EUR' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rate!: number;

  @ApiPropertyOptional({ example: '#3D52A0' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  color?: string;

  @ApiPropertyOptional({ enum: ['standard', 'mon_soutien_psy'], default: 'standard' })
  @IsOptional()
  @IsEnum(['standard', 'mon_soutien_psy'])
  category?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
```

Create `apps/api/src/consultation-types/dto/update-consultation-type.dto.ts`:

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateConsultationTypeDto } from './create-consultation-type.dto';
import { IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class UpdateConsultationTypeDto extends PartialType(CreateConsultationTypeDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
```

- [ ] **Step 4: Create service**

Create `apps/api/src/consultation-types/consultation-types.service.ts`:

```typescript
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateConsultationTypeDto } from './dto/create-consultation-type.dto';
import { UpdateConsultationTypeDto } from './dto/update-consultation-type.dto';

const MSP_RATE = 50;
const MAX_TYPES_PER_PSY = 20;

@Injectable()
export class ConsultationTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(psychologistId: string) {
    return this.prisma.consultationType.findMany({
      where: { psychologistId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findPublic(psychologistId: string) {
    return this.prisma.consultationType.findMany({
      where: { psychologistId, isPublic: true, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(psychologistId: string, dto: CreateConsultationTypeDto) {
    const count = await this.prisma.consultationType.count({ where: { psychologistId } });
    if (count >= MAX_TYPES_PER_PSY) {
      throw new ForbiddenException(`Maximum ${MAX_TYPES_PER_PSY} motifs de consultation atteint`);
    }

    const rate = dto.category === 'mon_soutien_psy' ? MSP_RATE : dto.rate;

    return this.prisma.consultationType.create({
      data: {
        psychologistId,
        name: dto.name,
        duration: dto.duration,
        rate,
        color: dto.color ?? '#3D52A0',
        category: (dto.category as any) ?? 'standard',
        isPublic: dto.isPublic ?? true,
      },
    });
  }

  async update(psychologistId: string, id: string, dto: UpdateConsultationTypeDto) {
    const type = await this.prisma.consultationType.findFirst({
      where: { id, psychologistId },
    });
    if (!type) throw new NotFoundException('Motif de consultation non trouvé');

    const data: any = { ...dto };
    if (type.category === 'mon_soutien_psy' && dto.rate !== undefined) {
      data.rate = MSP_RATE; // Force MSP rate
    }

    return this.prisma.consultationType.update({ where: { id }, data });
  }

  async deactivate(psychologistId: string, id: string) {
    const type = await this.prisma.consultationType.findFirst({
      where: { id, psychologistId },
    });
    if (!type) throw new NotFoundException('Motif de consultation non trouvé');

    return this.prisma.consultationType.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async createDefaultsForPsy(psychologistId: string, defaultRate: number) {
    await this.prisma.consultationType.create({
      data: {
        psychologistId,
        name: 'Séance individuelle',
        duration: 60,
        rate: defaultRate || 70,
        color: '#3D52A0',
        category: 'standard',
        isPublic: true,
        sortOrder: 0,
      },
    });
  }

  async createMspDefaults(psychologistId: string) {
    await this.prisma.consultationType.createMany({
      data: [
        {
          psychologistId,
          name: 'Mon Soutien Psy - Évaluation',
          duration: 45,
          rate: MSP_RATE,
          color: '#0D9488',
          category: 'mon_soutien_psy',
          isPublic: true,
          sortOrder: 10,
        },
        {
          psychologistId,
          name: 'Mon Soutien Psy - Suivi',
          duration: 45,
          rate: MSP_RATE,
          color: '#0D9488',
          category: 'mon_soutien_psy',
          isPublic: true,
          sortOrder: 11,
        },
      ],
    });
  }
}
```

- [ ] **Step 5: Create controller**

Create `apps/api/src/consultation-types/consultation-types.controller.ts`:

```typescript
import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConsultationTypesService } from './consultation-types.service';
import { CreateConsultationTypeDto } from './dto/create-consultation-type.dto';
import { UpdateConsultationTypeDto } from './dto/update-consultation-type.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Consultation Types')
@Controller('consultation-types')
@UseGuards(KeycloakGuard, RolesGuard)
@ApiBearerAuth()
export class ConsultationTypesController {
  constructor(private readonly service: ConsultationTypesService) {}

  @Get()
  @Roles('psychologist')
  async findAll(@Request() req: any) {
    return this.service.findAll(req.user.psychologistId);
  }

  @Post()
  @Roles('psychologist')
  async create(@Request() req: any, @Body() dto: CreateConsultationTypeDto) {
    return this.service.create(req.user.psychologistId, dto);
  }

  @Put(':id')
  @Roles('psychologist')
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateConsultationTypeDto) {
    return this.service.update(req.user.psychologistId, id, dto);
  }

  @Patch(':id/deactivate')
  @Roles('psychologist')
  async deactivate(@Request() req: any, @Param('id') id: string) {
    return this.service.deactivate(req.user.psychologistId, id);
  }
}
```

- [ ] **Step 6: Create module**

Create `apps/api/src/consultation-types/consultation-types.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConsultationTypesService } from './consultation-types.service';
import { ConsultationTypesController } from './consultation-types.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [ConsultationTypesController],
  providers: [ConsultationTypesService],
  exports: [ConsultationTypesService],
})
export class ConsultationTypesModule {}
```

- [ ] **Step 7: Register in app.module.ts**

Add import and include `ConsultationTypesModule` in the imports array of `apps/api/src/app.module.ts`.

- [ ] **Step 8: Run tests — verify they pass**

```bash
cd apps/api && npx vitest run src/consultation-types/__tests__/consultation-types.service.spec.ts
```

Expected: 4 tests PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/consultation-types/ apps/api/src/app.module.ts
git commit -m "feat(api): add ConsultationTypes module — CRUD + MSP rate lock + tests"
```

---

## Task 3: Mon Soutien Psy Module (Backend)

**Files:**
- Create: `apps/api/src/mon-soutien-psy/mon-soutien-psy.module.ts`
- Create: `apps/api/src/mon-soutien-psy/mon-soutien-psy.service.ts`
- Create: `apps/api/src/mon-soutien-psy/mon-soutien-psy.controller.ts`
- Create: `apps/api/src/mon-soutien-psy/__tests__/mon-soutien-psy.service.spec.ts`
- Modify: `apps/api/src/sessions/sessions.service.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/api/src/mon-soutien-psy/__tests__/mon-soutien-psy.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { MonSoutienPsyService } from '../mon-soutien-psy.service';
import { PrismaService } from '../../common/prisma.service';

describe('MonSoutienPsyService', () => {
  let service: MonSoutienPsyService;

  const mockPrisma = {
    monSoutienPsyTracking: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MonSoutienPsyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(MonSoutienPsyService);
    vi.clearAllMocks();
  });

  describe('incrementSessionCount', () => {
    it('should upsert and increment sessionsUsed', async () => {
      mockPrisma.monSoutienPsyTracking.upsert.mockResolvedValue({
        sessionsUsed: 1, maxSessions: 12,
      });

      const result = await service.incrementSessionCount('psy-1', 'pat-1');
      expect(result.sessionsUsed).toBe(1);
      expect(mockPrisma.monSoutienPsyTracking.upsert).toHaveBeenCalled();
    });
  });

  describe('decrementSessionCount', () => {
    it('should decrement sessionsUsed', async () => {
      mockPrisma.monSoutienPsyTracking.findUnique.mockResolvedValue({
        id: 'track-1', sessionsUsed: 5,
      });
      mockPrisma.monSoutienPsyTracking.update.mockResolvedValue({
        sessionsUsed: 4,
      });

      const result = await service.decrementSessionCount('psy-1', 'pat-1');
      expect(result.sessionsUsed).toBe(4);
    });
  });

  describe('getPatientTracking', () => {
    it('should return tracking for current year', async () => {
      const tracking = { sessionsUsed: 7, maxSessions: 12, year: 2026 };
      mockPrisma.monSoutienPsyTracking.findUnique.mockResolvedValue(tracking);

      const result = await service.getPatientTracking('psy-1', 'pat-1');
      expect(result?.sessionsUsed).toBe(7);
    });

    it('should return null if no tracking', async () => {
      mockPrisma.monSoutienPsyTracking.findUnique.mockResolvedValue(null);
      const result = await service.getPatientTracking('psy-1', 'pat-1');
      expect(result).toBeNull();
    });
  });

  describe('getOverview', () => {
    it('should return all MSP patients for current year', async () => {
      const trackings = [
        { patientId: 'p1', sessionsUsed: 7, patient: { name: 'Alice' } },
        { patientId: 'p2', sessionsUsed: 12, patient: { name: 'Bob' } },
      ];
      mockPrisma.monSoutienPsyTracking.findMany.mockResolvedValue(trackings);

      const result = await service.getOverview('psy-1');
      expect(result).toHaveLength(2);
    });
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/api && npx vitest run src/mon-soutien-psy/__tests__/mon-soutien-psy.service.spec.ts
```

- [ ] **Step 3: Create service**

Create `apps/api/src/mon-soutien-psy/mon-soutien-psy.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MonSoutienPsyService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async incrementSessionCount(psychologistId: string, patientId: string) {
    const year = new Date().getFullYear();
    const tracking = await this.prisma.monSoutienPsyTracking.upsert({
      where: {
        psychologistId_patientId_year: { psychologistId, patientId, year },
      },
      create: {
        psychologistId,
        patientId,
        year,
        sessionsUsed: 1,
        firstSessionAt: new Date(),
        lastSessionAt: new Date(),
      },
      update: {
        sessionsUsed: { increment: 1 },
        lastSessionAt: new Date(),
      },
      include: { patient: { select: { name: true } } },
    });

    // MSP alerts
    if (tracking.sessionsUsed >= 12) {
      await this.notifications.create(psychologistId, {
        type: 'msp_quota_reached',
        title: `Quota Mon Soutien Psy atteint`,
        body: `${(tracking as any).patient.name} a utilisé 12/12 séances Mon Soutien Psy pour ${year}.`,
      });
    } else if (tracking.sessionsUsed >= 10) {
      await this.notifications.create(psychologistId, {
        type: 'msp_near_quota',
        title: `Quota Mon Soutien Psy bientôt atteint`,
        body: `${(tracking as any).patient.name} a utilisé ${tracking.sessionsUsed}/12 séances Mon Soutien Psy.`,
      });
    }

    return tracking;
  }

  async decrementSessionCount(psychologistId: string, patientId: string) {
    const year = new Date().getFullYear();
    const tracking = await this.prisma.monSoutienPsyTracking.findUnique({
      where: {
        psychologistId_patientId_year: { psychologistId, patientId, year },
      },
    });
    if (!tracking || tracking.sessionsUsed <= 0) return tracking;

    return this.prisma.monSoutienPsyTracking.update({
      where: { id: tracking.id },
      data: { sessionsUsed: { decrement: 1 } },
    });
  }

  async getPatientTracking(psychologistId: string, patientId: string) {
    const year = new Date().getFullYear();
    return this.prisma.monSoutienPsyTracking.findUnique({
      where: {
        psychologistId_patientId_year: { psychologistId, patientId, year },
      },
    });
  }

  async getOverview(psychologistId: string) {
    const year = new Date().getFullYear();
    return this.prisma.monSoutienPsyTracking.findMany({
      where: { psychologistId, year },
      include: { patient: { select: { name: true, email: true } } },
      orderBy: { sessionsUsed: 'desc' },
    });
  }

  async getPatientHistory(psychologistId: string, patientId: string) {
    return this.prisma.monSoutienPsyTracking.findMany({
      where: { psychologistId, patientId },
      orderBy: { year: 'desc' },
    });
  }

  isQuotaReached(tracking: { sessionsUsed: number; maxSessions: number } | null): boolean {
    if (!tracking) return false;
    return tracking.sessionsUsed >= tracking.maxSessions;
  }

  isNearQuota(tracking: { sessionsUsed: number; maxSessions: number } | null): boolean {
    if (!tracking) return false;
    return tracking.sessionsUsed >= 10;
  }
}
```

- [ ] **Step 4: Create controller**

Create `apps/api/src/mon-soutien-psy/mon-soutien-psy.controller.ts`:

```typescript
import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MonSoutienPsyService } from './mon-soutien-psy.service';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Mon Soutien Psy')
@Controller('mon-soutien-psy')
@UseGuards(KeycloakGuard, RolesGuard)
@ApiBearerAuth()
export class MonSoutienPsyController {
  constructor(private readonly service: MonSoutienPsyService) {}

  @Get('overview')
  @Roles('psychologist')
  async getOverview(@Request() req: any) {
    return this.service.getOverview(req.user.psychologistId);
  }

  @Get('patients/:patientId')
  @Roles('psychologist')
  async getPatientTracking(@Request() req: any, @Param('patientId') patientId: string) {
    return this.service.getPatientTracking(req.user.psychologistId, patientId);
  }

  @Get('patients/:patientId/history')
  @Roles('psychologist')
  async getPatientHistory(@Request() req: any, @Param('patientId') patientId: string) {
    return this.service.getPatientHistory(req.user.psychologistId, patientId);
  }
}
```

- [ ] **Step 5: Create module**

Create `apps/api/src/mon-soutien-psy/mon-soutien-psy.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MonSoutienPsyService } from './mon-soutien-psy.service';
import { MonSoutienPsyController } from './mon-soutien-psy.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule, NotificationsModule],
  controllers: [MonSoutienPsyController],
  providers: [MonSoutienPsyService],
  exports: [MonSoutienPsyService],
})
export class MonSoutienPsyModule {}
```

- [ ] **Step 6: Register in app.module.ts**

Add `MonSoutienPsyModule` to imports in `apps/api/src/app.module.ts`.

- [ ] **Step 7: Wire MSP tracking into SessionsService**

Modify `apps/api/src/sessions/sessions.service.ts` — in the `create()` method, after creating the session, check if the appointment's consultation type is MSP and call `monSoutienPsyService.incrementSessionCount()`. Inject `MonSoutienPsyService` into SessionsService. Also handle decrement on session deletion.

- [ ] **Step 8: Run tests — verify they pass**

```bash
cd apps/api && npx vitest run src/mon-soutien-psy/__tests__/mon-soutien-psy.service.spec.ts
```

Expected: 4 tests PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/mon-soutien-psy/ apps/api/src/sessions/sessions.service.ts apps/api/src/app.module.ts
git commit -m "feat(api): add Mon Soutien Psy module — tracking, counter, alerts, wired to sessions"
```

---

## Task 4: Waitlist Module (Backend)

**Files:**
- Create: `apps/api/src/waitlist/waitlist.module.ts`
- Create: `apps/api/src/waitlist/waitlist.service.ts`
- Create: `apps/api/src/waitlist/waitlist.controller.ts`
- Create: `apps/api/src/waitlist/dto/create-waitlist-entry.dto.ts`
- Create: `apps/api/src/waitlist/__tests__/waitlist.service.spec.ts`
- Modify: `apps/api/src/appointments/appointments.service.ts` (cancellation hook)
- Modify: `apps/api/src/notifications/email.service.ts` (waitlist proposal email)
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Write failing tests for WaitlistService**

Create `apps/api/src/waitlist/__tests__/waitlist.service.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { WaitlistService } from '../waitlist.service';
import { PrismaService } from '../../common/prisma.service';
import { EncryptionService } from '../../common/encryption.service';
import { NotificationsService } from '../../notifications/notifications.service';

describe('WaitlistService', () => {
  let service: WaitlistService;
  const mockPrisma = {
    waitlistEntry: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    psychologist: { findUnique: vi.fn() },
  };
  const mockEncryption = {
    encrypt: vi.fn((text: string) => `encrypted:${text}`),
    decrypt: vi.fn((text: string) => text.replace('encrypted:', '')),
  };
  const mockNotifications = { create: vi.fn() };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WaitlistService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EncryptionService, useValue: mockEncryption },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();
    service = module.get(WaitlistService);
    vi.clearAllMocks();
  });

  it('should encrypt note on create', async () => {
    const dto = { patientName: 'Alice', patientEmail: 'a@b.com', note: 'Anxiété sévère' };
    mockPrisma.waitlistEntry.create.mockResolvedValue({ id: '1', ...dto, note: 'encrypted:Anxiété sévère' });

    await service.create('psy-1', dto as any);
    expect(mockPrisma.waitlistEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ note: 'encrypted:Anxiété sévère' }),
    });
  });

  it('should decrypt notes on findAll', async () => {
    mockPrisma.waitlistEntry.findMany.mockResolvedValue([
      { id: '1', note: 'encrypted:Dépression', patientName: 'Bob' },
    ]);
    const result = await service.findAll('psy-1');
    expect(result[0].note).toBe('Dépression');
  });

  it('should trigger notification on appointment cancelled', async () => {
    mockPrisma.waitlistEntry.findMany.mockResolvedValue([
      { id: '1', patientName: 'Alice', status: 'waiting' },
    ]);
    await service.onAppointmentCancelled('psy-1', new Date('2026-04-10T10:00:00Z'));
    expect(mockNotifications.create).toHaveBeenCalledWith('psy-1', expect.objectContaining({
      type: 'waitlist_slot_available',
    }));
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

- [ ] **Step 3: Create DTO**

`create-waitlist-entry.dto.ts` with: patientName (2-100), patientEmail, patientPhone?, consultationTypeId?, urgency?, preferredSlots? (JSON), note? (max 500).

- [ ] **Step 4: Create WaitlistService**

Inject `PrismaService`, `EncryptionService`, `NotificationsService`.

Key methods: `findAll(psyId)` (decrypt notes), `create(psyId, dto)` (encrypt note), `updateStatus(psyId, id, status)`, `remove(psyId, id)`, `proposeSlot(psyId, id, slotDate)`, `createPublic(slug, dto)`, `onAppointmentCancelled(psychologistId, cancelledDate)`.

The `note` field is encrypted via `this.encryptionService.encrypt(dto.note)` before save and decrypted with `this.encryptionService.decrypt(entry.note)` on read.

- [ ] **Step 5: Create WaitlistController**

Routes: GET `/waitlist`, POST `/waitlist`, PUT `/waitlist/:id`, DELETE `/waitlist/:id`, POST `/waitlist/:id/propose-slot`. Public: POST `/public/psy/:slug/waitlist`.

- [ ] **Step 6: Create module and register**

- [ ] **Step 7: Wire cancellation hook into AppointmentsService**

When an appointment is cancelled, call `waitlistService.onAppointmentCancelled()` which creates a notification for the psy.

- [ ] **Step 8: Add waitlist proposal email to EmailService**

Add `sendWaitlistProposal(to, patientName, psyName, slotDate, bookingUrl)` method.

- [ ] **Step 9: Run tests — verify they pass**

- [ ] **Step 10: Commit**

```bash
git add apps/api/src/waitlist/ apps/api/src/appointments/appointments.service.ts apps/api/src/notifications/email.service.ts apps/api/src/app.module.ts
git commit -m "feat(api): add Waitlist module — CRUD, encrypted notes, cancellation notification"
```

---

## Task 5: Reminder Module (Backend)

**Files:**
- Create: `apps/api/src/reminder/reminder.module.ts`
- Create: `apps/api/src/reminder/reminder.service.ts`
- Create: `apps/api/src/reminder/sms-provider.interface.ts`
- Create: `apps/api/src/reminder/stub-sms.provider.ts`
- Create: `apps/api/src/reminder/__tests__/reminder.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Write failing tests for ReminderService**

Test: cron finds appointments within delay window, sends email reminder, marks reminderSentAt, template variable substitution.

- [ ] **Step 2: Run tests — verify they fail**

- [ ] **Step 3: Create SmsProvider interface and StubSmsProvider**

- [ ] **Step 4: Create ReminderService with cron**

`@Cron('0 */15 * * * *')` — every 15 min. Find appointments where `status IN (scheduled, confirmed)` AND `scheduledAt` is within `reminderDelay` hours. Send email via EmailService. SMS via SmsProvider (stub logs only).

Template variables: `{patient_name}`, `{psy_name}`, `{date}`, `{heure}`, `{duree}`, `{motif}`, `{adresse}`.

- [ ] **Step 5: Create module and register**

- [ ] **Step 6: Run tests — verify they pass**

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/reminder/ apps/api/src/app.module.ts
git commit -m "feat(api): add Reminder module — cron, email reminders, SMS stub provider"
```

---

## Task 6: Stripe Connect + Booking Payment (Backend)

**Files:**
- Modify: `apps/api/src/billing/stripe.service.ts`
- Modify: `apps/api/src/billing/billing.controller.ts`
- Modify: `apps/api/src/billing/webhook.controller.ts`
- Modify: `apps/api/src/billing/billing.module.ts`
- Modify: `apps/api/src/public-booking/public-booking.service.ts`
- Modify: `apps/api/src/public-booking/public-booking.controller.ts`

- [ ] **Step 1: Add Stripe Connect methods to StripeService**

Add `createConnectedAccount(email, psyName)`, `createAccountLink(accountId, returnUrl, refreshUrl)`, `createBookingCheckoutSession(params)` with `mode: 'payment'` and `transfer_data.destination`.

- [ ] **Step 2: Add Connect onboarding endpoints to BillingController**

`POST /billing/connect/onboard` — create Express account + return onboarding URL.
`GET /billing/connect/status` — check `charges_enabled` + `payouts_enabled`.

- [ ] **Step 3: Handle account.updated webhook**

In `webhook.controller.ts`, add handler for `account.updated` event → update `stripeOnboardingComplete` on Psychologist.

- [ ] **Step 4: Modify PublicBookingService for consultationType + payment**

Update `bookAppointment()` to:
- Accept `consultationTypeId` and resolve its duration for conflict check
- Accept `payOnline` flag
- **MSP quota check:** If `consultationType.category === 'mon_soutien_psy'`, inject `MonSoutienPsyService`, look up patient's tracking for current year. If `sessionsUsed >= maxSessions`, throw `BadRequestException('Ce patient a atteint le quota de 12 séances Mon Soutien Psy pour cette année')`.
- If `payOnline` → create appointment with `bookingPaymentStatus: 'pending_payment'` → create Stripe Checkout → return `checkoutUrl`
- If not → create appointment normally with `bookingPaymentStatus: 'none'`

- [ ] **Step 5: Add checkout endpoint to PublicBookingController**

`POST /public/psy/:slug/book` — updated with consultationTypeId + payOnline.

- [ ] **Step 6: Handle checkout.session.completed webhook for bookings**

Extract `appointmentId` from metadata → update `bookingPaymentStatus: 'paid'`, `paidOnline: true`, `paymentIntentId`.

- [ ] **Step 7: Add cron for ghost appointment cleanup**

In AppointmentsService or a dedicated cron: every 5 min, find `bookingPaymentStatus = 'pending_payment'` + `createdAt < now - 35min` → set `payment_failed` + `cancelled`.

- [ ] **Step 8: Add public consultation-types endpoint**

In `PublicBookingController`: `GET /public/psy/:slug/consultation-types` → returns active, public types.

- [ ] **Step 9: Update slot endpoint to accept consultationTypeId**

`GET /public/psy/:slug/slots?from=X&to=Y&consultationTypeId=Z` → in `PublicBookingService.getAvailableSlots()`, resolve the consultationType to get its `duration`, then pass that duration to `this.availabilityService.getAvailableTimeslots(psy.id, from, to, consultationType.duration)` instead of `psy.defaultSessionDuration`. The `AvailabilityService` itself does not need modification — it already accepts `sessionDuration` as parameter.

- [ ] **Step 10: Run existing tests + write new ones**

```bash
cd apps/api && npx vitest run src/billing/ src/public-booking/
```

- [ ] **Step 11: Commit**

```bash
git add apps/api/src/billing/ apps/api/src/public-booking/ apps/api/src/appointments/
git commit -m "feat(api): Stripe Connect Express + booking payment + ghost cleanup cron"
```

---

## Task 7: Frontend — Settings Page (Motifs, Reminders, Payment, MSP)

**Files:**
- Create: `apps/web/src/components/settings/consultation-types-settings.tsx`
- Create: `apps/web/src/components/settings/reminder-settings.tsx`
- Create: `apps/web/src/components/settings/payment-settings.tsx`
- Create: `apps/web/src/components/settings/msp-settings.tsx`
- Create: `apps/web/src/lib/api/consultation-types.ts`
- Modify: `apps/web/src/app/(dashboard)/dashboard/settings/practice/page.tsx`

- [ ] **Step 1: Create API client for consultation-types**

`apps/web/src/lib/api/consultation-types.ts` — fetchConsultationTypes, createConsultationType, updateConsultationType, deactivateConsultationType.

- [ ] **Step 2: Create ConsultationTypesSettings component**

List of motifs with name, duration, rate, color, toggle active/public. "Ajouter un motif" button → modal form. Drag-and-drop reorder (optional — simple ordering with arrows is fine).

- [ ] **Step 3: Create MspSettings component**

Toggle "Accepte Mon Soutien Psy". When toggled ON → call API to create MSP defaults. Badge preview.

- [ ] **Step 4: Create ReminderSettings component**

Toggle email/SMS. SMS toggle grayed out with "Bientôt disponible". Delay select (24h/48h/72h). Template textarea with variable helper chips.

- [ ] **Step 5: Create PaymentSettings component**

Toggle "Autoriser le paiement en ligne". If no Stripe Connect → "Configurer Stripe Connect" button → redirect to onboarding. If connected → green status badge.

- [ ] **Step 6: Integrate all settings into practice page**

Add 4 sections to `apps/web/src/app/(dashboard)/dashboard/settings/practice/page.tsx`.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/settings/ apps/web/src/lib/api/consultation-types.ts apps/web/src/app/\(dashboard\)/dashboard/settings/practice/
git commit -m "feat(web): settings page — consultation types, MSP, reminders, online payment"
```

---

## Task 8: Frontend — Public Booking with Motif + Payment

**Files:**
- Create: `apps/web/src/components/booking/consultation-type-picker.tsx`
- Create: `apps/web/src/components/booking/payment-choice.tsx`
- Create: `apps/web/src/app/psy/[slug]/booking-confirmed/page.tsx`
- Modify: `apps/web/src/app/psy/[slug]/public-profile-client.tsx`

- [ ] **Step 1: Create ConsultationTypePicker component**

Cards grid showing each motif: name, duration badge, rate badge, color accent. Click selects. Highlighted when selected.

- [ ] **Step 2: Create PaymentChoice component**

Radio group: "Payer en ligne maintenant (CB)" / "Payer au cabinet le jour du RDV". Only shown if `psy.allowOnlinePayment && psy.stripeOnboardingComplete`.

- [ ] **Step 3: Extend existing confirmation page for paid bookings**

The existing `/psy/[slug]/confirmation/page.tsx` handles booking confirmations. **Modify it** (don't create a new page) to also handle the `?paid=true` query param. If `paid=true` → show "Paiement confirmé" badge + receipt info. Otherwise → existing behavior. Stripe Checkout success_url should redirect to `/psy/{slug}/confirmation?paid=true`.

- [ ] **Step 4: Modify public-profile-client.tsx**

Refactor booking flow to 3 steps:
1. Choose consultation type (new)
2. Choose time slot (existing, pass duration from step 1)
3. Patient form + payment choice (existing + new)

Update MSP text: "8 séances" → "12 séances".
Add badge "Conventionné Mon Soutien Psy" if applicable.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/booking/ apps/web/src/app/psy/
git commit -m "feat(web): public booking with consultation type picker + payment choice"
```

---

## Task 9: Frontend — Waitlist Page

**Files:**
- Create: `apps/web/src/app/(dashboard)/dashboard/waitlist/page.tsx`
- Create: `apps/web/src/components/waitlist/waitlist-content.tsx`
- Create: `apps/web/src/lib/api/waitlist.ts`
- Modify: `apps/web/src/components/layouts/sidebar.tsx`

- [ ] **Step 1: Create waitlist API client**

`apps/web/src/lib/api/waitlist.ts` — fetchWaitlist, createWaitlistEntry, updateWaitlistEntry, removeWaitlistEntry, proposeSlot.

- [ ] **Step 2: Create WaitlistContent component**

Data table with columns: Nom, Email, Motif, Urgence (badge), Préférences, Inscrit le, Statut, Actions. Filters: urgency, status. Actions: "Proposer un créneau", "Marquer contacté", "Retirer".

- [ ] **Step 3: Create waitlist page**

`apps/web/src/app/(dashboard)/dashboard/waitlist/page.tsx` — header + WaitlistContent.

- [ ] **Step 4: Add sidebar nav item**

Add "Liste d'attente" with ClipboardList icon in `sidebar.tsx`, after "Calendrier". Show badge with waitlist count.

- [ ] **Step 5: Add waitlist form to public booking page**

When no slots available in 30 days, show waitlist registration form in `public-profile-client.tsx`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/dashboard/waitlist/ apps/web/src/components/waitlist/ apps/web/src/lib/api/waitlist.ts apps/web/src/components/layouts/sidebar.tsx
git commit -m "feat(web): waitlist page + sidebar nav + public waitlist form"
```

---

## Task 10: Frontend — MSP Tracker on Patient Page + Calendar Badges

**Files:**
- Create: `apps/web/src/components/patients/msp-tracker.tsx`
- Create: `apps/web/src/lib/api/mon-soutien-psy.ts`
- Modify: `apps/web/src/app/(dashboard)/dashboard/patients/[id]/page.tsx`
- Modify: `apps/web/src/components/calendar/calendar-content.tsx`

- [ ] **Step 1: Create MSP API client**

`apps/web/src/lib/api/mon-soutien-psy.ts` — fetchPatientMsp, fetchMspOverview.

- [ ] **Step 2: Create MspTracker component**

Progress bar: 7/12 sessions. Badge: green (<8), orange (10-11), red (12). List of MSP sessions this year.

- [ ] **Step 3: Add MspTracker to patient detail page**

Conditionally show if patient has MSP tracking data.

- [ ] **Step 4: Add MSP widget to main dashboard**

Modify `apps/web/src/app/(dashboard)/dashboard/page.tsx` — add a "Mon Soutien Psy" card showing: total MSP patients active this year, patients near quota (>= 10 sessions). Use the `fetchMspOverview()` API. Only show if psy has `acceptsMonSoutienPsy`.

- [ ] **Step 5: Add payment badges to calendar**

In `calendar-content.tsx`, show small badge on appointments: green "Payé" if `paidOnline`, gray "Cabinet" otherwise. Show consultation type name.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/patients/msp-tracker.tsx apps/web/src/lib/api/mon-soutien-psy.ts apps/web/src/app/\(dashboard\)/dashboard/patients/ apps/web/src/components/calendar/
git commit -m "feat(web): MSP tracker on patient page + payment badges on calendar"
```

---

## Task 11: Integration Testing + Cleanup

**Files:**
- All modified files
- New Playwright tests

- [ ] **Step 1: Run full backend test suite**

```bash
cd apps/api && npx vitest run
```

Fix any failures.

- [ ] **Step 2: Run TypeScript check**

```bash
cd apps/web && npx tsc --noEmit
cd apps/api && npx tsc --noEmit
```

Fix any type errors.

- [ ] **Step 3: Run lint**

```bash
cd apps/web && npx next lint
cd apps/api && npx eslint src/
```

- [ ] **Step 4: Manual smoke test checklist**

- [ ] Settings: create/edit/deactivate consultation types
- [ ] Settings: toggle MSP → creates MSP motifs
- [ ] Settings: toggle online payment → Stripe Connect onboarding
- [ ] Settings: configure reminder delay
- [ ] Public booking: choose motif → slots adapt to duration
- [ ] Public booking: pay online → Stripe Checkout → confirmation
- [ ] Public booking: no slots → waitlist form
- [ ] Calendar: payment badges visible
- [ ] Patient page: MSP counter visible
- [ ] Waitlist: propose slot → email sent
- [ ] Session create with MSP motif → counter increments

- [ ] **Step 5: Final commit**

```bash
git add apps/ packages/
git commit -m "feat: Lot 1 complete — consultation types, Mon Soutien Psy, online payment, waitlist, SMS reminders"
```
