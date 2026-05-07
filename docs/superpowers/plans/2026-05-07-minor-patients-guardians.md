# Minor Patients & Legal Guardians — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete support for minor patients with legal guardians — including guardian CRUD, portal access, parental consent workflows, plan gating, and email notifications.

**Architecture:** Extend the existing patient portal auth system (custom JWT, NOT Keycloak) with a new `guardian` role. Two new NestJS modules (`GuardiansModule` for psy-facing CRUD, `GuardianPortalModule` for guardian-facing portal). Frontend extends the patient portal layout to accept guardians.

**Tech Stack:** NestJS + Prisma + PostgreSQL (backend), Next.js + shadcn/ui (frontend), Resend (emails), custom JWT auth (HS256 with `PATIENT_JWT_SECRET`)

**Spec:** `docs/superpowers/specs/2026-05-07-minor-patients-guardians-design.md`

---

## File Structure

### New Files (Backend)

| File | Responsibility |
|------|---------------|
| `apps/api/src/guardians/guardians.module.ts` | NestJS module — imports PrismaService, NotificationsModule, BillingModule |
| `apps/api/src/guardians/guardians.controller.ts` | CRUD endpoints for guardians (psy-facing, Keycloak-guarded) |
| `apps/api/src/guardians/guardians.service.ts` | Business logic: create/update/delete guardians, enforce limits |
| `apps/api/src/guardians/dto/create-guardian.dto.ts` | Validation DTO: name, email, phone, relationship, isPrimary, permissions |
| `apps/api/src/guardians/dto/update-guardian.dto.ts` | Partial update DTO |
| `apps/api/src/guardians/guardian-invitations.controller.ts` | Send invite, validate token, accept invitation (public) |
| `apps/api/src/guardians/guardian-invitations.service.ts` | Invitation logic: token generation, email sending, account creation |
| `apps/api/src/guardians/guardian-consents.controller.ts` | Request/approve/refuse consent (public token endpoints) |
| `apps/api/src/guardians/guardian-consents.service.ts` | Consent logic: HMAC token generation, state machine, GDPR record creation |
| `apps/api/src/guardian-portal/guardian-portal.module.ts` | NestJS module for guardian-facing portal |
| `apps/api/src/guardian-portal/guardian-portal.controller.ts` | Read-only portal endpoints: minors list, mood, exercises, journal, documents, invoices |
| `apps/api/src/guardian-portal/guardian-portal.service.ts` | Data fetching with permission checks and audit logging |
| `apps/api/src/guardian-portal/guardian-auth.controller.ts` | Login/refresh endpoints |
| `apps/api/src/guardian-portal/guardian-auth.service.ts` | JWT generation (same pattern as PatientAuthService) |
| `apps/api/src/guardian-portal/strategies/guardian-jwt.strategy.ts` | Passport strategy: `guardian-jwt`, validates `role === 'guardian'` |
| `apps/api/src/guardian-portal/guards/guardian-jwt.guard.ts` | `AuthGuard('guardian-jwt')` |
| `apps/api/src/guardian-portal/guards/guardian-access.guard.ts` | Permission + plan check per endpoint |
| `apps/api/src/guardian-portal/decorators/current-guardian.decorator.ts` | `@CurrentGuardian()` param decorator |

### New Files (Frontend)

| File | Responsibility |
|------|---------------|
| `apps/web/src/components/patients/guardian-section.tsx` | Guardian cards in patient create/edit form |
| `apps/web/src/components/patients/add-guardian-dialog.tsx` | Dialog to add/edit a guardian |
| `apps/web/src/components/patients/guardian-tab.tsx` | "Responsables legaux" tab in patient detail |
| `apps/web/src/app/(auth)/guardian-invite/[token]/page.tsx` | Public invitation acceptance page |
| `apps/web/src/app/(auth)/guardian-consent/[token]/page.tsx` | Public consent approval page |
| `apps/web/src/app/(patient-portal)/patient-portal/minor-selector/page.tsx` | Minor selection page for guardians with 2+ minors |
| `apps/web/src/lib/api/guardian-portal.ts` | API client for guardian portal endpoints |

### New Files (Emails)

| File | Responsibility |
|------|---------------|
| `apps/api/src/notifications/emails/guardian-invitation.ts` | Email template: portal invitation |
| `apps/api/src/notifications/emails/guardian-consent-request.ts` | Email template: consent request |
| `apps/api/src/notifications/emails/guardian-consent-confirmed.ts` | Email template: consent confirmed (copy to psy) |

### Modified Files

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `guardian` to UserRole, new enums, 3 new models, Patient.isMinor, GdprConsent fields |
| `packages/shared-types/src/index.ts` | Add `GUARDIAN` to UserRole, add LegalGuardian/GuardianPermissions interfaces |
| `apps/api/src/patients/dto/create-patient.dto.ts` | Add `isMinor` boolean field |
| `apps/api/src/patients/patients.service.ts` | Include guardians in `findOne()`, handle `isMinor` in create/update |
| `apps/api/src/patients/patients.controller.ts` | Return guardians with patient detail |
| `apps/api/src/app.module.ts` | Import GuardiansModule + GuardianPortalModule |
| `apps/web/src/middleware.ts` | Accept `GUARDIAN` role for `/patient-portal` routes |
| `apps/web/src/lib/auth/auth.config.ts` | Add `guardian-credentials` provider |
| `apps/web/src/app/(patient-portal)/layout.tsx` | Accept GUARDIAN role, show guardian badge |
| `apps/api/src/notifications/email.service.ts` | Add guardian email methods |
| `apps/api/src/common/audit.service.ts` | Add `guardian` actor type |

---

## Task 1: Prisma Schema — New Enums, Models, and Fields

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260507_add_minor_patients_guardians/migration.sql`

- [ ] **Step 1: Add new enums and modify UserRole**

In `apps/api/prisma/schema.prisma`, after the existing `UserRole` enum (line 21-25):

```prisma
enum UserRole {
  psychologist
  patient
  admin
  guardian
}
```

Add new enums after the existing `AccountingEntryType` enum (around line 215):

```prisma
enum GuardianRelationship {
  mother
  father
  legal_guardian
  other

  @@map("guardian_relationship")
}

enum GuardianInvitationStatus {
  pending
  accepted
  expired

  @@map("guardian_invitation_status")
}

enum GuardianConsentRequestStatus {
  pending
  approved
  refused

  @@map("guardian_consent_request_status")
}

enum ConsentGivenBy {
  patient
  guardian

  @@map("consent_given_by")
}
```

- [ ] **Step 2: Add `isMinor` to Patient model**

In the `Patient` model (line 411-444), add after `source`:

```prisma
  isMinor        Boolean       @default(false) @map("is_minor")
```

Add relation at the end of the relations block:

```prisma
  guardians              LegalGuardian[]
```

- [ ] **Step 3: Add `LegalGuardian` model**

Add after the Patient model:

```prisma
model LegalGuardian {
  id             String                @id @default(uuid())
  patientId      String                @map("patient_id")
  userId         String?               @map("user_id")
  psychologistId String                @map("psychologist_id")
  name           String
  email          String
  phone          String?
  relationship   GuardianRelationship
  isPrimary      Boolean               @default(false) @map("is_primary")
  permissions    Json                  @default("{\"portal\":true,\"invoices\":true,\"video\":false,\"documents\":true,\"messaging\":false}")
  createdAt      DateTime              @default(now()) @map("created_at")
  updatedAt      DateTime              @updatedAt @map("updated_at")

  patient        Patient               @relation(fields: [patientId], references: [id], onDelete: Cascade)
  user           User?                 @relation(fields: [userId], references: [id], onDelete: SetNull)
  psychologist   Psychologist          @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  invitations    GuardianInvitation[]
  consentRequests GuardianConsentRequest[]
  gdprConsents   GdprConsent[]

  @@unique([patientId, email])
  @@index([patientId], name: "idx_legal_guardians_patient")
  @@index([userId], name: "idx_legal_guardians_user")
  @@index([psychologistId], name: "idx_legal_guardians_psy")
  @@map("legal_guardians")
}
```

- [ ] **Step 4: Add `GuardianInvitation` model**

```prisma
model GuardianInvitation {
  id             String                    @id @default(uuid())
  psychologistId String                    @map("psychologist_id")
  guardianId     String                    @map("guardian_id")
  email          String
  token          String                    @unique
  status         GuardianInvitationStatus  @default(pending)
  expiresAt      DateTime                  @map("expires_at")
  createdAt      DateTime                  @default(now()) @map("created_at")

  psychologist   Psychologist              @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  guardian       LegalGuardian             @relation(fields: [guardianId], references: [id], onDelete: Cascade)

  @@index([token], name: "idx_guardian_invitations_token")
  @@index([guardianId], name: "idx_guardian_invitations_guardian")
  @@map("guardian_invitations")
}
```

- [ ] **Step 5: Add `GuardianConsentRequest` model**

```prisma
model GuardianConsentRequest {
  id             String                         @id @default(uuid())
  psychologistId String                         @map("psychologist_id")
  guardianId     String                         @map("guardian_id")
  patientId      String                         @map("patient_id")
  consentType    String                         @map("consent_type")
  token          String                         @unique
  status         GuardianConsentRequestStatus   @default(pending)
  expiresAt      DateTime                       @map("expires_at")
  respondedAt    DateTime?                      @map("responded_at")
  ipAddress      String?                        @map("ip_address")
  createdAt      DateTime                       @default(now()) @map("created_at")

  psychologist   Psychologist                   @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  guardian       LegalGuardian                  @relation(fields: [guardianId], references: [id], onDelete: Cascade)
  patient        Patient                        @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([token], name: "idx_guardian_consent_requests_token")
  @@index([guardianId, patientId], name: "idx_guardian_consent_req_guardian_patient")
  @@map("guardian_consent_requests")
}
```

- [ ] **Step 6: Modify `GdprConsent` model**

Add 3 fields to `GdprConsent` model (line 877-890):

```prisma
model GdprConsent {
  id             String         @id @default(uuid())
  patientId      String         @map("patient_id")
  type           String
  version        String
  consentedAt    DateTime       @default(now()) @map("consented_at")
  withdrawnAt    DateTime?      @map("withdrawn_at")
  ipAddress      String?        @map("ip_address")
  consentGivenBy ConsentGivenBy @default(patient) @map("consent_given_by")
  guardianId     String?        @map("guardian_id")
  refusedAt      DateTime?      @map("refused_at")

  patient        Patient        @relation(fields: [patientId], references: [id], onDelete: Cascade)
  guardian       LegalGuardian? @relation(fields: [guardianId], references: [id], onDelete: SetNull)

  @@index([patientId], name: "idx_gdpr_consents_patient")
  @@map("gdpr_consents")
}
```

- [ ] **Step 7: Add relations to `User` and `Psychologist` models**

In `User` model, add relation:
```prisma
  guardianRecords   LegalGuardian[]
