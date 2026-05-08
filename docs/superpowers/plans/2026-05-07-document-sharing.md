# Document Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow psychologists to share files (PDF, images, DOCX, ODT) with patients — viewable/downloadable from the patient portal.

**Architecture:** New `DocumentsModule` in NestJS handles upload, storage, and retrieval. Files stored on local VPS disk at `/uploads/documents/`. Plan-gated (Solo+). Patient-side endpoints added to `PatientPortalController`. Frontend: new "Documents" tab in patient detail + new patient portal page.

**Tech Stack:** NestJS + Multer (file upload), Prisma (DB), AES-256-GCM (message encryption), Resend (email notification), Next.js (frontend pages)

**Spec:** `docs/superpowers/specs/2026-05-06-document-sharing-design.md`

---

## File Structure

### Backend — New files
- `apps/api/src/documents/documents.module.ts` — Module declaration
- `apps/api/src/documents/documents.controller.ts` — Psy endpoints (POST share, GET list, GET detail, DELETE)
- `apps/api/src/documents/documents.service.ts` — Business logic, file storage, quota check
- `apps/api/src/documents/dto/share-document.dto.ts` — Validation DTO for upload

### Backend — Modified files
- `apps/api/prisma/schema.prisma` — Add `DocumentCategory` enum + `SharedDocument` model
- `packages/shared-types/src/index.ts` — Add `documentsBytesMonthly` to `PLAN_LIMITS` type + `DocumentCategory` enum
- `apps/api/src/billing/decorators/require-plan.decorator.ts:7` — Add `'documents'` to `BillingFeature`
- `apps/api/src/billing/guards/subscription.guard.ts:83-85` — Add `documents` feature branch
- `apps/api/src/billing/subscription.service.ts` — Add `checkDocumentQuota()` method
- `apps/api/src/app.module.ts` — Import `DocumentsModule`
- `apps/api/src/patient-portal/patient-portal.module.ts` — Import `DocumentsModule`
- `apps/api/src/patient-portal/patient-portal.controller.ts` — Add document endpoints
- `apps/api/src/patient-portal/patient-portal.service.ts` — Add `getDocuments()`, `downloadDocument()`, dashboard `unreadDocuments`
- `apps/api/src/notifications/email.service.ts` — Add `sendDocumentShared()` method
- `apps/api/src/patients/patients.service.ts` — Add physical file cleanup in RGPD purge

### Frontend — New files
- `apps/web/src/app/(patient-portal)/patient-portal/documents/page.tsx` — Patient documents page
- `apps/web/src/components/patients/patient-documents-tab.tsx` — Documents tab for psy patient detail page
- `apps/web/src/components/patients/share-document-dialog.tsx` — Upload/share dialog

### Frontend — Modified files
- `apps/web/src/lib/api/patient-portal.ts` — Add `SharedDocument` type + `getDocuments()` + `downloadDocument()` methods
- `apps/web/src/components/patients/patient-detail.tsx` — Add Documents section
- `apps/web/src/app/(patient-portal)/layout.tsx` — Add "Documents" to bottom nav

---

### Task 1: Prisma Schema — Enum + Model + Migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `packages/shared-types/src/index.ts`

- [ ] **Step 1: Add `DocumentCategory` enum and `SharedDocument` model to Prisma schema**

In `apps/api/prisma/schema.prisma`, after the `RecurringFrequency` enum block (~line 203), add:

```prisma
enum DocumentCategory {
  exercise
  administrative
  session_report
  other
}
```

After the last model (before the end of file), add:

```prisma
model SharedDocument {
  id             String           @id @default(uuid())
  psychologistId String           @map("psychologist_id")
  patientId      String           @map("patient_id")
  fileName       String           @map("file_name")
  filePath       String           @map("file_path")
  fileSize       Int              @map("file_size")
  mimeType       String           @map("mime_type")
  category       DocumentCategory
  message        String?          // ENCRYPTED — AES-256-GCM
  downloadedAt   DateTime?        @map("downloaded_at")
  deletedAt      DateTime?        @map("deleted_at")
  createdAt      DateTime         @default(now()) @map("created_at")

  psychologist Psychologist @relation(fields: [psychologistId], references: [id], onDelete: Cascade)
  patient      Patient      @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([psychologistId], name: "idx_shared_documents_psy")
  @@index([patientId, createdAt(sort: Desc)], name: "idx_shared_documents_patient")
  @@map("shared_documents")
}
```

Add relation to `Patient` model (after `appointmentParticipations` line ~431):

```prisma
  sharedDocuments        SharedDocument[]
```

Add relation to `Psychologist` model (after existing relations):

```prisma
  sharedDocuments          SharedDocument[]
```

- [ ] **Step 2: Add `DocumentCategory` enum to shared-types**

In `packages/shared-types/src/index.ts`, after the `ExerciseStatus` enum:

