import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../notifications/email.service';
import { PaymentCompletedEvent } from '../accounting/events/payment-completed.event';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import {
  Prisma,
  type Invoice,
  type Patient,
  type Psychologist,
  type Session,
} from '@prisma/client';

type InvoiceWithRelations = Invoice & {
  patient: Patient | null;
  psychologist: Psychologist;
};

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Calcule le prochain numéro de facture PSY-YYYY-NNN pour un psy/année donnés.
   * H (audit 2026-06-05) : la séquence est déterminée NUMÉRIQUEMENT (et non par un
   * tri lexicographique sur la chaîne, qui cassait dès 1000 : "PSY-2026-1000" < "PSY-2026-999").
   * `attempt` décale la séquence lors d'un retry après collision P2002.
   */
  private async nextInvoiceNumber(
    tx: Prisma.TransactionClient,
    psychologistId: string,
    year: number,
    attempt: number,
  ): Promise<string> {
    const existing = await tx.invoice.findMany({
      where: { psychologistId, invoiceNumber: { startsWith: `PSY-${year}-` } },
      select: { invoiceNumber: true },
    });
    let maxSeq = 0;
    for (const inv of existing) {
      const seq = parseInt(inv.invoiceNumber.split('-')[2] ?? '0', 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
    const sequence = maxSeq + 1 + attempt;
    return `PSY-${year}-${String(sequence).padStart(3, '0')}`;
  }

  /**
   * Resolve Keycloak user ID (sub) → Psychologist.id
   */
  private async resolvePsychologistId(userId: string): Promise<string> {
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!psy) {
      throw new NotFoundException('Psychologue introuvable');
    }
    return psy.id;
  }

  async findAll(userId: string): Promise<InvoiceWithRelations[]> {
    const psychologistId = await this.resolvePsychologistId(userId);

    return this.prisma.invoice.findMany({
      where: { psychologistId },
      include: {
        patient: true,
        psychologist: true,
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateInvoiceDto): Promise<Invoice> {
    const psychologistId = await this.resolvePsychologistId(userId);

    // Verify patient belongs to this psychologist
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, psychologistId },
    });

    if (!patient) {
      throw new NotFoundException('Patient introuvable');
    }

    // Verify sessions belong to this psychologist
    if (dto.sessions.length > 0) {
      const sessionsCount = await this.prisma.session.count({
        where: {
          id: { in: dto.sessions },
          psychologistId,
        },
      });

      if (sessionsCount !== dto.sessions.length) {
        throw new BadRequestException('Une ou plusieurs séances sont invalides');
      }
    }

    // Generate invoice number: PSY-YYYY-NNN (serializable transaction to prevent race conditions)
    const year = new Date(dto.issuedAt).getFullYear();
    const maxRetries = 5;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const invoiceNumber = await this.nextInvoiceNumber(tx, psychologistId, year, attempt);

          return tx.invoice.create({
            data: {
              psychologistId,
              patientId: dto.patientId,
              invoiceNumber,
              amountTtc: dto.amountTtc,
              status: 'draft',
              issuedAt: new Date(dto.issuedAt),
            },
          });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (err: unknown) {
        // P2002 = unique constraint violation — retry with next sequence
        if (
          err &&
          typeof err === 'object' &&
          'code' in err &&
          (err as { code: string }).code === 'P2002' &&
          attempt < maxRetries - 1
        ) {
          continue;
        }
        throw err;
      }
    }

    throw new InternalServerErrorException('Impossible de générer un numéro de facture unique');
  }

  /**
   * Modifie une facture EN BROUILLON (patient, montant, date).
   * Une facture envoyée ou payée n'est jamais modifiable (intégrité comptable / FEC).
   */
  async update(userId: string, invoiceId: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    const psychologistId = await this.resolvePsychologistId(userId);

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, psychologistId },
    });

    if (!invoice) {
      throw new NotFoundException('Facture introuvable');
    }

    if (invoice.status !== 'draft') {
      throw new ForbiddenException(
        'Seules les factures en brouillon peuvent être modifiées',
      );
    }

    // Si on change le patient, vérifier qu'il appartient bien à ce psychologue
    if (dto.patientId && dto.patientId !== invoice.patientId) {
      const patient = await this.prisma.patient.findFirst({
        where: { id: dto.patientId, psychologistId },
        select: { id: true },
      });
      if (!patient) {
        throw new NotFoundException('Patient introuvable');
      }
    }

    const data: Prisma.InvoiceUpdateInput = {};
    if (dto.patientId !== undefined) {
      data.patient = { connect: { id: dto.patientId } };
    }
    if (dto.amountTtc !== undefined) {
      data.amountTtc = dto.amountTtc;
    }
    if (dto.issuedAt !== undefined) {
      data.issuedAt = new Date(dto.issuedAt);
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data,
    });
  }

  async generatePdf(
    userId: string,
    invoiceId: string,
    res: Response,
  ): Promise<void> {
    const psychologistId = await this.resolvePsychologistId(userId);

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, psychologistId },
      include: {
        patient: true,
        psychologist: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Facture introuvable');
    }

    // Fetch sessions for the invoice's month and patient
    const issuedDate = new Date(invoice.issuedAt);
    const monthStart = new Date(issuedDate.getFullYear(), issuedDate.getMonth(), 1);
    const monthEnd = new Date(
      issuedDate.getFullYear(),
      issuedDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const sessions: Session[] = invoice.patientId
      ? await this.prisma.session.findMany({
          where: {
            psychologistId,
            patientId: invoice.patientId,
            date: { gte: monthStart, lte: monthEnd },
          },
          orderBy: { date: 'asc' },
        })
      : [];

    const buffer = await this.buildPdfBuffer(invoice as InvoiceWithRelations, sessions);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="facture-${invoice.invoiceNumber}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  async markAsSent(userId: string, invoiceId: string): Promise<Invoice> {
    const psychologistId = await this.resolvePsychologistId(userId);

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, psychologistId },
      include: {
        patient: true,
        psychologist: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Facture introuvable');
    }

    if (invoice.status === 'paid') {
      throw new ForbiddenException('Impossible de modifier une facture payée');
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'sent' },
    });

    // Envoyer la facture PDF par email au patient
    if (invoice.patient?.email) {
      const issuedDate = new Date(invoice.issuedAt);
      const monthStart = new Date(issuedDate.getFullYear(), issuedDate.getMonth(), 1);
      const monthEnd = new Date(issuedDate.getFullYear(), issuedDate.getMonth() + 1, 0, 23, 59, 59, 999);

      const sessions: Session[] = invoice.patientId
        ? await this.prisma.session.findMany({
            where: { psychologistId, patientId: invoice.patientId, date: { gte: monthStart, lte: monthEnd } },
            orderBy: { date: 'asc' },
          })
        : [];

      const pdfBuffer = await this.buildPdfBuffer(invoice as InvoiceWithRelations, sessions);

      void this.email.sendInvoiceSent(invoice.patient.email, {
        patientName: invoice.patient.name,
        psychologistName: invoice.psychologist.name,
        invoiceNumber: invoice.invoiceNumber,
        amountTtc: Number(invoice.amountTtc),
        issuedAt: invoice.issuedAt,
        pdfBuffer,
      });

      // Send to guardians if minor patient
      if (invoice.patient.isMinor) {
        void this.sendInvoiceToGuardians(
          invoice.patient.id,
          invoice.patient.name,
          invoice.psychologist.name,
          invoice,
          pdfBuffer,
        );
      }
    }

    return updated;
  }

  /**
   * Sends the invoice PDF to guardians who have the invoices permission enabled.
   */
  private async sendInvoiceToGuardians(
    patientId: string,
    patientName: string,
    psychologistName: string,
    invoice: { invoiceNumber: string; amountTtc: Prisma.Decimal; issuedAt: Date },
    pdfBuffer?: Buffer,
  ): Promise<void> {
    try {
      const guardians = await this.prisma.legalGuardian.findMany({
        where: { patientId },
        select: { name: true, email: true, permissions: true },
      });

      const dateFormatted = invoice.issuedAt.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const amountFormatted = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(Number(invoice.amountTtc));

      const patientFirstName = patientName.split(' ')[0] ?? patientName;

      for (const guardian of guardians) {
        const perms = guardian.permissions as Record<string, boolean> | null;
        if (!perms?.invoices) continue;

        await this.email.sendGuardianInvoice(guardian.email, {
          guardianName: guardian.name,
          patientFirstName,
          psychologistName,
          invoiceNumber: invoice.invoiceNumber,
          amount: amountFormatted,
          issuedAt: dateFormatted,
          pdfBuffer,
        });

        this.logger.log(`Guardian invoice ${invoice.invoiceNumber} sent to guardian ${guardian.email}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send invoice to guardians: ${error}`);
    }
  }

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
    const isPaid = data.type === 'payment_received';
    const year = new Date(data.sessionDate).getFullYear();

    // Serializable transaction: idempotency check + sequence read + create — prevents race conditions
    let invoice: Invoice;
    let retries = 0;
    const maxRetries = 3;
    while (true) {
      try {
        const result = await this.prisma.$transaction(async (tx) => {
          // Idempotence check inside transaction
          if (data.sessionId) {
            const existing = await tx.invoice.findFirst({
              where: { sessionId: data.sessionId },
            });
            if (existing) {
              this.logger.warn(`Invoice already exists for session ${data.sessionId}, skipping`);
              return null;
            }
          }
          if (data.internalPaymentId) {
            const existing = await tx.invoice.findFirst({
              where: { paymentId: data.internalPaymentId },
            });
            if (existing) {
              this.logger.warn(`Invoice already exists for payment ${data.internalPaymentId}, skipping`);
              return null;
            }
          }

          // Generate invoice number (numeric sequence — voir nextInvoiceNumber)
          const invoiceNumber = await this.nextInvoiceNumber(tx, data.psychologistId, year, retries);

          return tx.invoice.create({
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
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

        if (result === null) return null;
        invoice = result;
        break;
      } catch (err) {
        const prismaCode = (err as { code?: string }).code;
        if (prismaCode === 'P2002' && retries < maxRetries) {
          retries++;
          continue;
        }
        throw err;
      }
    }

    // Emit invoice.paid event for accounting ledger entry
    if (isPaid && invoice) {
      try {
        const patient = await this.prisma.patient.findUnique({
          where: { id: data.patientId },
          select: { name: true },
        });
        this.eventEmitter.emit(
          'invoice.paid',
          new PaymentCompletedEvent(
            data.psychologistId,
            data.internalPaymentId ?? '',
            invoice.id,
            patient?.name ?? 'Patient',
            data.amount,
            new Date(data.sessionDate),
            'online',
            invoice.invoiceNumber,
          ),
        );
      } catch (error) {
        this.logger.error(`Failed to emit invoice.paid event for auto-invoice ${invoice.id}: ${error}`);
      }
    }

    return invoice;
  }

  async markAsPaid(userId: string, invoiceId: string): Promise<Invoice> {
    const psychologist = await this.prisma.psychologist.findFirst({
      where: { userId },
    });
    if (!psychologist) throw new NotFoundException('Profil psychologue introuvable');

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, psychologistId: psychologist.id },
    });
    if (!invoice) throw new NotFoundException('Facture introuvable');

    if (invoice.status === 'paid') {
      throw new BadRequestException('Invoice is already paid');
    }

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
      include: { patient: true },
    });

    try {
      this.eventEmitter.emit(
        'invoice.paid',
        new PaymentCompletedEvent(
          psychologist.id,
          '',  // paymentId unknown here
          invoiceId,
          updatedInvoice.patient?.name ?? 'Patient',
          Number(updatedInvoice.amountTtc),
          new Date(),
          'manual',  // paid manually via markAsPaid
          updatedInvoice.invoiceNumber,
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to emit invoice.paid event for invoice ${invoiceId}: ${error}`);
    }

    return updatedInvoice;
  }

  /** Public accessor for auto-invoice processor */
  async buildPdfBufferPublic(invoice: InvoiceWithRelations, sessions: Session[]): Promise<Buffer> {
    return this.buildPdfBuffer(invoice, sessions);
  }

  // ─── PDF Builder ──────────────────────────────────────────────────────────

  private buildPdfBuffer(invoice: InvoiceWithRelations, sessions: Session[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      this.buildPdf(doc, invoice, sessions);
      doc.end();
    });
  }

  private buildPdf(
    doc: PDFKit.PDFDocument,
    invoice: InvoiceWithRelations,
    sessions: Session[],
  ): void {
    const PRIMARY_COLOR = '#3D52A0';
    const TEXT_COLOR = '#1E1B4B';
    const LIGHT_COLOR = '#7B9CDA';
    const PAGE_WIDTH = 595.28; // A4 width in points
    const MARGIN = 50;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

    // ── Header ──────────────────────────────────────────────────────────────
    doc
      .fontSize(24)
      .fillColor(PRIMARY_COLOR)
      .font('Helvetica-Bold')
      .text('PsyLib', MARGIN, MARGIN);

    doc
      .fontSize(10)
      .fillColor(LIGHT_COLOR)
      .font('Helvetica')
      .text('Plateforme de gestion cabinet psychologie', MARGIN, MARGIN + 28);

    // Invoice number + status (top right)
    doc
      .fontSize(18)
      .fillColor(PRIMARY_COLOR)
      .font('Helvetica-Bold')
      .text(`FACTURE ${invoice.invoiceNumber}`, MARGIN, MARGIN, {
        align: 'right',
        width: CONTENT_WIDTH,
      });

    doc
      .fontSize(10)
      .fillColor(TEXT_COLOR)
      .font('Helvetica')
      .text(
        `Date : ${this.formatDate(invoice.issuedAt)}`,
        MARGIN,
        MARGIN + 26,
        { align: 'right', width: CONTENT_WIDTH },
      );

    doc
      .fontSize(10)
      .fillColor(
        invoice.status === 'paid'
          ? '#10B981'
          : invoice.status === 'sent'
            ? '#3D52A0'
            : '#F59E0B',
      )
      .font('Helvetica-Bold')
      .text(
        `Statut : ${this.labelStatus(invoice.status)}`,
        MARGIN,
        MARGIN + 40,
        { align: 'right', width: CONTENT_WIDTH },
      );

    // ── Separator ───────────────────────────────────────────────────────────
    const sepY = MARGIN + 70;
    doc
      .moveTo(MARGIN, sepY)
      .lineTo(PAGE_WIDTH - MARGIN, sepY)
      .strokeColor(LIGHT_COLOR)
      .lineWidth(1)
      .stroke();

    // ── Psychologist info ────────────────────────────────────────────────────
    const infoY = sepY + 20;
    doc
      .fontSize(11)
      .fillColor(PRIMARY_COLOR)
      .font('Helvetica-Bold')
      .text('PRATICIEN', MARGIN, infoY);

    doc
      .fontSize(10)
      .fillColor(TEXT_COLOR)
      .font('Helvetica')
      .text(invoice.psychologist.name, MARGIN, infoY + 16)
      .text(
        invoice.psychologist.address ?? 'Adresse non renseignée',
        MARGIN,
        infoY + 30,
      )
      .text(
        invoice.psychologist.adeliNumber
          ? `N° ADELI : ${invoice.psychologist.adeliNumber}`
          : 'N° ADELI : Non renseigné',
        MARGIN,
        infoY + 44,
      );

    // ── Patient info ─────────────────────────────────────────────────────────
    if (invoice.patient) {
      const patientX = PAGE_WIDTH / 2;
      doc
        .fontSize(11)
        .fillColor(PRIMARY_COLOR)
        .font('Helvetica-Bold')
        .text('PATIENT', patientX, infoY);

      doc
        .fontSize(10)
        .fillColor(TEXT_COLOR)
        .font('Helvetica')
        .text(invoice.patient.name, patientX, infoY + 16)
        .text(invoice.patient.email ?? '', patientX, infoY + 30)
        .text(invoice.patient.phone ?? '', patientX, infoY + 44);
    }

    // ── Sessions table ───────────────────────────────────────────────────────
    const tableY = infoY + 90;

    doc
      .moveTo(MARGIN, tableY - 5)
      .lineTo(PAGE_WIDTH - MARGIN, tableY - 5)
      .strokeColor(LIGHT_COLOR)
      .lineWidth(0.5)
      .stroke();

    // Table header background
    doc
      .rect(MARGIN, tableY, CONTENT_WIDTH, 20)
      .fillColor(PRIMARY_COLOR)
      .fill();

    const col1 = MARGIN + 5;
    const col2 = MARGIN + CONTENT_WIDTH * 0.5;
    const col3 = MARGIN + CONTENT_WIDTH * 0.75;

    doc
      .fontSize(10)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text('Date', col1, tableY + 5, { width: CONTENT_WIDTH * 0.45 })
      .text('Type', col2, tableY + 5, { width: CONTENT_WIDTH * 0.25 })
      .text('Tarif', col3, tableY + 5, {
        width: CONTENT_WIDTH * 0.25,
        align: 'right',
      });

    // Table rows
    let rowY = tableY + 20;
    let rowIndex = 0;

    if (sessions.length === 0) {
      doc
        .rect(MARGIN, rowY, CONTENT_WIDTH, 24)
        .fillColor('#F8F7FF')
        .fill();
      doc
        .fontSize(10)
        .fillColor(TEXT_COLOR)
        .font('Helvetica')
        .text(
          'Aucune séance associée à cette facture',
          col1,
          rowY + 6,
          { width: CONTENT_WIDTH - 10 },
        );
      rowY += 24;
    } else {
      for (const session of sessions) {
        const bgColor = rowIndex % 2 === 0 ? '#F8F7FF' : '#FFFFFF';
        doc.rect(MARGIN, rowY, CONTENT_WIDTH, 22).fillColor(bgColor).fill();

        doc
          .fontSize(10)
          .fillColor(TEXT_COLOR)
          .font('Helvetica')
          .text(this.formatDate(session.date), col1, rowY + 6, {
            width: CONTENT_WIDTH * 0.45,
          })
          .text(this.labelSessionType(session.type), col2, rowY + 6, {
            width: CONTENT_WIDTH * 0.25,
          })
          .text(
            session.rate ? `${Number(session.rate).toFixed(2)} €` : '—',
            col3,
            rowY + 6,
            { width: CONTENT_WIDTH * 0.25, align: 'right' },
          );

        rowY += 22;
        rowIndex++;
      }
    }

    // ── Total ────────────────────────────────────────────────────────────────
    rowY += 10;
    doc
      .moveTo(MARGIN, rowY)
      .lineTo(PAGE_WIDTH - MARGIN, rowY)
      .strokeColor(LIGHT_COLOR)
      .lineWidth(0.5)
      .stroke();

    rowY += 10;

    doc
      .fontSize(12)
      .fillColor(PRIMARY_COLOR)
      .font('Helvetica-Bold')
      .text('TOTAL TTC', MARGIN, rowY, { width: CONTENT_WIDTH * 0.75 })
      .text(`${Number(invoice.amountTtc).toFixed(2)} €`, MARGIN, rowY, {
        width: CONTENT_WIDTH,
        align: 'right',
      });

    rowY += 18;

    doc
      .fontSize(9)
      .fillColor(LIGHT_COLOR)
      .font('Helvetica-Oblique')
      .text(
        'TVA non applicable — Art. 261-4-1° du CGI (psychologues exonérés)',
        MARGIN,
        rowY,
        { width: CONTENT_WIDTH },
      );

    // ── Footer ───────────────────────────────────────────────────────────────
    const footerY = 780;
    doc
      .moveTo(MARGIN, footerY)
      .lineTo(PAGE_WIDTH - MARGIN, footerY)
      .strokeColor(LIGHT_COLOR)
      .lineWidth(0.5)
      .stroke();

    doc
      .fontSize(8)
      .fillColor(LIGHT_COLOR)
      .font('Helvetica')
      .text(
        `Facture générée par PsyLib — ${this.formatDate(new Date())}`,
        MARGIN,
        footerY + 8,
        { width: CONTENT_WIDTH, align: 'center' },
      );
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private labelStatus(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      sent: 'Envoyée',
      paid: 'Payée',
    };
    return labels[status] ?? status;
  }

  private labelSessionType(type: string): string {
    const labels: Record<string, string> = {
      individual: 'Individuelle',
      group: 'Groupe',
      online: 'En ligne',
    };
    return labels[type] ?? type;
  }
}