```

In `Psychologist` model, add relations:
```prisma
  guardians                LegalGuardian[]
  guardianInvitations      GuardianInvitation[]
  guardianConsentRequests  GuardianConsentRequest[]
```

In `Patient` model, add relation:
```prisma
  guardianConsentRequests  GuardianConsentRequest[]
```

- [ ] **Step 8: Run migration**

Run: `npx prisma migrate dev --name add_minor_patients_guardians`
Expected: Migration generated and applied, Prisma Client regenerated.

- [ ] **Step 9: Commit**

```bash
git add apps/api/prisma/
git commit -m "feat(db): add minor patients & legal guardians schema"
```

---

## Task 2: Shared Types — UserRole.GUARDIAN + Guardian Interfaces

**Files:**
- Modify: `packages/shared-types/src/index.ts`

- [ ] **Step 1: Add GUARDIAN to UserRole enum**

In `packages/shared-types/src/index.ts` (line 10-14), add `GUARDIAN`:

```typescript
export enum UserRole {
  PSYCHOLOGIST = 'psychologist',
  PATIENT = 'patient',
  ADMIN = 'admin',
  GUARDIAN = 'guardian',
}
```

- [ ] **Step 2: Add guardian-related types**

Add at the end of the file:

```typescript
// -----------------------------------------------------------------------------
// Guardian Types
// -----------------------------------------------------------------------------

export enum GuardianRelationship {
  MOTHER = 'mother',
  FATHER = 'father',
  LEGAL_GUARDIAN = 'legal_guardian',
  OTHER = 'other',
}

export interface GuardianPermissions {
  portal: boolean;
  invoices: boolean;
  video: boolean;
  documents: boolean;
  messaging: boolean;
}

export const DEFAULT_GUARDIAN_PERMISSIONS: GuardianPermissions = {
  portal: true,
  invoices: true,
  video: false,
  documents: true,
  messaging: false,
};

export interface LegalGuardian {
  id: string;
  patientId: string;
  userId: string | null;
  psychologistId: string;
  name: string;
  email: string;
  phone: string | null;
  relationship: GuardianRelationship;
  isPrimary: boolean;
  permissions: GuardianPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface GuardianInvitation {
  id: string;
  guardianId: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface GuardianConsentRequest {
  id: string;
  guardianId: string;
  patientId: string;
  consentType: string;
  status: 'pending' | 'approved' | 'refused';
  expiresAt: string;
  respondedAt: string | null;
  createdAt: string;
}
```

- [ ] **Step 3: Build shared-types**

Run: `cd packages/shared-types && npm run build`
Expected: Build succeeds, `dist/index.js` updated.

- [ ] **Step 4: Commit**

```bash
git add packages/shared-types/
git commit -m "feat(types): add GUARDIAN role and guardian interfaces"
```

---

## Task 3: Guardians Module — CRUD (Psy-Facing Backend)

**Files:**
- Create: `apps/api/src/guardians/guardians.module.ts`
- Create: `apps/api/src/guardians/dto/create-guardian.dto.ts`
- Create: `apps/api/src/guardians/dto/update-guardian.dto.ts`
- Create: `apps/api/src/guardians/guardians.service.ts`
- Create: `apps/api/src/guardians/guardians.controller.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/patients/dto/create-patient.dto.ts`
- Modify: `apps/api/src/patients/patients.service.ts`

- [ ] **Step 1: Create DTOs**

Create `apps/api/src/guardians/dto/create-guardian.dto.ts`:

```typescript
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GuardianRelationship } from '@psyscale/shared-types';

export class GuardianPermissionsDto {
  @IsBoolean()
  portal!: boolean;

  @IsBoolean()
  invoices!: boolean;

  @IsBoolean()
  video!: boolean;

  @IsBoolean()
  documents!: boolean;

  @IsBoolean()
  messaging!: boolean;
}

export class CreateGuardianDto {
  @ApiProperty({ example: 'Marie Dupont' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'marie.dupont@email.fr' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '+33612345678' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ enum: GuardianRelationship })
  @IsEnum(GuardianRelationship)
  relationship!: GuardianRelationship;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  permissions?: GuardianPermissionsDto;
}
```

Create `apps/api/src/guardians/dto/update-guardian.dto.ts`:

```typescript
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GuardianRelationship } from '@psyscale/shared-types';
import { GuardianPermissionsDto } from './create-guardian.dto';

export class UpdateGuardianDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ enum: GuardianRelationship })
  @IsEnum(GuardianRelationship)
  @IsOptional()
  relationship?: GuardianRelationship;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  permissions?: GuardianPermissionsDto;
}
```

- [ ] **Step 2: Create GuardiansService**

Create `apps/api/src/guardians/guardians.service.ts`:

```typescript
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { DEFAULT_GUARDIAN_PERMISSIONS, SubscriptionPlan } from '@psyscale/shared-types';