```typescript
export enum DocumentCategory {
  EXERCISE = 'exercise',
  ADMINISTRATIVE = 'administrative',
  SESSION_REPORT = 'session_report',
  OTHER = 'other',
}
```

- [ ] **Step 3: Add `documentsBytesMonthly` to `PLAN_LIMITS`**

In `packages/shared-types/src/index.ts`, update the `PLAN_LIMITS` type signature (line 475) and values:

Change the type from:
```typescript
export const PLAN_LIMITS: Record<SubscriptionPlan, { patients: number | null; sessions: number | null; aiSummaries: number; videoConsultations: number | null; courses: number | null; expenses: number | null }> = {
```
to:
```typescript
export const PLAN_LIMITS: Record<SubscriptionPlan, { patients: number | null; sessions: number | null; aiSummaries: number; videoConsultations: number | null; courses: number | null; expenses: number | null; documentsBytesMonthly: number | null }> = {
```

Update each plan's values — add `documentsBytesMonthly`:
- `FREE`: `documentsBytesMonthly: 0` (disabled)
- `STARTER`: `documentsBytesMonthly: 52428800` (50 MiB)
- `PRO`: `documentsBytesMonthly: null` (unlimited)
- `CLINIC`: `documentsBytesMonthly: null` (unlimited)

- [ ] **Step 4: Build shared-types**

Run: `cd packages/shared-types && npm run build`
Expected: Clean build, `dist/index.js` updated.

- [ ] **Step 5: Generate Prisma migration**

Run: `cd apps/api && npx prisma migrate dev --name add_shared_documents`
Expected: Migration created in `prisma/migrations/`, applied to local DB.

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma/ packages/shared-types/
git commit -m "feat(db): add SharedDocument model + DocumentCategory enum + PLAN_LIMITS documents quota"
```

---

### Task 2: Billing Integration — Feature Gating + Quota Check

**Files:**
- Modify: `apps/api/src/billing/decorators/require-plan.decorator.ts:7`
- Modify: `apps/api/src/billing/guards/subscription.guard.ts:83-85`
- Modify: `apps/api/src/billing/subscription.service.ts`

- [ ] **Step 1: Add `'documents'` to `BillingFeature` type**

In `apps/api/src/billing/decorators/require-plan.decorator.ts`, line 7, change:

```typescript
export type BillingFeature = 'patients' | 'sessions' | 'ai_summary' | 'ai_exercise' | 'video' | 'courses' | 'expenses';
```
to:
```typescript
export type BillingFeature = 'patients' | 'sessions' | 'ai_summary' | 'ai_exercise' | 'video' | 'courses' | 'expenses' | 'documents';
```

- [ ] **Step 2: Add `documents` branch in `SubscriptionGuard`**

In `apps/api/src/billing/guards/subscription.guard.ts`, after line 84 (`} else if (requiredFeature === 'expenses') {` block), add:

```typescript
    } else if (requiredFeature === 'documents') {
      await this.subscriptionService.checkDocumentQuota(psy.id);
    }
```

- [ ] **Step 3: Add `checkDocumentQuota()` in `SubscriptionService`**

In `apps/api/src/billing/subscription.service.ts`, after the `checkExpenseLimit` method (after line ~331), add:

```typescript
  async checkDocumentQuota(psychologistId: string, additionalBytes = 0): Promise<void> {
    const sub = await this.prisma.subscription.findUnique({ where: { psychologistId } });
    const plan = (sub?.plan ?? SubscriptionPlan.FREE) as SubscriptionPlan;
    const limits = PLAN_LIMITS[plan];

    // 0 = disabled (Free plan)
    if (limits.documentsBytesMonthly === 0) {
      throw new ForbiddenException({
        code: 'DOCUMENTS_DISABLED',
        currentPlan: plan,
        message: 'Le partage de documents nécessite le plan Solo ou supérieur.',
      });
    }

    // null = unlimited
    if (limits.documentsBytesMonthly === null) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.prisma.sharedDocument.aggregate({
      where: {
        psychologistId,
        deletedAt: null,
        createdAt: { gte: startOfMonth },
      },
      _sum: { fileSize: true },
    });

    const currentUsage = result._sum.fileSize ?? 0;

    if (currentUsage + additionalBytes > limits.documentsBytesMonthly) {
      const usedMB = Math.round(currentUsage / 1024 / 1024);
      const limitMB = Math.round(limits.documentsBytesMonthly / 1024 / 1024);
      throw new ForbiddenException({
        code: 'DOCUMENT_QUOTA_EXCEEDED',
        currentPlan: plan,
        currentUsageBytes: currentUsage,
        limitBytes: limits.documentsBytesMonthly,
        message: `Quota documents dépassé (${usedMB}/${limitMB} Mo). Passez au plan Pro pour un stockage illimité.`,
      });
    }
  }
