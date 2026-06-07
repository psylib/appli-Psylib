# Earlier-Slot Waitlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un patient, en réservant en ligne, d'être prévenu par email si une place se libère plus tôt que son RDV — et de basculer dessus en un clic (1er arrivé, 1er servi), à la Doctolib.

**Architecture :** Trois champs sur `Appointment` (opt-in + jeton + anti-spam) et un toggle sur `Psychologist`. Un événement domaine `slot.freed` (émis à l'annulation et à la rebascule) est traité par un `EarlierSlotListener` qui email les RDV éligibles postérieurs au créneau libéré. Une page publique `/rebook/:token` recalcule les créneaux plus tôt au clic et déplace le RDV dans une transaction `Serializable` (anti-double-booking), réutilisant `AvailabilityService.getAvailableTimeslots`.

**Tech Stack :** NestJS + Prisma + PostgreSQL, `@nestjs/event-emitter` (déjà en place), Resend (EmailService), Next.js App Router (page publique token), Vitest/Supertest.

**Conventions du repo à respecter :**
- Préfixe API global : `api/v1` (donc un controller `public/rebook` ⇒ routes `/api/v1/public/rebook/...`).
- Migrations **idempotentes** (`ADD COLUMN IF NOT EXISTS`), appliquées au VPS manuellement (`prisma migrate deploy`).
- Routes publiques marquées `@Public()` + `@Throttle(...)`.
- Jetons : `randomUUID()` (pattern `cancelToken` existant).
- Déploiement : Vercel manuel (`npx vercel --prod --yes` depuis la racine) + API VPS rebuild manuel (la CI ne redéploie pas l'API).

---

## File Structure

**Backend (apps/api) :**
- `prisma/schema.prisma` — +3 champs `Appointment`, +1 champ `Psychologist` *(modifier)*
- `prisma/migrations/20260607_earlier_slot_waitlist/migration.sql` — migration idempotente *(créer)*
- `src/appointments/earlier-slot.service.ts` — matching + email des RDV éligibles + déplacement de RDV *(créer)*
- `src/appointments/earlier-slot.listener.ts` — `@OnEvent('slot.freed')` → délègue au service *(créer)*
- `src/appointments/earlier-slot.service.spec.ts` — tests unitaires matching/déplacement *(créer)*
- `src/appointments/appointments.service.ts` — émettre `slot.freed` au cancel *(modifier ~ligne 301)*
- `src/appointments/appointments.module.ts` — déclarer service + listener, importer AvailabilityModule *(modifier)*
- `src/public-booking/dto/public-booking.dto.ts` — +`notifyEarlierSlot?: boolean` *(modifier)*
- `src/public-booking/public-booking.service.ts` — persister `notifyEarlierSlot` + `earlierSlotToken` *(modifier ~ligne 433)*
- `src/rebook/rebook.controller.ts` — routes publiques token *(créer)*
- `src/rebook/rebook.service.ts` — GET infos + POST déplacement *(créer)*
- `src/rebook/rebook.module.ts` *(créer)*
- `src/rebook/rebook.service.spec.ts` *(créer)*
- `src/notifications/email.service.ts` — +`sendEarlierSlotAvailable(...)` *(modifier après ligne 1550)*
- `src/app.module.ts` — importer `RebookModule` *(modifier)*

**Frontend (apps/web) :**
- `src/lib/api/public-booking.ts` — +champ `notifyEarlierSlot` dans le payload de résa *(modifier)*
- composant de confirmation de résa publique — +checkbox *(modifier — fichier à localiser à la Task 9)*
- `src/lib/api/rebook.ts` — client API rebook *(créer)*
- `src/app/rebook/[token]/page.tsx` — page de rebascule *(créer)*
- réglages cabinet — +toggle `earlierSlotEnabled` *(modifier — fichier à localiser à la Task 11)*

---

## Task 1 : Schema Prisma + migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma:766-811` (Appointment) et le modèle `Psychologist`
- Create: `apps/api/prisma/migrations/20260607_earlier_slot_waitlist/migration.sql`

- [ ] **Step 1 : Ajouter les champs au modèle `Appointment`**

Dans `schema.prisma`, dans le bloc `model Appointment`, juste après la ligne `googleEventId String? @map("google_event_id")` (ligne 794) :

```prisma
  notifyEarlierSlot      Boolean                @default(false) @map("notify_earlier_slot")
  earlierSlotToken       String?                @unique @map("earlier_slot_token")
  earlierSlotNotifiedAt  DateTime?              @map("earlier_slot_notified_at")
```

- [ ] **Step 2 : Ajouter le toggle au modèle `Psychologist`**

Repérer le bloc `model Psychologist` (`grep -n "model Psychologist" apps/api/prisma/schema.prisma`). Ajouter parmi ses scalaires :

```prisma
  earlierSlotEnabled Boolean @default(true) @map("earlier_slot_enabled")
```

- [ ] **Step 3 : Écrire la migration SQL idempotente**

`apps/api/prisma/migrations/20260607_earlier_slot_waitlist/migration.sql` :

```sql
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "notify_earlier_slot" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "earlier_slot_token" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "earlier_slot_notified_at" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "appointments_earlier_slot_token_key" ON "appointments"("earlier_slot_token");
ALTER TABLE "psychologists" ADD COLUMN IF NOT EXISTS "earlier_slot_enabled" BOOLEAN NOT NULL DEFAULT true;
```

- [ ] **Step 4 : Générer le client Prisma**

Run: `cd apps/api && npx prisma generate`
Expected: « Generated Prisma Client » sans erreur ; `npx tsc --noEmit` ne signale aucune erreur sur `notifyEarlierSlot` / `earlierSlotEnabled`.

- [ ] **Step 5 : Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/20260607_earlier_slot_waitlist
git commit -m "feat(db): champs earlier-slot waitlist sur appointments + toggle psy"
```

---

## Task 2 : Email `sendEarlierSlotAvailable`

**Files:**
- Modify: `apps/api/src/notifications/email.service.ts` (après `sendWaitlistProposal`, ligne ~1550)

- [ ] **Step 1 : Ajouter la méthode**

Juste après la fin de `sendWaitlistProposal` (ligne 1550), insérer :

```typescript
  // ─── EARLIER SLOT — UNE PLACE PLUS TÔT S'EST LIBÉRÉE ──────────────────────

  async sendEarlierSlotAvailable(
    to: string,
    data: {
      patientName: string;
      psychologistName: string;
      currentDate: Date;
      claimUrl: string;
      unsubscribeUrl: string;
    },
  ): Promise<void> {
    const fmt = (d: Date) =>
      d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });

    const html = emailLayout(
      'Une place plus tôt est disponible',
      `<h1>Une place s'est libérée plus tôt&nbsp;!</h1>
      <p>Bonjour ${data.patientName},</p>
      <p>Une place s'est libérée plus tôt que votre rendez-vous actuel du <strong>${fmt(
        data.currentDate,
      )}</strong> avec ${data.psychologistName}.</p>
      <p>Si vous le souhaitez, vous pouvez avancer votre rendez-vous&nbsp;:</p>
      <div style="text-align:center;">
        <a href="${data.claimUrl}" class="btn">Voir les créneaux plus tôt</a>
      </div>
      <p style="font-size:14px;color:#6B7280">Premier arrivé, premier servi&nbsp;: la place peut être prise par un autre patient. Votre rendez-vous actuel reste réservé tant que vous ne le déplacez pas.</p>
      <p style="font-size:13px;color:#9CA3AF">Vous ne souhaitez plus être prévenu&nbsp;? <a href="${data.unsubscribeUrl}">Se désinscrire de ces alertes</a>.</p>`,
    );

    await this.send(to, `Une place plus tôt — ${data.psychologistName}`, html, 'sendEarlierSlotAvailable');
  }