@Injectable()
export class GuardiansService {
  private readonly logger = new Logger(GuardiansService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(psychologistId: string, patientId: string, dto: CreateGuardianDto, actorUserId: string) {
    // 1. Verify patient belongs to psy and isMinor
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');
    if (!patient.isMinor) throw new BadRequestException('Ce patient n\'est pas mineur');

    // 2. Check guardian count < 2
    const count = await this.prisma.legalGuardian.count({ where: { patientId } });
    if (count >= 2) throw new BadRequestException('Maximum 2 tuteurs par patient');

    // 3. Email must not match patient email
    if (patient.email && dto.email.toLowerCase() === patient.email.toLowerCase()) {
      throw new BadRequestException('L\'email du tuteur ne peut pas etre identique a celui du patient');
    }

    // 4. Check plan for permissions configuration
    const psy = await this.prisma.psychologist.findUnique({
      where: { id: psychologistId },
      include: { subscription: true },
    });
    const plan = psy?.subscription?.plan ?? 'free';

    // Free plan: store info only (no portal)
    // Solo plan: max 1 guardian, default permissions (not configurable)
    // Pro/Clinic: 2 guardians, configurable permissions
    if (plan === 'free' || plan === 'starter') {
      // Solo = starter in DB (legacy naming)
    }

    let permissions = dto.permissions ?? DEFAULT_GUARDIAN_PERMISSIONS;
    if (plan !== 'pro' && plan !== 'clinic') {
      // Solo: use defaults, ignore custom permissions
      permissions = DEFAULT_GUARDIAN_PERMISSIONS;
    }

    // 5. Handle isPrimary constraint
    if (dto.isPrimary) {
      await this.prisma.legalGuardian.updateMany({
        where: { patientId, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    // If first guardian, make primary automatically
    const isPrimary = dto.isPrimary ?? (count === 0);

    const guardian = await this.prisma.legalGuardian.create({
      data: {
        patientId,
        psychologistId,
        name: dto.name,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        relationship: dto.relationship,
        isPrimary,
        permissions,
      },
    });

    await this.audit.log({
      actorId: actorUserId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'legal_guardian',
      entityId: guardian.id,
      metadata: { patientId, guardianName: dto.name },
    });

    return guardian;
  }

  async findAll(psychologistId: string, patientId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');

    return this.prisma.legalGuardian.findMany({
      where: { patientId, psychologistId },
      include: {
        invitations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(
    psychologistId: string,
    patientId: string,
    guardianId: string,
    dto: UpdateGuardianDto,
    actorUserId: string,
  ) {
    const guardian = await this.prisma.legalGuardian.findFirst({
      where: { id: guardianId, patientId, psychologistId },
    });
    if (!guardian) throw new NotFoundException('Tuteur introuvable');

    // Email uniqueness check
    if (dto.email) {
      const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
      if (patient?.email && dto.email.toLowerCase() === patient.email.toLowerCase()) {
        throw new BadRequestException('L\'email du tuteur ne peut pas etre identique a celui du patient');
      }
    }

    // Handle isPrimary swap
    if (dto.isPrimary === true && !guardian.isPrimary) {
      await this.prisma.legalGuardian.updateMany({
        where: { patientId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    // Plan check for permissions
    if (dto.permissions) {
      const psy = await this.prisma.psychologist.findUnique({
        where: { id: psychologistId },
        include: { subscription: true },
      });
      const plan = psy?.subscription?.plan ?? 'free';
      if (plan !== 'pro' && plan !== 'clinic') {
        delete dto.permissions; // Solo: ignore custom permissions
      }
    }

    const updated = await this.prisma.legalGuardian.update({
      where: { id: guardianId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.email && { email: dto.email.toLowerCase() }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.relationship && { relationship: dto.relationship }),
        ...(dto.isPrimary !== undefined && { isPrimary: dto.isPrimary }),
        ...(dto.permissions && { permissions: dto.permissions }),
      },
    });

    await this.audit.log({
      actorId: actorUserId,
      actorType: 'psychologist',
      action: 'UPDATE',
      entityType: 'legal_guardian',
      entityId: guardianId,
      metadata: { patientId, changes: Object.keys(dto) },
    });

    return updated;
  }

  async remove(psychologistId: string, patientId: string, guardianId: string, actorUserId: string) {
    const guardian = await this.prisma.legalGuardian.findFirst({
      where: { id: guardianId, patientId, psychologistId },
    });
    if (!guardian) throw new NotFoundException('Tuteur introuvable');

    // If guardian had a user account, deactivate it (don't delete — may be linked elsewhere)
    if (guardian.userId) {
      const otherLinks = await this.prisma.legalGuardian.count({
        where: { userId: guardian.userId, id: { not: guardianId } },
      });
      if (otherLinks === 0) {
        // No other minor linked — deactivate guardian user
        await this.prisma.user.update({
          where: { id: guardian.userId },
          data: { role: 'patient' }, // Downgrade role, effectively disabling guardian access
        });
      }
    }

    await this.prisma.legalGuardian.delete({ where: { id: guardianId } });

    await this.audit.log({
      actorId: actorUserId,
      actorType: 'psychologist',
      action: 'DELETE',
      entityType: 'legal_guardian',
      entityId: guardianId,
      metadata: { patientId, guardianName: guardian.name },
    });

    return { deleted: true };
  }
}
```

- [ ] **Step 3: Create GuardiansController**

Create `apps/api/src/guardians/guardians.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KeycloakGuard } from '../auth/keycloak-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import { GuardiansService } from './guardians.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { PrismaService } from '../common/prisma.service';

@ApiTags('Guardians')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('patients/:patientId/guardians')
export class GuardiansController {
  constructor(
    private readonly service: GuardiansService,
    private readonly prisma: PrismaService,
  ) {}

  private async getPsyId(userId: string): Promise<string> {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new Error('Psychologue introuvable');
    return psy.id;
  }

  @Post()
  @ApiOperation({ summary: 'Ajouter un tuteur au patient mineur (max 2)' })
  async create(
    @CurrentUser() user: KeycloakUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateGuardianDto,
  ) {
    const psyId = await this.getPsyId(user.sub);
    return this.service.create(psyId, patientId, dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les tuteurs du patient' })
  async findAll(
    @CurrentUser() user: KeycloakUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    const psyId = await this.getPsyId(user.sub);
    return this.service.findAll(psyId, patientId);
  }

  @Put(':guardianId')
  @ApiOperation({ summary: 'Modifier un tuteur' })
  async update(
    @CurrentUser() user: KeycloakUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('guardianId', ParseUUIDPipe) guardianId: string,
    @Body() dto: UpdateGuardianDto,
  ) {
    const psyId = await this.getPsyId(user.sub);
    return this.service.update(psyId, patientId, guardianId, dto, user.sub);
  }

  @Delete(':guardianId')
  @ApiOperation({ summary: 'Supprimer un tuteur' })
  async remove(
    @CurrentUser() user: KeycloakUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('guardianId', ParseUUIDPipe) guardianId: string,
  ) {
    const psyId = await this.getPsyId(user.sub);
    return this.service.remove(psyId, patientId, guardianId, user.sub);
  }
}
```

- [ ] **Step 4: Create GuardiansModule**

Create `apps/api/src/guardians/guardians.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GuardiansController } from './guardians.controller';
import { GuardiansService } from './guardians.service';
import { GuardianInvitationsController } from './guardian-invitations.controller';
import { GuardianInvitationsService } from './guardian-invitations.service';
import { GuardianConsentsController } from './guardian-consents.controller';
import { GuardianConsentsService } from './guardian-consents.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [JwtModule.register({}), NotificationsModule],
  controllers: [
    GuardiansController,
    GuardianInvitationsController,
    GuardianConsentsController,
  ],
  providers: [GuardiansService, GuardianInvitationsService, GuardianConsentsService],
  exports: [GuardiansService],
})
export class GuardiansModule {}
```

- [ ] **Step 5: Add `isMinor` to patient DTOs**

In `apps/api/src/patients/dto/create-patient.dto.ts`, add to `CreatePatientDto`:

```typescript
  @ApiPropertyOptional({ description: 'Patient mineur', default: false })
  @IsBoolean()
  @IsOptional()
  isMinor?: boolean;
```

Add to `UpdatePatientDto`:

```typescript
  @ApiPropertyOptional({ description: 'Patient mineur' })
  @IsBoolean()
  @IsOptional()
  isMinor?: boolean;
```

- [ ] **Step 6: Modify patients.service.ts to include guardians**

In `apps/api/src/patients/patients.service.ts`:

- In `create()`: add `isMinor: dto.isMinor ?? false` to the data object
- In `findOne()`: add `guardians: true` to the include object
- In `update()`: add `...(dto.isMinor !== undefined && { isMinor: dto.isMinor })` to the data object

- [ ] **Step 7: Register GuardiansModule in app.module.ts**

In `apps/api/src/app.module.ts`, add import:
```typescript
import { GuardiansModule } from './guardians/guardians.module';
```
Add `GuardiansModule` to the `imports` array.

- [ ] **Step 8: Verify compilation**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/guardians/ apps/api/src/patients/dto/create-patient.dto.ts apps/api/src/patients/patients.service.ts apps/api/src/app.module.ts
git commit -m "feat(guardians): add guardian CRUD module with DTOs and service"
```

---

## Task 4: Guardian Invitations — Send, Validate, Accept

**Files:**
- Create: `apps/api/src/guardians/guardian-invitations.service.ts`
- Create: `apps/api/src/guardians/guardian-invitations.controller.ts`
- Create: `apps/api/src/notifications/emails/guardian-invitation.ts`
- Modify: `apps/api/src/notifications/email.service.ts`

- [ ] **Step 1: Create guardian-invitation email template**

Create `apps/api/src/notifications/emails/guardian-invitation.ts`:

```typescript
export function guardianInvitationEmail(params: {
  guardianName: string;
  patientFirstName: string;
  psychologistName: string;
  activationUrl: string;
}): { subject: string; html: string } {
  const subject = `[PsyLib] ${params.psychologistName} vous invite a suivre le dossier de ${params.patientFirstName}`;

  const html = `
    <h1>Bonjour ${params.guardianName},</h1>
    <p>${params.psychologistName} vous invite a acceder au portail de suivi de <strong>${params.patientFirstName}</strong> sur PsyLib.</p>
    <p>En tant que responsable legal, vous pourrez :</p>
    <ul>
      <li>Suivre le bien-etre de votre enfant</li>
      <li>Consulter les exercices therapeutiques</li>
      <li>Acceder aux documents partages</li>
      <li>Recevoir les factures</li>
    </ul>
    <p style="text-align: center;">
      <a href="${params.activationUrl}" class="btn">Activer mon acces</a>
    </p>
    <p style="color: #9CA3AF; font-size: 14px;">Ce lien est valable 7 jours. Si vous n'etes pas concerne par cette invitation, vous pouvez l'ignorer.</p>
  `;

  return { subject, html };
}
```

- [ ] **Step 2: Add guardian email methods to EmailService**

In `apps/api/src/notifications/email.service.ts`, add methods:

```typescript
  async sendGuardianInvitation(to: string, params: {
    guardianName: string;
    patientFirstName: string;
    psychologistName: string;
    activationUrl: string;
  }) {
    const { subject, html } = guardianInvitationEmail(params);
    return this.send(to, subject, emailLayout(subject, html), 'sendGuardianInvitation');
  }

  async sendGuardianConsentRequest(to: string, params: {
    guardianName: string;
    patientFirstName: string;
    psychologistName: string;
    consentType: string;
    consentUrl: string;
  }) {
    const { subject, html } = guardianConsentRequestEmail(params);
    return this.send(to, subject, emailLayout(subject, html), 'sendGuardianConsentRequest');
  }

  async sendGuardianConsentConfirmed(guardianEmail: string, psyEmail: string, params: {
    guardianName: string;
    patientFirstName: string;
    consentType: string;
  }) {
    const subject = `[PsyLib] Consentement enregistre pour ${params.patientFirstName}`;
    const html = `
      <h1>Consentement enregistre</h1>
      <p>Le consentement <strong>${params.consentType}</strong> pour ${params.patientFirstName} a ete approuve par ${params.guardianName}.</p>
    `;
    await this.send(guardianEmail, subject, emailLayout(subject, html), 'sendGuardianConsentConfirmed');
    await this.send(psyEmail, subject, emailLayout(subject, html), 'sendGuardianConsentConfirmed-psy');
  }
```

- [ ] **Step 3: Create GuardianInvitationsService**

Create `apps/api/src/guardians/guardian-invitations.service.ts`:

```typescript
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class GuardianInvitationsService {
  private readonly logger = new Logger(GuardianInvitationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async sendInvitation(psychologistId: string, patientId: string, guardianId: string, actorUserId: string) {
    const guardian = await this.prisma.legalGuardian.findFirst({
      where: { id: guardianId, patientId, psychologistId },
      include: {
        patient: { select: { name: true } },
      },
    });
    if (!guardian) throw new NotFoundException('Tuteur introuvable');

    // Rate limit: max 3 invitations per guardian per 24h
    const recentCount = await this.prisma.guardianInvitation.count({
      where: {
        guardianId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (recentCount >= 3) throw new BadRequestException('Maximum 3 invitations par 24h');

    // Expire any existing pending invitations
    await this.prisma.guardianInvitation.updateMany({
      where: { guardianId, status: 'pending' },
      data: { status: 'expired' },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.prisma.guardianInvitation.create({
      data: {
        psychologistId,
        guardianId,
        email: guardian.email,
        token,
        expiresAt,
      },
    });

    const psy = await this.prisma.psychologist.findUnique({
      where: { id: psychologistId },
      select: { name: true },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
    const activationUrl = `${frontendUrl}/guardian-invite/${token}`;

    await this.email.sendGuardianInvitation(guardian.email, {
      guardianName: guardian.name,
      patientFirstName: guardian.patient.name.split(' ')[0],
      psychologistName: psy?.name ?? 'Votre psychologue',
      activationUrl,
    });

    await this.audit.log({
      actorId: actorUserId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'guardian_invitation',
      entityId: invitation.id,
      metadata: { guardianId, patientId },
    });

    return { sent: true, expiresAt };
  }

  async validateToken(token: string) {
    const invitation = await this.prisma.guardianInvitation.findUnique({
      where: { token },
      include: {
        guardian: {
          select: { name: true, patient: { select: { name: true } } },
        },
        psychologist: { select: { name: true } },
      },
    });

    if (!invitation) throw new NotFoundException('Invitation introuvable');
    if (invitation.status !== 'pending') throw new BadRequestException('Invitation deja utilisee');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('Invitation expiree');

    return {
      guardianName: invitation.guardian.name,
      patientFirstName: invitation.guardian.patient.name.split(' ')[0],
      psychologistName: invitation.psychologist.name,
      email: invitation.email,
    };
  }

  async acceptInvitation(token: string, password: string) {
    const invitation = await this.prisma.guardianInvitation.findUnique({
      where: { token },
      include: { guardian: true },
    });

    if (!invitation) throw new NotFoundException('Invitation introuvable');
    if (invitation.status !== 'pending') throw new BadRequestException('Invitation deja utilisee');
    if (invitation.expiresAt < new Date()) {
      await this.prisma.guardianInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Invitation expiree');
    }

    // Check if user already exists with this email
    const existing = await this.prisma.user.findUnique({ where: { email: invitation.email } });
    if (existing) {
      // Link existing user to guardian
      await this.prisma.$transaction([
        this.prisma.legalGuardian.update({
          where: { id: invitation.guardianId },
          data: { userId: existing.id },
        }),
        this.prisma.user.update({
          where: { id: existing.id },
          data: { role: 'guardian' },
        }),
        this.prisma.guardianInvitation.update({
          where: { id: invitation.id },
          data: { status: 'accepted' },
        }),
      ]);

      return this.generateGuardianTokens(existing.id, existing.email);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { user } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          role: 'guardian',
        },
      });

      await tx.legalGuardian.update({
        where: { id: invitation.guardianId },
        data: { userId: user.id },
      });

      await tx.guardianInvitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' },
      });

      return { user };
    });

    this.logger.log(`Guardian ${invitation.guardianId} accepted invitation, user ${user.id} created`);

    return this.generateGuardianTokens(user.id, user.email);
  }

  private generateGuardianTokens(userId: string, email: string) {
    const secret = this.config.getOrThrow<string>('PATIENT_JWT_SECRET');

    const accessToken = this.jwt.sign(
      { sub: userId, role: 'guardian', email },
      { secret, expiresIn: '1h', algorithm: 'HS256' },
    );

    const refreshToken = this.jwt.sign(
      { sub: userId, role: 'guardian', type: 'refresh' },
      { secret, expiresIn: '7d', algorithm: 'HS256' },
    );

    return { accessToken, refreshToken, userId, email };
  }
}
```

- [ ] **Step 4: Create GuardianInvitationsController**

Create `apps/api/src/guardians/guardian-invitations.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsString, MinLength } from 'class-validator';
import { KeycloakGuard } from '../auth/keycloak-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import { GuardianInvitationsService } from './guardian-invitations.service';
import { PrismaService } from '../common/prisma.service';

class AcceptGuardianInvitationDto {
  @IsString()
  @MinLength(8)
  password!: string;
}

@ApiTags('Guardian Invitations')
@Controller()
export class GuardianInvitationsController {
  constructor(
    private readonly service: GuardianInvitationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('patients/:patientId/guardians/:guardianId/invite')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  @ApiOperation({ summary: 'Envoyer invitation portail au tuteur' })
  async sendInvitation(
    @CurrentUser() user: KeycloakUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('guardianId', ParseUUIDPipe) guardianId: string,
  ) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId: user.sub } });
    if (!psy) throw new Error('Psychologue introuvable');
    return this.service.sendInvitation(psy.id, patientId, guardianId, user.sub);
  }

  @Get('guardian-invitations/:token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Valider un token d\'invitation (public)' })
  validateToken(@Param('token') token: string) {
    return this.service.validateToken(token);
  }

  @Post('guardian-invitations/:token/accept')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Accepter l\'invitation — creer compte guardian' })
  acceptInvitation(
    @Param('token') token: string,
    @Body() dto: AcceptGuardianInvitationDto,
  ) {
    return this.service.acceptInvitation(token, dto.password);
  }
}
```

- [ ] **Step 5: Verify compilation**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/guardians/guardian-invitations* apps/api/src/notifications/
git commit -m "feat(guardians): add invitation flow with email template"
```

---

## Task 5: Guardian Consent — Request, Approve, Refuse

**Files:**
- Create: `apps/api/src/guardians/guardian-consents.service.ts`
- Create: `apps/api/src/guardians/guardian-consents.controller.ts`
- Create: `apps/api/src/notifications/emails/guardian-consent-request.ts`
- Create: `apps/api/src/notifications/emails/guardian-consent-confirmed.ts`

- [ ] **Step 1: Create consent email templates**

Create `apps/api/src/notifications/emails/guardian-consent-request.ts`:

```typescript
const CONSENT_TYPE_LABELS: Record<string, string> = {
  data_processing: 'Traitement des donnees',
  ai_processing: 'Utilisation de l\'intelligence artificielle',
  video_consultation: 'Consultation video',
};

export function guardianConsentRequestEmail(params: {
  guardianName: string;
  patientFirstName: string;
  psychologistName: string;
  consentType: string;
  consentUrl: string;
}): { subject: string; html: string } {
  const label = CONSENT_TYPE_LABELS[params.consentType] ?? params.consentType;
  const subject = `[PsyLib] Consentement requis pour ${params.patientFirstName} — ${label}`;

  const html = `
    <h1>Bonjour ${params.guardianName},</h1>
    <p>${params.psychologistName} demande votre consentement pour activer la fonctionnalite suivante pour ${params.patientFirstName} :</p>
    <div class="info-box">
      <strong>${label}</strong>
    </div>
    <p>En tant que responsable legal, votre approbation est requise avant l'activation de cette fonctionnalite.</p>
    <p style="text-align: center;">
      <a href="${params.consentUrl}" class="btn">Consulter et repondre</a>
    </p>
    <p style="color: #9CA3AF; font-size: 14px;">Ce lien est valable 30 jours. Votre adresse IP et la date seront enregistrees conformement au RGPD.</p>
  `;

  return { subject, html };
}
```

Create `apps/api/src/notifications/emails/guardian-consent-confirmed.ts`:

```typescript
export function guardianConsentConfirmedEmail(params: {
  guardianName: string;
  patientFirstName: string;
  consentType: string;
}): { subject: string; html: string } {
  const subject = `[PsyLib] Consentement enregistre pour ${params.patientFirstName}`;

  const html = `
    <h1>Consentement enregistre</h1>
    <p>Le consentement <strong>${params.consentType}</strong> pour <strong>${params.patientFirstName}</strong> a ete approuve par ${params.guardianName}.</p>
    <p>Cette fonctionnalite est maintenant active pour le dossier de ${params.patientFirstName}.</p>
  `;

  return { subject, html };
}
```

- [ ] **Step 2: Create GuardianConsentsService**

Create `apps/api/src/guardians/guardian-consents.service.ts`:

```typescript
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { EmailService } from '../notifications/email.service';
import { NotificationGateway } from '../notifications/notification.gateway';

@Injectable()
export class GuardianConsentsService {
  private readonly logger = new Logger(GuardianConsentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationGateway,
  ) {}

  async requestConsent(
    psychologistId: string,
    patientId: string,
    guardianId: string,
    consentType: string,
    actorUserId: string,
  ) {
    // Validate consent type
    const validTypes = ['data_processing', 'ai_processing', 'video_consultation'];
    if (!validTypes.includes(consentType)) {
      throw new BadRequestException(`Type de consentement invalide: ${consentType}`);
    }

    const guardian = await this.prisma.legalGuardian.findFirst({
      where: { id: guardianId, patientId, psychologistId },
      include: { patient: { select: { name: true } } },
    });
    if (!guardian) throw new NotFoundException('Tuteur introuvable');

    // Generate HMAC-signed token
    const secret = this.config.getOrThrow<string>('PATIENT_JWT_SECRET');
    const requestId = crypto.randomUUID();
    const payload = `${guardianId}:${patientId}:${consentType}:${requestId}`;
    const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const token = `${requestId}.${hmac}`;

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const request = await this.prisma.guardianConsentRequest.create({
      data: {
        psychologistId,
        guardianId,
        patientId,
        consentType,
        token,
        expiresAt,
      },
    });

    const psy = await this.prisma.psychologist.findUnique({
      where: { id: psychologistId },
      select: { name: true },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
    const consentUrl = `${frontendUrl}/guardian-consent/${token}`;

    await this.email.sendGuardianConsentRequest(guardian.email, {
      guardianName: guardian.name,
      patientFirstName: guardian.patient.name.split(' ')[0],
      psychologistName: psy?.name ?? 'Votre psychologue',
      consentType,
      consentUrl,
    });

    await this.audit.log({
      actorId: actorUserId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'guardian_consent_request',
      entityId: request.id,
      metadata: { guardianId, patientId, consentType },
    });

    return { sent: true, expiresAt };
  }

  async getConsentPage(token: string) {
    const request = await this.prisma.guardianConsentRequest.findUnique({
      where: { token },
      include: {
        guardian: { select: { name: true } },
        patient: { select: { name: true } },
        psychologist: { select: { name: true } },
      },
    });

    if (!request) throw new NotFoundException('Demande de consentement introuvable');
    if (request.status !== 'pending') throw new BadRequestException('Ce consentement a deja ete traite');
    if (request.expiresAt < new Date()) throw new BadRequestException('Ce lien a expire');

    return {
      guardianName: request.guardian.name,
      patientFirstName: request.patient.name.split(' ')[0],
      psychologistName: request.psychologist.name,
      consentType: request.consentType,
      status: request.status,
    };
  }

  async approveConsent(token: string, ipAddress: string) {
    const request = await this.prisma.guardianConsentRequest.findUnique({
      where: { token },
      include: {
        guardian: { select: { name: true, email: true } },
        patient: { select: { name: true } },
        psychologist: { select: { name: true, userId: true, user: { select: { email: true } } } },
      },
    });

    if (!request) throw new NotFoundException('Demande introuvable');
    if (request.status !== 'pending') throw new BadRequestException('Deja traite');
    if (request.expiresAt < new Date()) throw new BadRequestException('Expire');

    await this.prisma.$transaction([
      this.prisma.guardianConsentRequest.update({
        where: { id: request.id },
        data: { status: 'approved', respondedAt: new Date(), ipAddress },
      }),
      this.prisma.gdprConsent.create({
        data: {
          patientId: request.patientId,
          type: request.consentType,
          version: '1.0',
          consentGivenBy: 'guardian',
          guardianId: request.guardianId,
          ipAddress,
        },
      }),
    ]);

    // Notify psy
    try {
      this.notifications.sendToUser(request.psychologist.userId, {
        type: 'guardian:consent_approved',
        title: 'Consentement approuve',
        body: `${request.guardian.name} a approuve le consentement "${request.consentType}" pour ${request.patient.name}`,
        data: { patientId: request.patientId, consentType: request.consentType },
      });
    } catch { /* ignore notification errors */ }

    // Send confirmation emails
    await this.email.sendGuardianConsentConfirmed(
      request.guardian.email,
      request.psychologist.user.email,
      {
        guardianName: request.guardian.name,
        patientFirstName: request.patient.name.split(' ')[0],
        consentType: request.consentType,
      },
    );

    return { approved: true };
  }

  async refuseConsent(token: string, ipAddress: string) {
    const request = await this.prisma.guardianConsentRequest.findUnique({
      where: { token },
      include: {
        guardian: { select: { name: true } },
        patient: { select: { name: true } },
        psychologist: { select: { userId: true } },
      },
    });

    if (!request) throw new NotFoundException('Demande introuvable');
    if (request.status !== 'pending') throw new BadRequestException('Deja traite');

    await this.prisma.guardianConsentRequest.update({
      where: { id: request.id },
      data: { status: 'refused', respondedAt: new Date(), ipAddress },
    });

    // Notify psy
    try {
      this.notifications.sendToUser(request.psychologist.userId, {
        type: 'guardian:consent_refused',
        title: 'Consentement refuse',
        body: `${request.guardian.name} a refuse le consentement "${request.consentType}" pour ${request.patient.name}`,
        data: { patientId: request.patientId, consentType: request.consentType },
      });
    } catch { /* ignore notification errors */ }

    return { refused: true };
  }
}
```

- [ ] **Step 3: Create GuardianConsentsController**

Create `apps/api/src/guardians/guardian-consents.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsString, IsEnum, IsUUID } from 'class-validator';
import type { Request } from 'express';
import { KeycloakGuard } from '../auth/keycloak-jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import { GuardianConsentsService } from './guardian-consents.service';
import { PrismaService } from '../common/prisma.service';

class RequestConsentDto {
  @IsUUID()
  guardianId!: string;

  @IsString()
  @IsEnum(['data_processing', 'ai_processing', 'video_consultation'])
  type!: string;
}

@ApiTags('Guardian Consents')
@Controller()
export class GuardianConsentsController {
  constructor(
    private readonly service: GuardianConsentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('patients/:patientId/guardian-consents')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  @ApiOperation({ summary: 'Demander un consentement au tuteur' })
  async requestConsent(
    @CurrentUser() user: KeycloakUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: RequestConsentDto,
  ) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId: user.sub } });
    if (!psy) throw new Error('Psychologue introuvable');
    return this.service.requestConsent(psy.id, patientId, dto.guardianId, dto.type, user.sub);
  }

  @Get('guardian-consents/:token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Page de consentement (public)' })
  getConsentPage(@Param('token') token: string) {
    return this.service.getConsentPage(token);
  }

  @Post('guardian-consents/:token/approve')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Approuver le consentement' })
  approveConsent(@Param('token') token: string, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.socket.remoteAddress ?? '';
    return this.service.approveConsent(token, ip);
  }

  @Post('guardian-consents/:token/refuse')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Refuser le consentement' })
  refuseConsent(@Param('token') token: string, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.socket.remoteAddress ?? '';
    return this.service.refuseConsent(token, ip);
  }
}
```

- [ ] **Step 4: Verify compilation**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/guardians/guardian-consents* apps/api/src/notifications/emails/
git commit -m "feat(guardians): add consent request/approve/refuse with email templates"
```

---

## Task 6: Guardian Portal — Auth + Data Endpoints

**Files:**
- Create: `apps/api/src/guardian-portal/guardian-portal.module.ts`
- Create: `apps/api/src/guardian-portal/strategies/guardian-jwt.strategy.ts`
- Create: `apps/api/src/guardian-portal/guards/guardian-jwt.guard.ts`
- Create: `apps/api/src/guardian-portal/guards/guardian-access.guard.ts`
- Create: `apps/api/src/guardian-portal/decorators/current-guardian.decorator.ts`
- Create: `apps/api/src/guardian-portal/guardian-auth.service.ts`
- Create: `apps/api/src/guardian-portal/guardian-auth.controller.ts`
- Create: `apps/api/src/guardian-portal/guardian-portal.service.ts`
- Create: `apps/api/src/guardian-portal/guardian-portal.controller.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create Guardian JWT Strategy**

Create `apps/api/src/guardian-portal/strategies/guardian-jwt.strategy.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma.service';

export interface GuardianUser {
  sub: string;       // userId
  role: 'guardian';
  email: string;
}

@Injectable()
export class GuardianJwtStrategy extends PassportStrategy(Strategy, 'guardian-jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('PATIENT_JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: { sub: string; role: string; email: string }): Promise<GuardianUser> {
    if (payload.role !== 'guardian') {
      throw new UnauthorizedException('Token guardian invalide');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });

    if (!user || user.role !== 'guardian') {
      throw new UnauthorizedException('Token guardian invalide');
    }

    return { sub: payload.sub, role: 'guardian', email: payload.email };
  }
}
```

- [ ] **Step 2: Create Guard and Decorator**

Create `apps/api/src/guardian-portal/guards/guardian-jwt.guard.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GuardianJwtGuard extends AuthGuard('guardian-jwt') {}
```

Create `apps/api/src/guardian-portal/guards/guardian-access.guard.ts`:

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../common/prisma.service';
import type { GuardianUser } from '../strategies/guardian-jwt.strategy';
import type { GuardianPermissions } from '@psyscale/shared-types';

export const GUARDIAN_PERMISSION_KEY = 'guardian_permission';

@Injectable()
export class GuardianAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<keyof GuardianPermissions | undefined>(
      GUARDIAN_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user as GuardianUser;
    const patientId = request.params?.patientId;

    if (!user?.sub) throw new ForbiddenException('Acces non autorise');
    if (!patientId) throw new ForbiddenException('Patient ID requis');

    // Load guardian by userId + patientId (supports guardians linked to multiple minors)
    const guardian = await this.prisma.legalGuardian.findFirst({
      where: { userId: user.sub, patientId },
      include: {
        patient: { select: { isMinor: true, psychologistId: true } },
        psychologist: {
          include: { subscription: { select: { plan: true, status: true } } },
        },
      },
    });

    if (!guardian) throw new NotFoundException('Acces non autorise a ce patient');

    // Verify patient is still minor
    if (!guardian.patient.isMinor) {
      throw new ForbiddenException('Ce patient n\'est plus mineur — acces tuteur revoque');
    }

    // Verify psychologistId consistency
    if (guardian.psychologistId !== guardian.patient.psychologistId) {
      throw new ForbiddenException('Incohérence tenant');
    }

    // Plan check
    const plan = guardian.psychologist.subscription?.plan ?? 'free';
    if (plan === 'free') {
      throw new ForbiddenException('Le plan du praticien ne permet pas l\'acces portail tuteur');
    }

    // Solo plan: only primary guardian can access
    if ((plan === 'starter') && !guardian.isPrimary) {
      throw new ForbiddenException('Seul le tuteur principal peut acceder au portail avec le plan Solo');
    }

    // Permission check
    if (requiredPermission) {
      const permissions = guardian.permissions as GuardianPermissions;
      if (!permissions[requiredPermission]) {
        throw new ForbiddenException(`Vous n'avez pas la permission "${requiredPermission}"`);
      }
    }

    // Attach guardian data to request for service use
    request.guardianData = guardian;

    return true;
  }
}
```

Create `apps/api/src/guardian-portal/decorators/current-guardian.decorator.ts`:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { GuardianUser } from '../strategies/guardian-jwt.strategy';

export const CurrentGuardian = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): GuardianUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as GuardianUser;
  },
);
```

- [ ] **Step 3: Create GuardianAuthService**

Create `apps/api/src/guardian-portal/guardian-auth.service.ts`:

```typescript
import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class GuardianAuthService {
  private readonly logger = new Logger(GuardianAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== 'guardian' || !user.passwordHash) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Email ou mot de passe incorrect');

    // Verify at least one guardian link exists for this user
    const guardianCount = await this.prisma.legalGuardian.count({
      where: { userId: user.id },
    });
    if (guardianCount === 0) throw new UnauthorizedException('Compte tuteur non associe');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSignInAt: new Date() },
    });

    // JWT contains only userId + role (no guardianId — resolved per-request via GuardianAccessGuard)
    return this.generateTokens(user.id, user.email);
  }

  async refreshToken(refreshTokenValue: string) {
    const secret = this.config.getOrThrow<string>('PATIENT_JWT_SECRET');

    try {
      const decoded = this.jwt.verify(refreshTokenValue, { secret }) as {
        sub: string;
        role: string;
        type?: string;
      };

      if (decoded.type !== 'refresh' || decoded.role !== 'guardian') {
        throw new UnauthorizedException('Token invalide');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, email: true, role: true },
      });

      if (!user || user.role !== 'guardian') {
        throw new UnauthorizedException('Compte introuvable');
      }

      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expire');
    }
  }

  private generateTokens(userId: string, email: string) {
    const secret = this.config.getOrThrow<string>('PATIENT_JWT_SECRET');

    const accessToken = this.jwt.sign(
      { sub: userId, role: 'guardian', email },
      { secret, expiresIn: '1h', algorithm: 'HS256' },
    );

    const refreshToken = this.jwt.sign(
      { sub: userId, role: 'guardian', type: 'refresh' },
      { secret, expiresIn: '7d', algorithm: 'HS256' },
    );

    return { accessToken, refreshToken, userId, email };
  }
}
```

- [ ] **Step 4: Create GuardianAuthController**

Create `apps/api/src/guardian-portal/guardian-auth.controller.ts`:

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { GuardianAuthService } from './guardian-auth.service';

class GuardianLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class GuardianRefreshDto {
  @IsString()
  refreshToken!: string;
}

@ApiTags('Guardian Portal — Auth')
@Controller('guardian-portal/auth')
export class GuardianAuthController {
  constructor(private readonly service: GuardianAuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login tuteur' })
  login(@Body() dto: GuardianLoginDto) {
    return this.service.login(dto.email, dto.password);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Rafraichir token tuteur' })
  refresh(@Body() dto: GuardianRefreshDto) {
    return this.service.refreshToken(dto.refreshToken);
  }
}
```

- [ ] **Step 5: Create GuardianPortalService**

Create `apps/api/src/guardian-portal/guardian-portal.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class GuardianPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly encryption: EncryptionService,
  ) {}