```

Note: The guard calls `checkDocumentQuota(psy.id)` without `additionalBytes` — this only checks if the plan is enabled (not Free). The actual size check happens in `DocumentsService.share()` which calls `checkDocumentQuota(psyId, file.size)` directly.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/billing/
git commit -m "feat(billing): add documents feature gating + quota check"
```

---

### Task 3: DocumentsModule — Service + Controller (Backend Core)

**Files:**
- Create: `apps/api/src/documents/documents.module.ts`
- Create: `apps/api/src/documents/documents.service.ts`
- Create: `apps/api/src/documents/documents.controller.ts`
- Create: `apps/api/src/documents/dto/share-document.dto.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create `share-document.dto.ts`**

Create `apps/api/src/documents/dto/share-document.dto.ts`:

```typescript
import { IsUUID, IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DocumentCategoryDto {
  EXERCISE = 'exercise',
  ADMINISTRATIVE = 'administrative',
  SESSION_REPORT = 'session_report',
  OTHER = 'other',
}

export class ShareDocumentDto {
  @ApiProperty({ example: 'uuid-of-patient' })
  @IsUUID()
  patientId!: string;

  @ApiProperty({ enum: DocumentCategoryDto })
  @IsEnum(DocumentCategoryDto)
  category!: DocumentCategoryDto;

  @ApiPropertyOptional({ example: 'Voici la fiche de relaxation' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  message?: string;
}
```

- [ ] **Step 2: Create `documents.service.ts`**

Create `apps/api/src/documents/documents.service.ts`:

```typescript
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { AuditService } from '../common/audit.service';
import { SubscriptionService } from '../billing/subscription.service';
import { ShareDocumentDto } from './dto/share-document.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import type { Request } from 'express';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.oasis.opendocument.text', // odt
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MiB
const UPLOAD_BASE = '/uploads/documents';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async share(
    userId: string,
    dto: ShareDocumentDto,
    file: Express.Multer.File,
    req?: Request,
  ) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    // Validate patient belongs to psy
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, psychologistId: psy.id },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');

    // Validate file
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Type de fichier non autorisé. Types acceptés : PDF, JPEG, PNG, DOCX, ODT.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Fichier trop volumineux (max 10 Mo).');
    }

    // Check quota (with file size)
    await this.subscriptionService.checkDocumentQuota(psy.id, file.size);

    // Sanitize filename (remove path traversal chars)
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileId = randomUUID();
    const dirPath = path.join(UPLOAD_BASE, psy.id, dto.patientId);
    const filePath = path.join(dirPath, `${fileId}_${safeName}`);

    // Verify resolved path is within base directory
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(UPLOAD_BASE))) {
      throw new BadRequestException('Chemin de fichier invalide');
    }

    // Write file to disk
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    // Encrypt message if present
    const encryptedMessage = dto.message
      ? this.encryption.encrypt(dto.message)
      : null;

    // Create DB entry
    const doc = await this.prisma.sharedDocument.create({
      data: {
        psychologistId: psy.id,
        patientId: dto.patientId,
        fileName: file.originalname,
        filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        category: dto.category,
        message: encryptedMessage,
      },
    });

    // Audit log
    await this.audit.log({
      actorId: userId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'document',
      entityId: doc.id,
      metadata: { patientId: dto.patientId, fileName: file.originalname },
      req,
    });

    return {
      id: doc.id,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      category: doc.category,
      message: dto.message ?? null,
      createdAt: doc.createdAt,
    };
  }

  async findAll(userId: string, patientId?: string, page = 1, limit = 20) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const where = {
      psychologistId: psy.id,
      deletedAt: null,
      ...(patientId ? { patientId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.sharedDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          category: true,
          message: true,
          downloadedAt: true,
          createdAt: true,
          patient: { select: { id: true, name: true } },
        },
      }),
      this.prisma.sharedDocument.count({ where }),
    ]);

    return {
      data: data.map((d) => ({
        ...d,
        message: this.safeDecrypt(d.message),
      })),
      total,
      page,
      limit,
    };
  }

  async findOne(userId: string, docId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const doc = await this.prisma.sharedDocument.findFirst({
      where: { id: docId, psychologistId: psy.id, deletedAt: null },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        category: true,
        message: true,
        downloadedAt: true,
        createdAt: true,
        patient: { select: { id: true, name: true } },
      },
    });
    if (!doc) throw new NotFoundException('Document introuvable');

    return {
      ...doc,
      message: this.safeDecrypt(doc.message),
    };
  }

  private safeDecrypt(value: string | null): string | null {
    if (!value) return null;
    try {
      return this.encryption.decrypt(value);
    } catch (err) {
      this.logger.warn(`Failed to decrypt document message: ${err}`);
      return null;
    }
  }

  async softDelete(userId: string, docId: string, req?: Request) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const doc = await this.prisma.sharedDocument.findFirst({
      where: { id: docId, psychologistId: psy.id, deletedAt: null },
    });
    if (!doc) throw new NotFoundException('Document introuvable');

    // Delete physical file (ignore if already missing)
    try {
      await fs.unlink(doc.filePath);
    } catch (err) {
      this.logger.warn(`Physical file not found for document ${docId}: ${doc.filePath}`);
    }

    // Soft delete in DB
    await this.prisma.sharedDocument.update({
      where: { id: docId },
      data: { deletedAt: new Date() },
    });

    // Audit log
    await this.audit.log({
      actorId: userId,
      actorType: 'psychologist',
      action: 'DELETE',
      entityType: 'document',
      entityId: docId,
      req,
    });

    return { deleted: true };
  }

  /**
   * RGPD purge — delete all documents for a patient (called from PatientsService.purge)
   */
  async purgePatientDocuments(psychologistId: string, patientId: string): Promise<void> {
    const docs = await this.prisma.sharedDocument.findMany({
      where: { psychologistId, patientId },
      select: { id: true, filePath: true },
    });

    // Delete physical files
    for (const doc of docs) {
      try {
        await fs.unlink(doc.filePath);
      } catch {
        this.logger.warn(`RGPD purge: file not found ${doc.filePath}`);
      }
    }

    // Hard delete DB rows
    await this.prisma.sharedDocument.deleteMany({
      where: { psychologistId, patientId },
    });

    this.logger.log(`[RGPD] Purged ${docs.length} documents for patient ${patientId}`);
  }
}
```

- [ ] **Step 3: Create `documents.controller.ts`**

Create `apps/api/src/documents/documents.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('multer');
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { ShareDocumentDto } from './dto/share-document.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { RequireFeature } from '../billing/decorators/require-plan.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import type { Request } from 'express';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('share')
  @RequireFeature('documents')
  @UseGuards(SubscriptionGuard)
  @ApiOperation({ summary: 'Partager un document avec un patient' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  share(
    @CurrentUser() user: KeycloakUser,
    @Body() dto: ShareDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.documentsService.share(user.sub, dto, file, req);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les documents partagés' })
  findAll(
    @CurrentUser() user: KeycloakUser,
    @Query('patientId') patientId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.documentsService.findAll(
      user.sub,
      patientId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un document partagé' })
  findOne(
    @CurrentUser() user: KeycloakUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documentsService.findOne(user.sub, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un document partagé' })
  remove(
    @CurrentUser() user: KeycloakUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.documentsService.softDelete(user.sub, id, req);
  }
}
```

- [ ] **Step 4: Create `documents.module.ts`**

Create `apps/api/src/documents/documents.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [BillingModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
```

- [ ] **Step 5: Register `DocumentsModule` in `AppModule`**

In `apps/api/src/app.module.ts`, add import:

```typescript
import { DocumentsModule } from './documents/documents.module';
```

Add `DocumentsModule` to the `imports` array (after `RecurringExpensesModule`).

- [ ] **Step 6: Verify compilation**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/documents/ apps/api/src/app.module.ts
git commit -m "feat(documents): add DocumentsModule — share, list, detail, delete endpoints"
```

---

### Task 4: Patient Portal — Document Endpoints (Backend)

**Files:**
- Modify: `apps/api/src/patient-portal/patient-portal.module.ts`
- Modify: `apps/api/src/patient-portal/patient-portal.controller.ts`
- Modify: `apps/api/src/patient-portal/patient-portal.service.ts`

- [ ] **Step 1: Import `DocumentsModule` in `PatientPortalModule`**

In `apps/api/src/patient-portal/patient-portal.module.ts`, add:

```typescript
import { DocumentsModule } from '../documents/documents.module';
```

Add `DocumentsModule` to the `imports` array.

- [ ] **Step 2: Add document methods to `PatientPortalService`**

In `apps/api/src/patient-portal/patient-portal.service.ts`, add these methods:

```typescript
  // ─── DOCUMENTS ─────────────────────────────────────────────────────────────

  private safeDecryptMessage(value: string | null): string | null {
    if (!value) return null;
    try {
      return this.encryption.decrypt(value);
    } catch (err) {
      return null;
    }
  }

  async getDocuments(patientId: string) {
    const docs = await this.prisma.sharedDocument.findMany({
      where: { patientId, deletedAt: null },
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

    return docs.map((d) => ({
      ...d,
      message: this.safeDecryptMessage(d.message),
    }));
  }

  async downloadDocument(patientId: string, docId: string, userId: string, req?: Request) {
    const doc = await this.prisma.sharedDocument.findFirst({
      where: { id: docId, patientId, deletedAt: null },
    });
    if (!doc) throw new NotFoundException('Document introuvable');

    // Defense-in-depth: verify file path is within upload base directory
    const resolvedPath = require('path').resolve(doc.filePath);
    if (!resolvedPath.startsWith(require('path').resolve('/uploads/documents'))) {
      throw new ForbiddenException('Chemin de fichier invalide');
    }

    // Mark first download
    if (!doc.downloadedAt) {
      await this.prisma.sharedDocument.update({
        where: { id: docId },
        data: { downloadedAt: new Date() },
      });
    }

    // Audit log
    await this.audit.log({
      actorId: userId,
      actorType: 'patient',
      action: 'READ',
      entityType: 'document',
      entityId: docId,
      req,
    });

    return {
      filePath: doc.filePath,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
    };
  }
```

Add `import type { Request } from 'express';` at top if not present.

- [ ] **Step 3: Add document endpoints to `PatientPortalController`**

In `apps/api/src/patient-portal/patient-portal.controller.ts`, add imports:

```typescript
import { Res, Req, StreamableFile } from '@nestjs/common';
import type { Response, Request } from 'express';
import { createReadStream } from 'fs';
```

Add these endpoints after the assessments section:

```typescript
  // ─── DOCUMENTS ───────────────────────────────────────────────────

  @Get('documents')
  @ApiOperation({ summary: 'Liste des documents partagés' })
  getDocuments(@CurrentPatient() user: PatientUser) {
    return this.service.getDocuments(user.patientId);
  }

  @Get('documents/:id/download')
  @ApiOperation({ summary: 'Télécharger un document' })
  async downloadDocument(
    @CurrentPatient() user: PatientUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const { filePath, fileName, mimeType } = await this.service.downloadDocument(
      user.patientId,
      id,
      user.sub,
      req,
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    });

    const stream = createReadStream(filePath);
    return new StreamableFile(stream);
  }
```

- [ ] **Step 4: Add `unreadDocuments` to dashboard response**

In `apps/api/src/patient-portal/patient-portal.service.ts`, in the `getDashboard()` method, add to the `Promise.all` array:

```typescript
      // Documents non téléchargés
      this.prisma.sharedDocument.count({
        where: { patientId, deletedAt: null, downloadedAt: null },
      }),
```

Destructure the new value and add it to the return:

```typescript
    const [recentMoods, exercises, nextAppointment, recentJournal, pendingAssessmentsCount, unreadDocuments] = await Promise.all([
```

Add to the return object:

```typescript
      unreadDocuments,
```

- [ ] **Step 5: Verify compilation**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/patient-portal/
git commit -m "feat(patient-portal): add document list + download endpoints + unread count in dashboard"
```

---

### Task 5: Email Notification + RGPD Purge Integration

**Files:**
- Modify: `apps/api/src/notifications/email.service.ts`
- Modify: `apps/api/src/documents/documents.service.ts`
- Modify: `apps/api/src/patients/patients.service.ts`

- [ ] **Step 1: Add `sendDocumentShared()` to `EmailService`**

In `apps/api/src/notifications/email.service.ts`, add this method (follow the pattern of `sendMoodLogged`):

```typescript
  async sendDocumentShared(
    to: string,
    data: {
      psychologistName: string;
      documentName: string;
      category: string;
      message?: string;
      portalUrl: string;
    },
  ): Promise<void> {
    const categoryLabels: Record<string, string> = {
      exercise: 'Exercice thérapeutique',
      administrative: 'Document administratif',
      session_report: 'Compte-rendu de séance',
      other: 'Document',
    };
    const categoryLabel = categoryLabels[data.category] ?? 'Document';

    const html = emailLayout(
      'Nouveau document partagé',
      `
      <span class="badge badge-success">${categoryLabel}</span>
      <h1>${data.psychologistName} vous a partagé un document</h1>
      <div class="info-box">
        <p style="margin: 0; font-weight: 600;">${data.documentName}</p>
      </div>
      ${data.message ? `<p>${data.message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}</p>` : ''}
      <p>Connectez-vous à votre espace patient pour le consulter et le télécharger.</p>
      <a href="${data.portalUrl}" class="btn">Voir mes documents</a>
      <p style="font-size: 13px; color: #6B7280; margin-top: 24px;">
        Pour des raisons de sécurité, les documents ne sont accessibles qu&apos;après authentification.
      </p>
      `,
    );

    await this.send(to, `${data.psychologistName} vous a partagé un document`, html, 'sendDocumentShared');
  }
```

- [ ] **Step 2: Trigger email + notification after document share**

In `apps/api/src/documents/documents.service.ts`, add injection of `EmailService` and `NotificationsService`:

Add to constructor imports:
```typescript
import { EmailService } from '../notifications/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
```

Add to constructor:
```typescript
    private readonly emailService: EmailService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
```

At the end of the `share()` method (after audit log), add:

```typescript
    // Email notification (skip gracefully if no email)
    if (patient.email) {
      const portalUrl = `${this.config.get('FRONTEND_URL') ?? 'https://app.psylib.eu'}/patient-portal/documents`;
      await this.emailService.sendDocumentShared(patient.email, {
        psychologistName: psy.name,
        documentName: file.originalname,
        category: dto.category,
        message: dto.message,
        portalUrl,
      }).catch((err) => {
        this.logger.warn(`Failed to send document notification email: ${err.message}`);
      });
    }

    // In-app notification (if patient has a user account)
    if (patient.userId) {
      await this.notifications.createAndDispatch(
        patient.userId,
        'document_shared',
        'Nouveau document',
        `${psy.name} vous a partagé un document : ${file.originalname}`,
        { documentId: doc.id },
      ).catch((err) => {
        this.logger.warn(`Failed to send document notification: ${err.message}`);
      });
    }
```

Update the patient query in `share()` to also select `userId`:
```typescript
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, psychologistId: psy.id },
      select: { id: true, name: true, email: true, userId: true },
    });
```

Update `DocumentsModule` imports to add `NotificationsModule`:
```typescript
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [BillingModule, NotificationsModule],
  // ...
})
```

- [ ] **Step 3: Hook RGPD purge to delete document files**

In `apps/api/src/patients/patients.service.ts`, inject `DocumentsService`:

Add import:
```typescript
import { DocumentsService } from '../documents/documents.service';
```

Add to constructor:
```typescript
    private readonly documentsService: DocumentsService,
```

In the `purge()` method, **before** the `prisma.patient.delete()` call, add:

```typescript
    // Delete shared documents files before cascade delete
    await this.documentsService.purgePatientDocuments(psy.id, patientId);
```

In `PatientsModule`, import `DocumentsModule`:
```typescript
import { DocumentsModule } from '../documents/documents.module';
```
Add to `imports` array.

- [ ] **Step 4: Verify compilation**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/documents/ apps/api/src/notifications/ apps/api/src/patients/
git commit -m "feat(documents): add email notification, in-app notification, RGPD purge integration"
```

---

### Task 6: Frontend — Patient Portal API Client + Documents Page

**Files:**
- Modify: `apps/web/src/lib/api/patient-portal.ts`
- Create: `apps/web/src/app/(patient-portal)/patient-portal/documents/page.tsx`
- Modify: `apps/web/src/app/(patient-portal)/layout.tsx`

- [ ] **Step 1: Add types and API methods to patient-portal client**

In `apps/web/src/lib/api/patient-portal.ts`, add the `SharedDocument` interface after the existing interfaces:

```typescript
export interface SharedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: 'exercise' | 'administrative' | 'session_report' | 'other';
  message: string | null;
  downloadedAt: string | null;
  createdAt: string;
}
```

Update `PatientDashboard` interface to add:
```typescript
  unreadDocuments: number;
```

Add API methods to the `patientPortalApi` object:

```typescript
  getDocuments: (token: string) => fetchPortal<SharedDocument[]>('/documents', token),

  downloadDocument: async (token: string, id: string) => {
    const res = await fetch(`${API}/api/v1/patient-portal/documents/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const blob = await res.blob();
    const contentDisposition = res.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="?(.+?)"?$/);
    const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : 'document';
    // Trigger browser download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
```

- [ ] **Step 2: Create patient portal documents page**

Create `apps/web/src/app/(patient-portal)/patient-portal/documents/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { patientPortalApi, type SharedDocument } from '@/lib/api/patient-portal';
import { FileText } from 'lucide-react';

const CATEGORY_LABELS: Record<SharedDocument['category'], string> = {
  exercise: 'Exercice',
  administrative: 'Administratif',
  session_report: 'Compte-rendu',
  other: 'Autre',
};

const CATEGORY_COLORS: Record<SharedDocument['category'], string> = {
  exercise: 'bg-purple-50 text-purple-700 border-purple-200',
  administrative: 'bg-blue-50 text-blue-700 border-blue-200',
  session_report: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  other: 'bg-slate-50 text-slate-600 border-slate-200',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function DocumentCard({
  doc,
  onDownload,
}: {
  doc: SharedDocument;
  onDownload: (id: string) => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const isNew = !doc.downloadedAt;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownload(doc.id);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-4 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-900 truncate">{doc.fileName}</h3>
            {isNew && (
              <span className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5">
                Nouveau
              </span>
            )}
            <span className={`text-xs border rounded-full px-2 py-0.5 ${CATEGORY_COLORS[doc.category]}`}>
              {CATEGORY_LABELS[doc.category]}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {formatFileSize(doc.fileSize)} &middot;{' '}
            {new Date(doc.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          {doc.message && (
            <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-lg px-3 py-2">
              {doc.message}
            </p>
          )}
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="shrink-0 text-xs bg-[#3D52A0] text-white rounded-lg px-3 py-1.5 hover:bg-[#2d3f7c] transition-colors disabled:opacity-60"
        >
          {downloading ? '...' : 'Télécharger'}
        </button>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    patientPortalApi
      .getDocuments(session.accessToken)
      .then(setDocuments)
      .catch(() => setError('Impossible de charger vos documents.'))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  const handleDownload = async (id: string) => {
    if (!session?.accessToken) return;
    await patientPortalApi.downloadDocument(session.accessToken, id);
    // Mark as downloaded locally
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, downloadedAt: new Date().toISOString() } : d,
      ),
    );
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3 pb-24">
        <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-24">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mes documents</h1>
        <p className="text-sm text-slate-500 mt-0.5">Documents partagés par votre psychologue</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {documents.length === 0 && !error && (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
          <FileText size={32} className="mx-auto text-slate-400 mb-1" />
          <p className="mt-3 text-sm text-slate-500">Aucun document pour le moment.</p>
          <p className="text-xs text-slate-400 mt-1">
            Votre psychologue n&apos;a pas encore partagé de documents.
          </p>
        </div>
      )}

      {documents.length > 0 && (
        <div className="space-y-3">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onDownload={handleDownload} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add "Documents" to patient portal bottom nav**

In `apps/web/src/app/(patient-portal)/layout.tsx`, update the navigation array (line ~37) to add "Documents" as the 5th item:

```typescript
        {[
          { label: 'Accueil', href: '/patient-portal' },
          { label: 'Humeur', href: '/patient-portal/mood' },
          { label: 'Exercices', href: '/patient-portal/exercises' },
          { label: 'Journal', href: '/patient-portal/journal' },
          { label: 'Documents', href: '/patient-portal/documents' },
        ].map((item) => (
```

- [ ] **Step 4: Add "Documents récents" widget to patient portal dashboard**

In `apps/web/src/app/(patient-portal)/patient-portal/page.tsx`, import Link if not present, then add a documents widget block. In the dashboard grid, after the existing sections, add:

```tsx
      {/* Documents récents */}
      {data && data.unreadDocuments > 0 && (
        <Link
          href="/patient-portal/documents"
          className="rounded-2xl border bg-white p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {data.unreadDocuments} nouveau{data.unreadDocuments > 1 ? 'x' : ''} document{data.unreadDocuments > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-slate-500">Partagé{data.unreadDocuments > 1 ? 's' : ''} par votre psychologue</p>
            </div>
          </div>
        </Link>
      )}
```

Add missing imports at top: `import { FileText } from 'lucide-react';` and `import Link from 'next/link';`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/api/patient-portal.ts apps/web/src/app/\(patient-portal\)/
git commit -m "feat(patient-portal): add documents page + download + nav link + dashboard widget"
```

---

### Task 7: Frontend — Psychologist Patient Detail Documents Tab + Share Dialog

**Files:**
- Create: `apps/web/src/components/patients/patient-documents-tab.tsx`
- Create: `apps/web/src/components/patients/share-document-dialog.tsx`
- Modify: `apps/web/src/components/patients/patient-detail.tsx`

- [ ] **Step 1: Create the Share Document Dialog**

Create `apps/web/src/components/patients/share-document-dialog.tsx`:

```tsx
'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { X, Upload } from 'lucide-react';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

const CATEGORIES = [
  { value: 'exercise', label: 'Exercice thérapeutique' },
  { value: 'administrative', label: 'Administratif' },
  { value: 'session_report', label: 'Compte-rendu de séance' },
  { value: 'other', label: 'Autre' },
];

interface ShareDocumentDialogProps {
  patientId: string;
  patientName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ShareDocumentDialog({
  patientId,
  patientName,
  open,
  onClose,
  onSuccess,
}: ShareDocumentDialogProps) {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('exercise');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  }, []);

  const handleSubmit = async () => {
    if (!file || !session?.accessToken) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);
    formData.append('category', category);
    if (message.trim()) formData.append('message', message.trim());

    try {
      const res = await fetch(`${API}/api/v1/documents/share`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Erreur ${res.status}`);
      }

      setFile(null);
      setMessage('');
      setCategory('exercise');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du partage');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl animate-in slide-in-from-right">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Partager un document</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Partager avec <span className="font-medium text-foreground">{patientName}</span>
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            {file ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} Mo
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Glissez un fichier ou</p>
                <label className="mt-2 inline-block cursor-pointer text-sm text-primary font-medium hover:underline">
                  Parcourir
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.docx,.odt"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setFile(f);
                    }}
                  />
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  PDF, JPEG, PNG, DOCX, ODT — max 10 Mo
                </p>
              </>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">
              Message (facultatif)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Voici la fiche de relaxation dont nous avons parlé"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              rows={3}
              maxLength={2000}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? 'Envoi en cours...' : 'Partager'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the Patient Documents Tab**

Create `apps/web/src/components/patients/patient-documents-tab.tsx`:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Trash2, Plus } from 'lucide-react';
import { ShareDocumentDialog } from './share-document-dialog';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

interface DocumentItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  message: string | null;
  downloadedAt: string | null;
  createdAt: string;
  patient: { id: string; name: string };
}

const CATEGORY_LABELS: Record<string, string> = {
  exercise: 'Exercice',
  administrative: 'Administratif',
  session_report: 'Compte-rendu',
  other: 'Autre',
};

const CATEGORY_VARIANTS: Record<string, 'default' | 'secondary' | 'success' | 'destructive'> = {
  exercise: 'default',
  administrative: 'secondary',
  session_report: 'success',
  other: 'secondary',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

interface PatientDocumentsTabProps {
  patientId: string;
  patientName: string;
}

export function PatientDocumentsTab({ patientId, patientName }: PatientDocumentsTabProps) {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(
        `${API}/api/v1/documents?patientId=${patientId}`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } },
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      setDocuments(json.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, patientId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (docId: string) => {
    if (!session?.accessToken || !confirm('Supprimer ce document ?')) return;
    setDeleting(docId);
    try {
      await fetch(`${API}/api/v1/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-16 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-16 rounded-lg bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">
          Documents
          {documents.length > 0 && (
            <span className="ml-2 text-sm text-muted-foreground font-normal">
              ({documents.length})
            </span>
          )}
        </h3>
        <Button size="sm" onClick={() => setShareOpen(true)}>
          <Plus size={14} />
          Partager un document
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <FileText size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Aucun document partagé</p>
          <p className="text-xs text-muted-foreground mt-1">
            Partagez des exercices, comptes-rendus ou documents administratifs.
          </p>
        </div>
      ) : (
        <ul className="rounded-xl border border-border bg-white overflow-hidden shadow-sm divide-y divide-border">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-4 p-4">
              <FileText size={20} className="shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.fileName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={CATEGORY_VARIANTS[doc.category] ?? 'secondary'}>
                    {CATEGORY_LABELS[doc.category] ?? doc.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(doc.fileSize)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs ${doc.downloadedAt ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {doc.downloadedAt ? 'Téléchargé' : 'Non lu'}
                </span>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  aria-label="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ShareDocumentDialog
        patientId={patientId}
        patientName={patientName}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onSuccess={fetchDocuments}
      />
    </section>
  );
}
```

- [ ] **Step 3: Add Documents section to patient detail page**

In `apps/web/src/components/patients/patient-detail.tsx`, add import:

```typescript
import { PatientDocumentsTab } from './patient-documents-tab';
```

Add the Documents section after the `PatientPortalSection` and before the "Séances récentes" section (~line 128, after `<PatientPortalSection patientId={patientId} />`):

```tsx
      {/* Documents partagés */}
      <PatientDocumentsTab patientId={patientId} patientName={patient.name} />
```

- [ ] **Step 4: Verify frontend compilation**

Run: `cd apps/web && npx next build` (or `npx tsc --noEmit`)
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/patients/ apps/web/src/app/\(patient-portal\)/
git commit -m "feat(frontend): add documents tab in patient detail + share dialog + patient portal page"
```

---

### Task 8: Final Integration Test + Deployment

**Files:** No new files — integration verification.

- [ ] **Step 1: Verify full API compilation**

Run: `cd apps/api && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 2: Verify full frontend compilation**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Verify shared-types build**

Run: `cd packages/shared-types && npm run build`
Expected: Clean build.

- [ ] **Step 4: Create `/uploads/documents` directory on VPS**

This must be done before deployment. The VPS needs the upload directory:
```bash
ssh -i ~/.ssh/psyscale_ovh ubuntu@51.178.31.68 "sudo mkdir -p /uploads/documents && sudo chown 1000:1000 /uploads/documents"
```

Note: Also ensure the Docker container mounts this volume. In `docker-compose.yml`, add volume: `- /uploads/documents:/uploads/documents`

- [ ] **Step 5: Deploy API to VPS**

Follow standard VPS deployment procedure (tar, scp, docker build, migrate, restart).

- [ ] **Step 6: Deploy frontend to Vercel**

Run: `npx vercel --prod --yes` from project root.

- [ ] **Step 7: Commit final state**

```bash
git add -A
git commit -m "feat(documents): complete document sharing implementation — psy share + patient portal download"
```

---

## Summary

| Task | Description | Dependencies |
|------|-------------|--------------|
| 1 | Prisma schema + migration + shared-types | None |
| 2 | Billing gating + quota check | Task 1 |
| 3 | DocumentsModule backend (CRUD) | Tasks 1, 2 |
| 4 | Patient portal endpoints | Tasks 1, 3 |
| 5 | Email notification + RGPD purge | Tasks 3, 4 |
| 6 | Frontend patient portal page | Task 4 |
| 7 | Frontend psy documents tab + dialog | Task 3 |
| 8 | Integration test + deploy | All |

Tasks 6 and 7 can be done in parallel once their backend dependencies are ready.