```

- [ ] **Step 2 : Vérifier la compilation**

Run: `cd apps/api && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add apps/api/src/notifications/email.service.ts
git commit -m "feat(email): template sendEarlierSlotAvailable"
```

---

## Task 3 : `EarlierSlotService` — matching + notification

**Files:**
- Create: `apps/api/src/appointments/earlier-slot.service.ts`
- Create: `apps/api/src/appointments/earlier-slot.service.spec.ts`

Ce service ne dépend PAS de `AppointmentsService` (évite les cycles). Il reçoit : `PrismaService`, `AvailabilityService`, `EmailService`, `ConfigService`, plus un `EventEmitter2` (pour la cascade au déplacement — utilisé en Task 6).

- [ ] **Step 1 : Écrire le test de matching (échoue)**

`apps/api/src/appointments/earlier-slot.service.spec.ts` :

```typescript
import { EarlierSlotService } from './earlier-slot.service';

describe('EarlierSlotService.notifyFreedSlot', () => {
  const psyId = 'psy-1';
  const freedAt = new Date('2026-07-01T09:00:00.000Z');

  function build(overrides: {
    eligible?: any[];
    psy?: any;
    slots?: Date[];
  }) {
    const prisma = {
      psychologist: { findUnique: jest.fn().mockResolvedValue(overrides.psy ?? { id: psyId, name: 'Dr X', earlierSlotEnabled: true }) },
      appointment: {
        findMany: jest.fn().mockResolvedValue(overrides.eligible ?? []),
        update: jest.fn().mockResolvedValue({}),
      },
      patient: { findUnique: jest.fn().mockResolvedValue({ name: 'Alice', email: 'alice@example.com' }) },
    } as any;
    const availability = {
      getAvailableTimeslots: jest.fn().mockResolvedValue(overrides.slots ?? [freedAt]),
    } as any;
    const email = { sendEarlierSlotAvailable: jest.fn().mockResolvedValue(undefined) } as any;
    const config = { get: jest.fn().mockReturnValue('https://psylib.eu') } as any;
    const emitter = { emit: jest.fn() } as any;
    const svc = new EarlierSlotService(prisma, availability, email, config, emitter);
    return { svc, prisma, availability, email };
  }

  it('emails an eligible later appointment when the freed slot fits its duration', async () => {
    const { svc, email, prisma } = build({
      eligible: [
        { id: 'a1', patientId: 'p1', scheduledAt: new Date('2026-07-10T10:00:00.000Z'), duration: 50, earlierSlotToken: 'tok-1' },
      ],
      slots: [freedAt],
    });

    await svc.notifyFreedSlot(psyId, freedAt);

    expect(email.sendEarlierSlotAvailable).toHaveBeenCalledTimes(1);
    expect(email.sendEarlierSlotAvailable).toHaveBeenCalledWith(
      'alice@example.com',
      expect.objectContaining({ claimUrl: 'https://psylib.eu/rebook/tok-1' }),
    );
    expect(prisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'a1' }, data: expect.objectContaining({ earlierSlotNotifiedAt: expect.any(Date) }) }),
    );
  });

  it('does NOT email when the freed slot does not actually fit (not in available timeslots)', async () => {
    const { svc, email } = build({
      eligible: [
        { id: 'a1', patientId: 'p1', scheduledAt: new Date('2026-07-10T10:00:00.000Z'), duration: 50, earlierSlotToken: 'tok-1' },
      ],
      slots: [], // availability says freedAt is not really free
    });

    await svc.notifyFreedSlot(psyId, freedAt);

    expect(email.sendEarlierSlotAvailable).not.toHaveBeenCalled();
  });

  it('does nothing when the psychologist has earlierSlotEnabled=false', async () => {
    const { svc, email, prisma } = build({
      psy: { id: psyId, name: 'Dr X', earlierSlotEnabled: false },
    });

    await svc.notifyFreedSlot(psyId, freedAt);

    expect(prisma.appointment.findMany).not.toHaveBeenCalled();
    expect(email.sendEarlierSlotAvailable).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2 : Lancer le test (échoue)**

Run: `cd apps/api && npx jest earlier-slot.service.spec --silent`
Expected: FAIL — `Cannot find module './earlier-slot.service'`.

- [ ] **Step 3 : Écrire le service**

`apps/api/src/appointments/earlier-slot.service.ts` :

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../common/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { EmailService } from '../notifications/email.service';

const NOTIFY_THROTTLE_MS = 6 * 60 * 60 * 1000; // 6h anti-spam

@Injectable()
export class EarlierSlotService {
  private readonly logger = new Logger(EarlierSlotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Un créneau `freedAt` vient de se libérer chez `psychologistId`.
   * Prévient par email les patients dont le RDV est POSTÉRIEUR à ce créneau
   * et qui ont opté pour l'alerte « place plus tôt ».
   */
  async notifyFreedSlot(psychologistId: string, freedAt: Date): Promise<void> {
    const now = new Date();
    if (freedAt.getTime() <= now.getTime()) return; // créneau passé

    const psy = await this.prisma.psychologist.findUnique({
      where: { id: psychologistId },
      select: { id: true, name: true, earlierSlotEnabled: true },
    });
    if (!psy || !psy.earlierSlotEnabled) return;

    const throttleBefore = new Date(now.getTime() - NOTIFY_THROTTLE_MS);

    const eligible = await this.prisma.appointment.findMany({
      where: {
        psychologistId,
        status: { in: ['scheduled', 'confirmed'] },
        notifyEarlierSlot: true,
        scheduledAt: { gt: freedAt }, // leur RDV est plus tard que le créneau libéré
        earlierSlotToken: { not: null },
        OR: [{ earlierSlotNotifiedAt: null }, { earlierSlotNotifiedAt: { lt: throttleBefore } }],
      },
      select: { id: true, patientId: true, scheduledAt: true, duration: true, earlierSlotToken: true },
    });
    if (eligible.length === 0) return;

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';

    for (const appt of eligible) {
      try {
        // Vérifie que freedAt accueille réellement la durée du RDV du patient.
        const windowEnd = new Date(freedAt.getTime() + appt.duration * 60000);
        const free = await this.availability.getAvailableTimeslots(
          psychologistId,
          freedAt,
          windowEnd,
          appt.duration,
        );
        const fits = free.some((d) => d.getTime() === freedAt.getTime());
        if (!fits) continue;

        if (!appt.patientId) continue;
        const patient = await this.prisma.patient.findUnique({
          where: { id: appt.patientId },
          select: { name: true, email: true },
        });
        if (!patient?.email) continue;

        await this.email.sendEarlierSlotAvailable(patient.email, {
          patientName: patient.name,
          psychologistName: psy.name,
          currentDate: appt.scheduledAt,
          claimUrl: `${frontendUrl}/rebook/${appt.earlierSlotToken}`,
          unsubscribeUrl: `${frontendUrl}/api/v1/public/rebook/${appt.earlierSlotToken}/unsubscribe`,
        });

        await this.prisma.appointment.update({
          where: { id: appt.id },
          data: { earlierSlotNotifiedAt: new Date() },
        });
      } catch (err) {
        this.logger.warn(
          `notifyFreedSlot: échec pour RDV ${appt.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}
```

- [ ] **Step 4 : Relancer le test (passe)**

Run: `cd apps/api && npx jest earlier-slot.service.spec --silent`
Expected: PASS (3 tests).

- [ ] **Step 5 : Commit**

```bash
git add apps/api/src/appointments/earlier-slot.service.ts apps/api/src/appointments/earlier-slot.service.spec.ts
git commit -m "feat(api): EarlierSlotService — matching + email des RDV plus tôt"
```

---

## Task 4 : `EarlierSlotListener` + câblage module + émission au cancel

**Files:**
- Create: `apps/api/src/appointments/earlier-slot.listener.ts`
- Modify: `apps/api/src/appointments/appointments.module.ts`
- Modify: `apps/api/src/appointments/appointments.service.ts:292-301` (émettre `slot.freed`)

- [ ] **Step 1 : Écrire le listener**

`apps/api/src/appointments/earlier-slot.listener.ts` :

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EarlierSlotService } from './earlier-slot.service';

interface SlotFreedEvent {
  psychologistId: string;
  freedAt: Date;
}

@Injectable()
export class EarlierSlotListener {
  private readonly logger = new Logger(EarlierSlotListener.name);

  constructor(private readonly earlierSlot: EarlierSlotService) {}

  @OnEvent('slot.freed')
  async handleSlotFreed(event: SlotFreedEvent): Promise<void> {
    try {
      await this.earlierSlot.notifyFreedSlot(event.psychologistId, new Date(event.freedAt));
    } catch (err) {
      this.logger.error(
        `handleSlotFreed failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
```

- [ ] **Step 2 : Déclarer service + listener dans le module appointments**

Dans `apps/api/src/appointments/appointments.module.ts`, ajouter les imports en tête :

```typescript
import { AvailabilityModule } from '../availability/availability.module';
import { EarlierSlotService } from './earlier-slot.service';
import { EarlierSlotListener } from './earlier-slot.listener';
```

Ajouter `AvailabilityModule` au tableau `imports` du `@Module`, et `EarlierSlotService`, `EarlierSlotListener` au tableau `providers`. (Si `AvailabilityModule` n'exporte pas `AvailabilityService`, l'ajouter à son tableau `exports` — vérifier `apps/api/src/availability/availability.module.ts`.)

- [ ] **Step 3 : Émettre `slot.freed` à l'annulation**

Dans `apps/api/src/appointments/appointments.service.ts`, juste après le bloc `this.eventEmitter.emit('appointment.cancelled', {...})` qui se termine ligne 301, ajouter :

```typescript
    // Earlier-slot waitlist : prévenir les patients dont le RDV est plus tard.
    this.eventEmitter.emit('slot.freed', {
      psychologistId: cancelled.psychologistId,
      freedAt: existing.scheduledAt,
    });
```

- [ ] **Step 4 : Vérifier compilation + suite appointments**

Run: `cd apps/api && npx tsc --noEmit && npx jest appointments --silent`
Expected: compilation OK ; les specs appointments existantes passent toujours.

- [ ] **Step 5 : Commit**

```bash
git add apps/api/src/appointments/earlier-slot.listener.ts apps/api/src/appointments/appointments.module.ts apps/api/src/appointments/appointments.service.ts
git commit -m "feat(api): listener slot.freed + emission au cancel"
```

---

## Task 5 : Opt-in à la réservation publique

**Files:**
- Modify: `apps/api/src/public-booking/dto/public-booking.dto.ts`
- Modify: `apps/api/src/public-booking/public-booking.service.ts:385-449`

- [ ] **Step 1 : Ajouter le champ au DTO**

Dans `public-booking.dto.ts`, ajouter avant la dernière accolade de la classe :

```typescript
  @IsOptional()
  @IsBoolean()
  notifyEarlierSlot?: boolean;
```

- [ ] **Step 2 : Générer le token + persister le flag**

Dans `public-booking.service.ts`, à la ligne 385 (`const cancelToken = randomUUID();`), ajouter juste en dessous :

```typescript
    const earlierSlotToken = dto.notifyEarlierSlot ? randomUUID() : null;
```

Puis, dans l'objet `data` du `tx.appointment.create({ data: {...} })` (lignes 434-447), ajouter ces deux champs :

```typescript
          notifyEarlierSlot: dto.notifyEarlierSlot === true,
          earlierSlotToken,
```

- [ ] **Step 3 : Vérifier compilation**

Run: `cd apps/api && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4 : Commit**

```bash
git add apps/api/src/public-booking/dto/public-booking.dto.ts apps/api/src/public-booking/public-booking.service.ts
git commit -m "feat(api): opt-in notifyEarlierSlot a la reservation publique"
```

---

## Task 6 : `RebookService` — infos + déplacement (cascade)

**Files:**
- Create: `apps/api/src/rebook/rebook.service.ts`
- Create: `apps/api/src/rebook/rebook.service.spec.ts`

Le service expose : `getByToken(token)`, `listEarlierSlots(token)`, `moveToSlot(token, newSlotIso)`, `unsubscribe(token)`.

- [ ] **Step 1 : Écrire les tests (échouent)**

`apps/api/src/rebook/rebook.service.spec.ts` :

```typescript
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RebookService } from './rebook.service';

describe('RebookService', () => {
  const current = new Date('2026-07-10T10:00:00.000Z');
  const earlier = new Date('2026-07-02T09:00:00.000Z');

  function build(opts: { appt?: any; slots?: Date[]; txAppt?: any } = {}) {
    const appt = opts.appt ?? {
      id: 'a1',
      psychologistId: 'psy-1',
      patientId: 'p1',
      scheduledAt: current,
      duration: 50,
      status: 'confirmed',
      earlierSlotToken: 'tok-1',
      notifyEarlierSlot: true,
      psychologist: { id: 'psy-1', name: 'Dr X', slug: 'dr-x' },
    };
    const tx = {
      appointment: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({ ...appt, scheduledAt: earlier }),
      },
    };
    const prisma = {
      appointment: {
        findFirst: jest.fn().mockResolvedValue(appt),
        update: jest.fn().mockResolvedValue(appt),
      },
      patient: { findUnique: jest.fn().mockResolvedValue({ name: 'Alice', email: 'a@x.fr' }) },
      $transaction: jest.fn(async (fn: any) => fn(tx)),
    } as any;
    const availability = { getAvailableTimeslots: jest.fn().mockResolvedValue(opts.slots ?? [earlier]) } as any;
    const email = { sendBookingReceivedToPatient: jest.fn().mockResolvedValue(undefined) } as any;
    const config = { get: jest.fn().mockReturnValue('https://psylib.eu') } as any;
    const emitter = { emit: jest.fn() } as any;
    const svc = new RebookService(prisma, availability, email, config, emitter);
    return { svc, prisma, availability, emitter, tx };
  }

  it('getByToken throws on unknown token', async () => {
    const { svc, prisma } = build();
    prisma.appointment.findFirst.mockResolvedValueOnce(null);
    await expect(svc.getByToken('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('listEarlierSlots returns only slots strictly before the current appointment', async () => {
    const later = new Date('2026-07-20T09:00:00.000Z');
    const { svc } = build({ slots: [earlier, later] });
    const res = await svc.listEarlierSlots('tok-1');
    expect(res.slots).toEqual([earlier.toISOString()]);
    expect(res.currentDate).toBe(current.toISOString());
  });

  it('moveToSlot rejects a slot not earlier than current', async () => {
    const { svc } = build();
    await expect(svc.moveToSlot('tok-1', current.toISOString())).rejects.toBeInstanceOf(BadRequestException);
  });

  it('moveToSlot updates the appointment and emits slot.freed for the old time', async () => {
    const { svc, emitter, tx } = build({ slots: [earlier] });
    await svc.moveToSlot('tok-1', earlier.toISOString());
    expect(tx.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'a1' }, data: expect.objectContaining({ scheduledAt: earlier }) }),
    );
    expect(emitter.emit).toHaveBeenCalledWith('slot.freed', { psychologistId: 'psy-1', freedAt: current });
  });
});
```

- [ ] **Step 2 : Lancer (échoue)**

Run: `cd apps/api && npx jest rebook.service.spec --silent`
Expected: FAIL — `Cannot find module './rebook.service'`.

- [ ] **Step 3 : Écrire le service**

`apps/api/src/rebook/rebook.service.ts` :

```typescript
import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class RebookService {
  private readonly logger = new Logger(RebookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async loadByToken(token: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { earlierSlotToken: token },
      include: { psychologist: { select: { id: true, name: true, slug: true } } },
    });
    if (!appt) throw new NotFoundException('Lien invalide ou expiré');
    return appt;
  }

  async getByToken(token: string) {
    const appt = await this.loadByToken(token);
    return {
      psychologistName: appt.psychologist.name,
      currentDate: appt.scheduledAt.toISOString(),
      duration: appt.duration,
      active: appt.status === 'scheduled' || appt.status === 'confirmed',
      notifyEarlierSlot: appt.notifyEarlierSlot,
    };
  }

  async listEarlierSlots(token: string) {
    const appt = await this.loadByToken(token);
    const now = new Date();
    const to = appt.scheduledAt;
    let slots: string[] = [];
    if (to.getTime() > now.getTime() && (appt.status === 'scheduled' || appt.status === 'confirmed')) {
      const free = await this.availability.getAvailableTimeslots(appt.psychologistId, now, to, appt.duration);
      slots = free.filter((d) => d.getTime() < to.getTime()).map((d) => d.toISOString());
    }
    return {
      psychologistName: appt.psychologist.name,
      currentDate: appt.scheduledAt.toISOString(),
      slots,
    };
  }

  async moveToSlot(token: string, newSlotIso: string) {
    const appt = await this.loadByToken(token);
    if (appt.status !== 'scheduled' && appt.status !== 'confirmed') {
      throw new BadRequestException('Ce rendez-vous ne peut plus être déplacé');
    }
    const newSlot = new Date(newSlotIso);
    if (isNaN(newSlot.getTime())) throw new BadRequestException('Créneau invalide');
    if (newSlot.getTime() >= appt.scheduledAt.getTime()) {
      throw new BadRequestException('Ce créneau n\'est pas plus tôt que votre rendez-vous actuel');
    }
    if (newSlot.getTime() <= Date.now()) throw new BadRequestException('Ce créneau est déjà passé');

    const oldDate = appt.scheduledAt;
    const duration = appt.duration;

    await this.prisma.$transaction(
      async (tx) => {
        // Anti-double-booking : aucun RDV non annulé ne doit chevaucher newSlot.
        const newEnd = new Date(newSlot.getTime() + duration * 60000);
        const windowStart = new Date(newSlot.getTime() - 24 * 60 * 60000);
        const candidates = await tx.appointment.findMany({
          where: {
            psychologistId: appt.psychologistId,
            id: { not: appt.id },
            status: { not: 'cancelled' },
            scheduledAt: { gte: windowStart, lt: newEnd },
          },
          select: { scheduledAt: true, duration: true },
        });
        const overlap = candidates.some((c) => {
          const cEnd = new Date(new Date(c.scheduledAt).getTime() + c.duration * 60000);
          return cEnd > newSlot;
        });
        if (overlap) throw new ConflictException('Ce créneau vient d\'être pris');

        await tx.appointment.update({
          where: { id: appt.id },
          data: { scheduledAt: newSlot, earlierSlotNotifiedAt: null },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    // L'ancienne heure se libère → cascade vers d'autres patients en attente.
    this.eventEmitter.emit('slot.freed', { psychologistId: appt.psychologistId, freedAt: oldDate });

    // Email de confirmation au patient.
    if (appt.patientId) {
      const patient = await this.prisma.patient.findUnique({
        where: { id: appt.patientId },
        select: { name: true, email: true },
      });
      const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
      if (patient?.email) {
        void this.email
          .sendBookingReceivedToPatient(patient.email, {
            patientName: patient.name,
            psychologistName: appt.psychologist.name,
            scheduledAt: newSlot,
            duration,
            cancelUrl: appt.cancelToken ? `${frontendUrl}/appointments/cancel/${appt.cancelToken}` : `${frontendUrl}/psy/${appt.psychologist.slug}`,
          })
          .catch((err) => this.logger.warn(`rebook confirmation email failed: ${(err as Error).message}`));
      }
    }

    return { success: true, scheduledAt: newSlot.toISOString() };
  }

  async unsubscribe(token: string) {
    const appt = await this.prisma.appointment.findFirst({ where: { earlierSlotToken: token } });
    if (!appt) throw new NotFoundException('Lien invalide');
    await this.prisma.appointment.update({
      where: { id: appt.id },
      data: { notifyEarlierSlot: false },
    });
    return { success: true };
  }
}
```

- [ ] **Step 4 : Relancer (passe)**

Run: `cd apps/api && npx jest rebook.service.spec --silent`
Expected: PASS (4 tests).

- [ ] **Step 5 : Commit**

```bash
git add apps/api/src/rebook/rebook.service.ts apps/api/src/rebook/rebook.service.spec.ts
git commit -m "feat(api): RebookService — listing creneaux plus tot + deplacement RDV"
```

---

## Task 7 : `RebookController` + `RebookModule` + câblage app

**Files:**
- Create: `apps/api/src/rebook/rebook.controller.ts`
- Create: `apps/api/src/rebook/rebook.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1 : Écrire le controller**

`apps/api/src/rebook/rebook.controller.ts` :

```typescript
import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RebookService } from './rebook.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Rebook (earlier slot)')
@Public()
@Controller('public/rebook')
export class RebookController {
  constructor(private readonly rebook: RebookService) {}

  @Get(':token')
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Infos du RDV + créneaux plus tôt disponibles' })
  async listSlots(@Param('token') token: string) {
    return this.rebook.listEarlierSlots(token);
  }

  @Post(':token')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Déplacer le RDV sur un créneau plus tôt' })
  async move(@Param('token') token: string, @Body() body: { newSlot?: string }) {
    if (!body?.newSlot) throw new BadRequestException('newSlot requis');
    return this.rebook.moveToSlot(token, body.newSlot);
  }

  @Get(':token/unsubscribe')
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Ne plus recevoir les alertes de place plus tôt' })
  async unsubscribe(@Param('token') token: string) {
    return this.rebook.unsubscribe(token);
  }
}
```

> Note : `listEarlierSlots` couvre aussi le besoin de `getByToken` côté front (renvoie `psychologistName`, `currentDate`, `slots`). On n'expose pas de route GET séparée pour `getByToken` afin de garder la surface minimale.

- [ ] **Step 2 : Écrire le module**

`apps/api/src/rebook/rebook.module.ts` :

```typescript
import { Module } from '@nestjs/common';
import { RebookController } from './rebook.controller';
import { RebookService } from './rebook.service';
import { AvailabilityModule } from '../availability/availability.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AvailabilityModule, NotificationsModule],
  controllers: [RebookController],
  providers: [RebookService],
})
export class RebookModule {}
```

> `EmailService` provient de `NotificationsModule` (vérifier qu'il est bien exporté ; `WaitlistModule`/`PublicBookingModule` l'utilisent déjà via ce module). `PrismaService`/`ConfigService`/`EventEmitter2` sont globaux.

- [ ] **Step 3 : Importer le module dans `app.module.ts`**

Ajouter `import { RebookModule } from './rebook/rebook.module';` en tête, et `RebookModule` au tableau `imports` du `@Module`.

- [ ] **Step 4 : Vérifier compilation + boot des tests**

Run: `cd apps/api && npx tsc --noEmit && npx jest rebook --silent`
Expected: compilation OK, specs rebook vertes.

- [ ] **Step 5 : Test d'intégration léger (controller + throttle)**

Ajouter dans `apps/api/src/rebook/rebook.service.spec.ts` un dernier test de bout-en-bout du flux unsubscribe :

```typescript
  it('unsubscribe sets notifyEarlierSlot=false', async () => {
    const { svc, prisma } = build();
    const res = await svc.unsubscribe('tok-1');
    expect(prisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { notifyEarlierSlot: false } }),
    );
    expect(res).toEqual({ success: true });
  });
```

Run: `cd apps/api && npx jest rebook --silent`
Expected: PASS.

- [ ] **Step 6 : Commit**

```bash
git add apps/api/src/rebook/rebook.controller.ts apps/api/src/rebook/rebook.module.ts apps/api/src/app.module.ts apps/api/src/rebook/rebook.service.spec.ts
git commit -m "feat(api): routes publiques /public/rebook/:token (listing, move, unsubscribe)"
```

---

## Task 8 : Suite API complète

- [ ] **Step 1 : Lancer toute la suite API**

Run: `cd apps/api && npx jest --silent`
Expected: tous les tests passent (les nouvelles specs incluses, aucune régression).

- [ ] **Step 2 : Lint/typecheck global API**

Run: `cd apps/api && npx tsc --noEmit`
Expected: aucune erreur.

---

## Task 9 : Frontend — checkbox opt-in à la réservation publique

**Files:**
- Modify: `apps/web/src/lib/api/public-booking.ts`
- Modify: composant de confirmation de résa publique *(localiser)*

- [ ] **Step 1 : Localiser le formulaire de confirmation**

Run: `cd apps/web && grep -rn "payOnline\|patientPhone\|scheduledAt" src/components src/app | grep -i book`
Identifier le composant qui construit le payload `PublicBookingDto` (étape « confirmer le RDV » de la page publique `/psy/[slug]`). Noter son chemin.

- [ ] **Step 2 : Ajouter le champ au type/payload API**

Dans `apps/web/src/lib/api/public-booking.ts`, repérer l'interface du payload de booking (celle contenant `payOnline?: boolean`) et y ajouter :

```typescript
  notifyEarlierSlot?: boolean;
```

S'assurer que la fonction qui POST `/public/psy/:slug/book` transmet bien ce champ (il fait partie de l'objet sérialisé — aucune transformation supplémentaire si l'objet est passé tel quel).

- [ ] **Step 3 : Ajouter la checkbox dans le composant de confirmation**

Dans le composant localisé au Step 1, ajouter un état et un contrôle près des options de RDV (ex. sous la sélection du créneau) :

```tsx
const [notifyEarlierSlot, setNotifyEarlierSlot] = useState(false);

// ... dans le JSX, avant le bouton de confirmation :
<label className="flex items-start gap-2 text-sm text-[#1E1B4B] cursor-pointer">
  <input
    type="checkbox"
    checked={notifyEarlierSlot}
    onChange={(e) => setNotifyEarlierSlot(e.target.checked)}
    className="mt-0.5 h-4 w-4 rounded border-border accent-[#3D52A0]"
  />
  <span>Prévenez-moi par email si une place se libère plus tôt</span>
</label>
```

Puis inclure `notifyEarlierSlot` dans l'objet envoyé à la fonction de booking.

- [ ] **Step 4 : Vérifier le build web**

Run: `cd apps/web && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 5 : Commit**

```bash
git add apps/web/src/lib/api/public-booking.ts apps/web/src/components apps/web/src/app
git commit -m "feat(web): checkbox 'prevenez-moi si une place se libere plus tot'"
```

---

## Task 10 : Frontend — page `/rebook/[token]`

**Files:**
- Create: `apps/web/src/lib/api/rebook.ts`
- Create: `apps/web/src/app/rebook/[token]/page.tsx`

- [ ] **Step 1 : Client API rebook**

`apps/web/src/lib/api/rebook.ts` :

```typescript
const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.psylib.eu/api/v1';

export interface RebookInfo {
  psychologistName: string;
  currentDate: string;
  slots: string[];
}

export async function fetchRebook(token: string): Promise<RebookInfo> {
  const res = await fetch(`${API}/public/rebook/${token}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Lien invalide ou expiré');
  return res.json();
}

export async function moveRebook(token: string, newSlot: string): Promise<{ success: boolean; scheduledAt: string }> {
  const res = await fetch(`${API}/public/rebook/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newSlot }),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.message ?? 'Impossible de déplacer le rendez-vous');
  }
  return res.json();
}
```

> Vérifier la valeur réelle de `NEXT_PUBLIC_API_URL` dans le repo (`grep -rn "NEXT_PUBLIC_API_URL" apps/web/src/lib/api | head`) et aligner le fallback ci-dessus sur celui des autres clients.

- [ ] **Step 2 : Page de rebascule**

`apps/web/src/app/rebook/[token]/page.tsx` :

```tsx
'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { fetchRebook, moveRebook, type RebookInfo } from '@/lib/api/rebook';

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RebookPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [info, setInfo] = useState<RebookInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    fetchRebook(token)
      .then(setInfo)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function pick(slot: string) {
    setMoving(slot);
    setError(null);
    try {
      const res = await moveRebook(token, slot);
      setDone(res.scheduledAt);
    } catch (e) {
      setError((e as Error).message);
      // Recharge les créneaux (celui-ci a pu être pris)
      fetchRebook(token).then(setInfo).catch(() => {});
    } finally {
      setMoving(null);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-[#1E1B4B]">Avancer mon rendez-vous</h1>

        {loading && <p className="mt-4 text-sm text-[#6B7280]">Chargement…</p>}

        {error && !done && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {done && (
          <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
            Votre rendez-vous est avancé au <strong>{fmt(done)}</strong>. Un email de confirmation vous a été envoyé.
          </div>
        )}

        {info && !done && (
          <>
            <p className="mt-3 text-sm text-[#6B7280]">
              Rendez-vous actuel avec <strong>{info.psychologistName}</strong> : {fmt(info.currentDate)}.
            </p>

            {info.slots.length === 0 ? (
              <p className="mt-6 text-sm text-[#6B7280]">
                Aucun créneau plus tôt n'est disponible pour le moment. Vous conservez votre rendez-vous actuel et resterez prévenu si une place se libère.
              </p>
            ) : (
              <>
                <p className="mt-6 text-sm font-medium text-[#1E1B4B]">Créneaux plus tôt disponibles :</p>
                <ul className="mt-3 space-y-2">
                  {info.slots.map((s) => (
                    <li key={s}>
                      <button
                        onClick={() => pick(s)}
                        disabled={moving !== null}
                        className="w-full rounded-lg border border-border px-4 py-3 text-left text-sm text-[#1E1B4B] hover:border-[#3D52A0] hover:bg-[#F1F0F9] disabled:opacity-50"
                      >
                        {moving === s ? 'Déplacement…' : fmt(s)}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 3 : Vérifier le build web**

Run: `cd apps/web && npx tsc --noEmit && npx next build --no-lint` *(ou la commande de build du repo ; si trop long, `npx tsc --noEmit` suffit pour le checkpoint)*
Expected: page `/rebook/[token]` compile sans erreur.

- [ ] **Step 4 : Commit**

```bash
git add apps/web/src/lib/api/rebook.ts apps/web/src/app/rebook
git commit -m "feat(web): page /rebook/[token] — choisir un creneau plus tot"
```

---

## Task 11 : Frontend — toggle réglages cabinet

**Files:**
- Modify: réglages cabinet *(localiser)* + son client API

- [ ] **Step 1 : Localiser la page réglages cabinet et son endpoint**

Run: `cd apps/web && grep -rln "minBreakMinutes\|defaultSessionDuration\|allowOnlinePayment" src/app src/lib`
La page `settings/practice` (ou équivalent) et le client API qui PUT le profil psy contiennent déjà des toggles de ce type. Identifier le endpoint backend correspondant (`grep -rn "allowOnlinePayment" apps/api/src/psychologists` ou module `settings`).

- [ ] **Step 2 : Exposer `earlierSlotEnabled` côté backend (DTO de mise à jour du profil)**

Dans le DTO de mise à jour du profil psy (celui qui contient `allowOnlinePayment` / `minBreakMinutes`), ajouter :

```typescript
  @IsOptional()
  @IsBoolean()
  earlierSlotEnabled?: boolean;
```

et s'assurer que le service de mise à jour du profil persiste ce champ (l'ajouter à l'objet `data` du `prisma.psychologist.update` s'il fait une projection explicite des champs ; sinon il passe déjà).

- [ ] **Step 3 : Ajouter le toggle dans l'UI réglages**

Près des autres toggles cabinet, ajouter (en suivant le composant Switch/Checkbox déjà utilisé dans la page) :

```tsx
<div className="flex items-center justify-between py-3">
  <div>
    <p className="text-sm font-medium text-[#1E1B4B]">Alertes « place plus tôt »</p>
    <p className="text-xs text-[#6B7280]">Proposer aux patients d'être prévenus si un créneau se libère avant leur rendez-vous.</p>
  </div>
  <input
    type="checkbox"
    checked={form.earlierSlotEnabled ?? true}
    onChange={(e) => setForm({ ...form, earlierSlotEnabled: e.target.checked })}
    className="h-5 w-5 accent-[#3D52A0]"
  />
</div>
```

Adapter `form`/`setForm` aux noms réels de l'état de la page. Inclure `earlierSlotEnabled` dans le payload de sauvegarde.

- [ ] **Step 4 : Vérifier compilation (web + api)**

Run: `cd apps/web && npx tsc --noEmit && cd ../api && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 5 : Commit**

```bash
git add apps/web/src apps/api/src
git commit -m "feat: toggle reglages 'alertes place plus tot' (defaut active)"
```

---

## Task 12 : Vérification de bout-en-bout + déploiement

- [ ] **Step 1 : Suite API complète + typecheck web**

Run: `cd apps/api && npx jest --silent && npx tsc --noEmit && cd ../web && npx tsc --noEmit`
Expected: tout vert.

- [ ] **Step 2 : Smoke test manuel local (optionnel mais recommandé)**

Démarrer l'API en local, et avec un client HTTP :
1. `POST /api/v1/public/psy/:slug/book` avec `notifyEarlierSlot: true` → vérifier en DB que `notify_earlier_slot=true` et `earlier_slot_token` non nul.
2. Annuler (via dashboard psy) un RDV antérieur → vérifier qu'un email `sendEarlierSlotAvailable` part (logs Resend) et que `earlier_slot_notified_at` est rempli.
3. `GET /api/v1/public/rebook/:token` → liste de créneaux plus tôt.
4. `POST /api/v1/public/rebook/:token` `{ newSlot }` → `scheduledAt` mis à jour, `slot.freed` réémis pour l'ancienne heure.

- [ ] **Step 3 : Appliquer la migration en prod (VPS)**

Suivre la procédure de déploiement API manuelle (mémoire `cicd-infra` / procédure VPS) :
```
docker compose exec -T -u root api npx prisma migrate deploy
```
Vérifier que la migration `20260607_earlier_slot_waitlist` est appliquée (`IF NOT EXISTS` ⇒ idempotente).

- [ ] **Step 4 : Rebuild + redeploy API VPS** (la CI ne redéploie pas l'API — voir mémoire) puis **deploy Vercel** : `npx vercel --prod --yes` depuis la racine.

- [ ] **Step 5 : Commit/push final + mise à jour mémoire**

```bash
git push origin main
```
Mettre à jour `MEMORY.md` avec une ligne « Earlier-Slot Waitlist ✅ DÉPLOYÉ (2026-06-07) ».

---

## Self-Review (couverture spec → plan)

- **§2 Données** (3 champs Appointment + toggle Psychologist) → Task 1. ✅
- **§3 Déclenchement** (`slot.freed` au cancel + listener + matching + vérif availability + anti-spam 6h) → Tasks 3 & 4. ✅
- **§3 Cascade au déplacement** (`slot.freed` réémis) → Task 6 (`moveToSlot`). ✅
- **§4 Récupération** (GET infos+slots, POST move Serializable, unsubscribe) → Tasks 6 & 7. ✅
- **§5 Frontend** (checkbox résa, page /rebook, toggle réglages) → Tasks 9, 10, 11. ✅
- **§6 Email** (`sendEarlierSlotAvailable`, sans donnée de santé) → Task 2. ✅
- **§7 Sécurité** (token randomUUID, throttle, unsubscribe RGPD, audit via chemin update) → Tasks 5/6/7. ✅
- **§8 Hors scope** : pas de timers, pas de SMS, WaitlistEntry intacte, pas de feature-gate par plan. Respecté. ✅
- **§9 Points à trancher** : réutilisation du composant slots (Task 10 — version autonome simple retenue pour éviter le couplage), index DB (Task 1 — index existant `idx_appointments_psy_status_date` couvre le matching, pas d'index ajouté), fenêtre `getAvailableTimeslots` (Task 3 — `[freedAt, freedAt+duration]` avec test d'égalité exacte). ✅

**Cohérence des types/signatures :** `slot.freed` payload `{ psychologistId, freedAt }` identique à l'émission (Tasks 4 & 6) et à la consommation (Task 4 listener → Task 3 `notifyFreedSlot(psychologistId, freedAt)`). `earlierSlotToken` / `notifyEarlierSlot` / `earlierSlotNotifiedAt` nommés de façon cohérente partout. Route `/api/v1/public/rebook/:token` cohérente entre email (Task 3), controller (Task 7) et client web (Task 10).