  async getMinors(userId: string) {
    const guardians = await this.prisma.legalGuardian.findMany({
      where: { userId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            birthDate: true,
            isMinor: true,
            status: true,
            psychologist: { select: { name: true } },
          },
        },
      },
    });

    return guardians
      .filter((g) => g.patient.isMinor)
      .map((g) => ({
        patientId: g.patient.id,
        name: g.patient.name,
        birthDate: g.patient.birthDate,
        psychologistName: g.patient.psychologist.name,
        relationship: g.relationship,
        permissions: g.permissions,
        guardianId: g.id,
      }));
  }

  async getDashboard(actorUserId: string, patientId: string) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [moods, exercises, nextAppointment, journalCount] = await Promise.all([
      this.prisma.moodTracking.findMany({
        where: { patientId, createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: 'desc' },
        select: { mood: true, createdAt: true },
      }),
      this.prisma.exercise.findMany({
        where: { patientId, status: { in: ['assigned', 'in_progress'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.appointment.findFirst({
        where: { patientId, scheduledAt: { gte: now }, status: { in: ['scheduled', 'confirmed'] } },
        orderBy: { scheduledAt: 'asc' },
        select: { scheduledAt: true, duration: true, status: true },
      }),
      this.prisma.journalEntry.count({
        where: { patientId, isPrivate: false },
      }),
    ]);

    const avgMood = moods.length > 0
      ? moods.reduce((sum, m) => sum + m.mood, 0) / moods.length
      : null;

    await this.audit.logRead(actorUserId, 'guardian', 'patient_dashboard', patientId);

    return {
      avgMood7d: avgMood ? Math.round(avgMood * 10) / 10 : null,
      moodHistory: moods,
      pendingExercises: exercises,
      nextAppointment,
      journalCount,
    };
  }

  async getMood(actorUserId: string, patientId: string, days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const moods = await this.prisma.moodTracking.findMany({
      where: { patientId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    });

    await this.audit.logRead(actorUserId, 'guardian', 'mood_tracking', patientId);
    return moods;
  }

  async getExercises(actorUserId: string, patientId: string) {
    const exercises = await this.prisma.exercise.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    await this.audit.logRead(actorUserId, 'guardian', 'exercises', patientId);
    return exercises;
  }

  async getJournal(actorUserId: string, patientId: string) {
    const entries = await this.prisma.journalEntry.findMany({
      where: { patientId, isPrivate: false }, // Guardian cannot see private entries
      orderBy: { createdAt: 'desc' },
    });

    // Decrypt content
    const decrypted = entries.map((entry) => ({
      ...entry,
      content: this.encryption.decrypt(entry.content),
    }));

    await this.audit.logRead(actorUserId, 'guardian', 'journal_entries', patientId);
    await this.audit.logDecrypt(actorUserId, 'guardian', 'journal_entries', patientId, 'content');

    return decrypted;
  }

  async getDocuments(actorUserId: string, patientId: string) {
    const docs = await this.prisma.sharedDocument.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        category: true,
        message: true,
        downloadedAt: true,
        createdAt: true,
      },
    });

    await this.audit.logRead(actorUserId, 'guardian', 'shared_documents', patientId);
    return docs;
  }

  async getInvoices(actorUserId: string, patientId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { patientId },
      orderBy: { issuedAt: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        amountTtc: true,
        status: true,
        issuedAt: true,
        pdfUrl: true,
      },
    });

    await this.audit.logRead(actorUserId, 'guardian', 'invoices', patientId);
    return invoices;
  }
}
```

- [ ] **Step 6: Create GuardianPortalController**

Create `apps/api/src/guardian-portal/guardian-portal.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  SetMetadata,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GuardianJwtGuard } from './guards/guardian-jwt.guard';
import { GuardianAccessGuard, GUARDIAN_PERMISSION_KEY } from './guards/guardian-access.guard';
import { CurrentGuardian } from './decorators/current-guardian.decorator';
import type { GuardianUser } from './strategies/guardian-jwt.strategy';
import { GuardianPortalService } from './guardian-portal.service';

const RequirePermission = (permission: string) => SetMetadata(GUARDIAN_PERMISSION_KEY, permission);

@ApiTags('Guardian Portal')
@ApiBearerAuth()
@Controller('guardian-portal')
export class GuardianPortalController {
  constructor(private readonly service: GuardianPortalService) {}

  @Get('minors')
  @UseGuards(GuardianJwtGuard)
  @ApiOperation({ summary: 'Liste des mineurs lies au tuteur' })
  getMinors(@CurrentGuardian() user: GuardianUser) {
    return this.service.getMinors(user.sub);
  }

  @Get('minors/:patientId/dashboard')
  @UseGuards(GuardianJwtGuard, GuardianAccessGuard)
  @RequirePermission('portal')
  @ApiOperation({ summary: 'Dashboard du mineur' })
  getDashboard(
    @CurrentGuardian() user: GuardianUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.service.getDashboard(user.sub, patientId);
  }

  @Get('minors/:patientId/mood')
  @UseGuards(GuardianJwtGuard, GuardianAccessGuard)
  @RequirePermission('portal')
  @ApiOperation({ summary: 'Humeur du mineur' })
  getMood(
    @CurrentGuardian() user: GuardianUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.service.getMood(user.sub, patientId, days);
  }

  @Get('minors/:patientId/exercises')
  @UseGuards(GuardianJwtGuard, GuardianAccessGuard)
  @RequirePermission('portal')
  @ApiOperation({ summary: 'Exercices du mineur' })
  getExercises(
    @CurrentGuardian() user: GuardianUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.service.getExercises(user.sub, patientId);
  }

  @Get('minors/:patientId/journal')
  @UseGuards(GuardianJwtGuard, GuardianAccessGuard)
  @RequirePermission('portal')
  @ApiOperation({ summary: 'Journal du mineur (entries non privees)' })
  getJournal(
    @CurrentGuardian() user: GuardianUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.service.getJournal(user.sub, patientId);
  }

  @Get('minors/:patientId/documents')
  @UseGuards(GuardianJwtGuard, GuardianAccessGuard)
  @RequirePermission('documents')
  @ApiOperation({ summary: 'Documents partages du mineur' })
  getDocuments(
    @CurrentGuardian() user: GuardianUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.service.getDocuments(user.sub, patientId);
  }

  @Get('minors/:patientId/invoices')
  @UseGuards(GuardianJwtGuard, GuardianAccessGuard)
  @RequirePermission('invoices')
  @ApiOperation({ summary: 'Factures du mineur' })
  getInvoices(
    @CurrentGuardian() user: GuardianUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.service.getInvoices(user.sub, patientId);
  }
}
```

- [ ] **Step 7: Create GuardianPortalModule**

Create `apps/api/src/guardian-portal/guardian-portal.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { GuardianJwtStrategy } from './strategies/guardian-jwt.strategy';
import { GuardianAuthController } from './guardian-auth.controller';
import { GuardianAuthService } from './guardian-auth.service';
import { GuardianPortalController } from './guardian-portal.controller';
import { GuardianPortalService } from './guardian-portal.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    NotificationsModule,
  ],
  controllers: [GuardianAuthController, GuardianPortalController],
  providers: [
    GuardianJwtStrategy,
    GuardianAuthService,
    GuardianPortalService,
  ],
})
export class GuardianPortalModule {}
```

- [ ] **Step 8: Register GuardianPortalModule in app.module.ts**

In `apps/api/src/app.module.ts`, add:
```typescript
import { GuardianPortalModule } from './guardian-portal/guardian-portal.module';
```
Add `GuardianPortalModule` to imports array.

- [ ] **Step 9: Update audit.service.ts actor types**

In `apps/api/src/common/audit.service.ts` (line 8), update the `ActorType` type to include `'guardian'`:

```typescript
export type ActorType = 'psychologist' | 'patient' | 'system' | 'admin' | 'guardian';
```

- [ ] **Step 10: Verify compilation**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 11: Commit**

```bash
git add apps/api/src/guardian-portal/ apps/api/src/app.module.ts apps/api/src/common/audit.service.ts
git commit -m "feat(guardian-portal): add auth, access guard, and portal endpoints"
```

---

## Task 7: Frontend — Auth Config, Middleware, Layout

**Files:**
- Modify: `packages/shared-types/src/index.ts` (already done in Task 2)
- Modify: `apps/web/src/lib/auth/auth.config.ts`
- Modify: `apps/web/src/middleware.ts`
- Modify: `apps/web/src/app/(patient-portal)/layout.tsx`
- Create: `apps/web/src/lib/api/guardian-portal.ts`

- [ ] **Step 1: Add guardian-credentials provider to auth.config.ts**

In `apps/web/src/lib/auth/auth.config.ts`, add a third provider after `patient-credentials`:

```typescript
    // Auth guardian — email/password via notre API NestJS
    CredentialsProvider({
      id: 'guardian-credentials',
      name: 'Guardian',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
          const res = await fetch(`${apiUrl}/api/v1/guardian-portal/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const data = (await res.json()) as {
            accessToken: string;
            userId: string;
            email: string;
          };

          return {
            id: data.userId,
            email: data.email,
            role: UserRole.GUARDIAN,
            accessToken: data.accessToken,
          };
        } catch {
          return null;
        }
      },
    }),
```

In the JWT callback, add after the `patient-credentials` block:

```typescript
      // Guardian credentials login
      if (account?.provider === 'guardian-credentials' && user) {
        const guardianUser = user as typeof user & { accessToken: string; role: UserRole };
        token.role = UserRole.GUARDIAN;
        token.accessToken = guardianUser.accessToken;
        return token;
      }
```

No additional type augmentation needed — the existing `role` and `accessToken` fields on JWT/Session are sufficient. The guardian's minors are resolved server-side via the `/guardian-portal/minors` endpoint.

- [ ] **Step 2: Update middleware for GUARDIAN role**

In `apps/web/src/middleware.ts`:

Add `guardian-invite` and `guardian-consent` to public routes:

```typescript
  if (
    pathname === '/forgot-password' ||
    pathname === '/patient/login' ||
    pathname === '/patient/accept-invitation' ||
    pathname.startsWith('/guardian-invite/') ||
    pathname.startsWith('/guardian-consent/')
  ) {
    return nextWithPathname(req);
  }
```

Update the login redirect to handle GUARDIAN:
```typescript
    if (isAuthenticated) {
      const role = session?.user?.role;
      if (role === UserRole.PATIENT || role === UserRole.GUARDIAN) {
        return NextResponse.redirect(new URL('/patient-portal', req.url));
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
```

Update patient-portal RBAC to accept guardians:
```typescript
  // Protection RBAC — patient-portal pour patients ET guardians
  if (pathname.startsWith('/patient-portal')) {
    const role = session?.user?.role;
    if (role !== UserRole.PATIENT && role !== UserRole.GUARDIAN) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
```

- [ ] **Step 3: Update patient portal layout to accept GUARDIAN role**

In `apps/web/src/app/(patient-portal)/layout.tsx`:

```typescript
  if (session.user.role !== UserRole.PATIENT && session.user.role !== UserRole.GUARDIAN) {
    redirect('/dashboard');
  }

  const isGuardian = session.user.role === UserRole.GUARDIAN;
```

Add guardian badge in header:
```typescript
  <div className="flex items-center gap-3">
    {isGuardian && (
      <span className="text-xs font-medium bg-accent/10 text-accent px-2 py-1 rounded-full">
        Tuteur
      </span>
    )}
    <span className="text-sm text-muted-foreground hidden sm:inline">{session.user.email}</span>
    <PatientLogoutButton />
  </div>
```

- [ ] **Step 4: Create guardian portal API client**

Create `apps/web/src/lib/api/guardian-portal.ts`:

```typescript
const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

async function fetchGuardian<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}/api/v1/guardian-portal${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

export interface MinorChild {
  patientId: string;
  name: string;
  birthDate: string | null;
  psychologistName: string;
  relationship: string;
  permissions: {
    portal: boolean;
    invoices: boolean;
    video: boolean;
    documents: boolean;
    messaging: boolean;
  };
  guardianId: string;
}

export const guardianPortalApi = {
  getMinors: (token: string) => fetchGuardian<MinorChild[]>('/minors', token),

  getDashboard: (token: string, patientId: string) =>
    fetchGuardian<Record<string, unknown>>(`/minors/${patientId}/dashboard`, token),

  getMood: (token: string, patientId: string, days = 30) =>
    fetchGuardian<Array<{ mood: number; createdAt: string }>>(`/minors/${patientId}/mood?days=${days}`, token),

  getExercises: (token: string, patientId: string) =>
    fetchGuardian<Array<Record<string, unknown>>>(`/minors/${patientId}/exercises`, token),

  getJournal: (token: string, patientId: string) =>
    fetchGuardian<Array<Record<string, unknown>>>(`/minors/${patientId}/journal`, token),

  getDocuments: (token: string, patientId: string) =>
    fetchGuardian<Array<Record<string, unknown>>>(`/minors/${patientId}/documents`, token),

  getInvoices: (token: string, patientId: string) =>
    fetchGuardian<Array<Record<string, unknown>>>(`/minors/${patientId}/invoices`, token),
};
```

- [ ] **Step 5: Build shared-types and verify frontend compilation**

Run: `cd packages/shared-types && npm run build`
Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/auth/ apps/web/src/middleware.ts apps/web/src/app/\(patient-portal\)/layout.tsx apps/web/src/lib/api/guardian-portal.ts
git commit -m "feat(frontend): add guardian auth provider, middleware routing, portal layout"
```

---

## Task 8: Frontend — Psy-Side Guardian UI Components

**Files:**
- Create: `apps/web/src/components/patients/guardian-section.tsx`
- Create: `apps/web/src/components/patients/add-guardian-dialog.tsx`
- Create: `apps/web/src/components/patients/guardian-tab.tsx`
- Modify: Patient create/edit forms to include guardian section
- Modify: Patient detail page to add "Responsables legaux" tab

This task creates the psychologist-facing UI for managing guardians on a patient's record. Key components:

- **GuardianSection**: Shown in patient create/edit when `isMinor` toggle is ON. Displays guardian cards with name, relationship, email, permission badges, and "Invite to portal" button.
- **AddGuardianDialog**: Dialog with form fields (name, email, phone, relationship dropdown, isPrimary toggle, permissions checkboxes). Pro/Clinic shows individual permission toggles; Solo shows all-on defaults.
- **GuardianTab**: Tab in patient detail page showing guardian list, portal status badges (active/pending), permission badges, consent status section (approved/pending/not requested per consent type with guardian name and date).

- [ ] **Step 1: Create GuardianSection component**

Create `apps/web/src/components/patients/guardian-section.tsx` — renders when `isMinor` is true, shows guardian cards list and "Add guardian" button. Each card shows: name, relationship badge, email, phone, permission badges (portal/invoices/documents/video/messaging), portal status (active if userId exists, "Invite" button otherwise).

- [ ] **Step 2: Create AddGuardianDialog component**

Create `apps/web/src/components/patients/add-guardian-dialog.tsx` — shadcn Dialog with form (react-hook-form + zod): name (required), email (required), phone (optional), relationship (Select: Mere/Pere/Tuteur legal/Autre), isPrimary toggle, permissions checkboxes (only shown for Pro/Clinic plans).

- [ ] **Step 3: Create GuardianTab component for patient detail**

Create `apps/web/src/components/patients/guardian-tab.tsx` — TabsContent showing:
1. Guardian list with status badges
2. Consent status section showing approved/pending/not-requested per consent type
3. "Request consent" button per consent type
4. "Invite to portal" button per guardian (if not yet invited)

- [ ] **Step 4: Modify patient create/edit dialogs to include isMinor toggle + guardian section**

In existing patient create/edit components, add:
- Toggle "Patient mineur" (teal accent) after the birthDate field
- When ON, show `<GuardianSection />` below
- Pass plan info to control whether 2nd guardian and permissions config are available

- [ ] **Step 5: Add "Responsables legaux" tab to patient detail page**

In the patient detail page tabs, add a new tab "Tuteurs" that renders `<GuardianTab />`, only visible when `patient.isMinor === true`.

- [ ] **Step 6: Verify frontend builds**

Run: `cd apps/web && npx next build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/patients/
git commit -m "feat(frontend): add guardian UI components for patient forms and detail"
```

---

## Task 9: Frontend — Public Pages (Invitation + Consent)

**Files:**
- Create: `apps/web/src/app/(auth)/guardian-invite/[token]/page.tsx`
- Create: `apps/web/src/app/(auth)/guardian-consent/[token]/page.tsx`

- [ ] **Step 1: Create guardian invitation acceptance page**

Create `apps/web/src/app/(auth)/guardian-invite/[token]/page.tsx`:

Public page that:
1. Calls `GET /api/v1/guardian-invitations/:token` to validate
2. Shows: guardian name, patient first name, psychologist name
3. If valid: password creation form (password + confirm) + "Activer mon acces" button
4. On submit: calls `POST /api/v1/guardian-invitations/:token/accept` with password
5. On success: auto-login via `signIn('guardian-credentials')` and redirect to `/patient-portal`
6. Error states: expired, already used, not found

- [ ] **Step 2: Create guardian consent page**

Create `apps/web/src/app/(auth)/guardian-consent/[token]/page.tsx`:

Public page that:
1. Calls `GET /api/v1/guardian-consents/:token` to get consent details
2. Shows: psychologist name, patient first name, consent type with explanation
3. Two buttons: "J'approuve" (green) and "Je refuse" (red/outline)
4. On approve: calls `POST /api/v1/guardian-consents/:token/approve`
5. On refuse: calls `POST /api/v1/guardian-consents/:token/refuse`
6. Shows confirmation screen after action
7. IP + date recording notice at bottom

- [ ] **Step 3: Verify frontend builds**

Run: `cd apps/web && npx next build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(auth\)/guardian-invite/ apps/web/src/app/\(auth\)/guardian-consent/
git commit -m "feat(frontend): add public guardian invitation and consent pages"
```

---

## Task 10: Frontend — Guardian Portal Minor Selector

**Files:**
- Create: `apps/web/src/app/(patient-portal)/patient-portal/minor-selector/page.tsx`
- Modify: `apps/web/src/app/(patient-portal)/patient-portal/page.tsx` (patient portal dashboard)

- [ ] **Step 1: Create minor selector page**

Create `apps/web/src/app/(patient-portal)/patient-portal/minor-selector/page.tsx`:

Page shown when guardian has 2+ linked minors:
1. Calls `guardianPortalApi.getMinors(token)` to get list
2. Shows cards per minor: name, age (from birthDate), psychologist name, permission badges
3. Click card → navigates to `/patient-portal?minorId=:patientId`
4. If only 1 minor → auto-redirect to dashboard with minorId

- [ ] **Step 2: Modify patient portal dashboard for guardian role**

In the patient portal dashboard page, detect if user is guardian:
1. If guardian: read `minorId` from searchParams, use `guardianPortalApi` instead of `patientPortalApi`
2. If no `minorId` and guardian has 2+ minors → redirect to `/patient-portal/minor-selector`
3. Show minor name + "Back to children" link in header for guardians

- [ ] **Step 3: Verify frontend builds**

Run: `cd apps/web && npx next build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(patient-portal\)/patient-portal/
git commit -m "feat(frontend): add minor selector and guardian-aware patient portal"
```

---

## Task 11: Invoice Routing + Video Link to Guardians

**Files:**
- Modify: `apps/api/src/invoices/invoices.service.ts` (or wherever invoice email sending occurs)
- Modify: `apps/api/src/appointments/appointments.service.ts`
- Create: `apps/api/src/notifications/emails/guardian-invoice.ts`

This task implements the spec requirements from sections 5.6 and 7: sending invoices to the primary guardian and sending video consultation links to guardians with video permission.

- [ ] **Step 1: Create guardian-invoice email template**

Create `apps/api/src/notifications/emails/guardian-invoice.ts`:

```typescript
export function guardianInvoiceEmail(params: {
  guardianName: string;
  patientFirstName: string;
  invoiceNumber: string;
  amount: string;
  pdfUrl?: string;
}): { subject: string; html: string } {
  const subject = `[PsyLib] Facture ${params.invoiceNumber} — Seance de ${params.patientFirstName}`;

  const html = `
    <h1>Bonjour ${params.guardianName},</h1>
    <p>Voici la facture <strong>${params.invoiceNumber}</strong> pour la seance de ${params.patientFirstName}.</p>
    <div class="info-box">
      <p><strong>Montant :</strong> ${params.amount} EUR</p>
      <p><strong>Numero :</strong> ${params.invoiceNumber}</p>
    </div>
    ${params.pdfUrl ? `<p style="text-align: center;"><a href="${params.pdfUrl}" class="btn">Telecharger la facture PDF</a></p>` : ''}
  `;

  return { subject, html };
}
```

- [ ] **Step 2: Modify invoice generation to send to guardian**

In the invoice service (find the method that sends invoice emails after generation), add logic:

```typescript
// After invoice is generated and PDF created:
if (patient.isMinor) {
  const primaryGuardian = await this.prisma.legalGuardian.findFirst({
    where: { patientId: patient.id, isPrimary: true },
    select: { name: true, email: true, permissions: true },
  });
  if (primaryGuardian) {
    const permissions = primaryGuardian.permissions as { invoices?: boolean };
    if (permissions.invoices) {
      await this.emailService.sendGuardianInvoice(primaryGuardian.email, {
        guardianName: primaryGuardian.name,
        patientFirstName: patient.name.split(' ')[0],
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amountTtc.toString(),
        pdfUrl: invoice.pdfUrl ?? undefined,
      });
    }
  }
}
```

- [ ] **Step 3: Add `sendGuardianInvoice` method to EmailService**

In `apps/api/src/notifications/email.service.ts`, add:

```typescript
  async sendGuardianInvoice(to: string, params: {
    guardianName: string;
    patientFirstName: string;
    invoiceNumber: string;
    amount: string;
    pdfUrl?: string;
  }) {
    const { subject, html } = guardianInvoiceEmail(params);
    return this.send(to, subject, emailLayout(subject, html), 'sendGuardianInvoice');
  }
```

- [ ] **Step 4: Modify appointment creation to send video link to guardians**

In `apps/api/src/appointments/appointments.service.ts`, find the method that creates appointments with video rooms. After sending the patient's video link, add:

```typescript
// If minor patient has a guardian with video permission, send video link to guardian
if (patient.isMinor && videoRoom) {
  const guardians = await this.prisma.legalGuardian.findMany({
    where: { patientId: patient.id },
    select: { name: true, email: true, permissions: true },
  });
  for (const guardian of guardians) {
    const perms = guardian.permissions as { video?: boolean };
    if (perms.video) {
      // Send video link email to guardian (use same template as patient video link)
      await this.emailService.sendAppointmentReminder(guardian.email, {
        patientName: guardian.name,
        psychologistName: psychologist.name,
        date: appointment.scheduledAt,
        videoUrl: videoJoinUrl,
      });
    }
  }
}
```

- [ ] **Step 5: Verify compilation**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/invoices/ apps/api/src/appointments/ apps/api/src/notifications/
git commit -m "feat(guardians): add invoice routing and video link to guardians"
```

---

## Task 12: Integration — Wire Everything + Smoke Test

**Files:**
- Various files from previous tasks

- [ ] **Step 1: Verify all NestJS modules are imported**

In `apps/api/src/app.module.ts`, confirm both `GuardiansModule` and `GuardianPortalModule` are in imports.

- [ ] **Step 2: Verify Prisma schema compiles and migration applies**

Run: `cd apps/api && npx prisma generate`
Run: `cd apps/api && npx prisma migrate dev --name verify_guardians`
Expected: No new migration needed (already applied in Task 1).

- [ ] **Step 3: Verify API compiles and starts**

Run: `cd apps/api && npx tsc --noEmit && npm run start:dev`
Expected: API starts without errors, no import/DI errors.

- [ ] **Step 4: Verify frontend compiles and builds**

Run: `cd packages/shared-types && npm run build`
Run: `cd apps/web && npx next build`
Expected: Both build successfully.

- [ ] **Step 5: Manual smoke test checklist**

1. Create a patient with `isMinor: true` via API
2. Add a guardian via `POST /patients/:id/guardians`
3. List guardians via `GET /patients/:id/guardians`
4. Send invitation via `POST /patients/:id/guardians/:gid/invite`
5. Validate invitation token via `GET /guardian-invitations/:token`
6. Accept invitation via `POST /guardian-invitations/:token/accept`
7. Login as guardian via `POST /guardian-portal/auth/login`
8. List minors via `GET /guardian-portal/minors`
9. Access dashboard via `GET /guardian-portal/minors/:patientId/dashboard`
10. Request consent via `POST /patients/:id/guardian-consents`
11. Approve consent via `POST /guardian-consents/:token/approve`

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat(guardians): complete minor patients & legal guardians feature"
```
