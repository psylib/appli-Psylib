import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InvoicesService } from './invoices.service';
import { EmailService } from '../notifications/email.service';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../common/prisma.service';

export const INVOICE_GENERATION_QUEUE = 'invoice-generation';

export interface GenerateInvoiceJobData {
  type: 'session_completed' | 'payment_received';
  psychologistId: string;
  patientId: string;
  amount: number;
  sessionDate: string;
  sessionId?: string;
  appointmentId?: string;
  internalPaymentId?: string;
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

    const invoice = await this.invoicesService.createAutoInvoice(data);

    if (!invoice) {
      this.logger.log('Invoice already exists, skipping');
      return;
    }

    await this.audit.log({
      actorId: data.psychologistId,
      actorType: 'system',
      action: 'INVOICE_AUTO_GENERATED',
      entityType: 'invoice',
      entityId: invoice.id,
      metadata: { type: data.type, invoiceNumber: invoice.invoiceNumber },
    });

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
            const fullInvoice = await this.prisma.invoice.findUnique({
              where: { id: invoice.id },
              include: { psychologist: true, patient: true, session: true },
            });

            const sessions = fullInvoice?.session ? [fullInvoice.session] : [];
            if (!fullInvoice) {
              this.logger.warn(`Invoice ${invoice.id} not found for PDF generation`);
              return;
            }
            const pdfBuffer = await this.invoicesService.buildPdfBufferPublic(
              fullInvoice,
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
          }
        }

        // Send invoice to guardian(s) if minor patient
        if (patient?.isMinor) {
          try {
            await this.sendInvoiceToGuardians(
              data.patientId,
              patient.name,
              psychologist.name,
              invoice,
            );
          } catch (error) {
            this.logger.error(`Failed to email guardian invoice ${invoice.invoiceNumber}: ${error}`);
          }
        }
      }
    }
  }

  /**
   * Sends the invoice to guardians who have the invoices permission enabled.
   */
  private async sendInvoiceToGuardians(
    patientId: string,
    patientName: string,
    psychologistName: string,
    invoice: { id: string; invoiceNumber: string; amountTtc: any; issuedAt: Date },
  ): Promise<void> {
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

    // Build PDF once for all guardians
    let pdfBuffer: Buffer | undefined;
    try {
      const fullInvoice = await this.prisma.invoice.findUnique({
        where: { id: invoice.id },
        include: { psychologist: true, patient: true, session: true },
      });
      if (fullInvoice) {
        const sessions = fullInvoice.session ? [fullInvoice.session] : [];
        pdfBuffer = await this.invoicesService.buildPdfBufferPublic(fullInvoice, sessions);
      }
    } catch (error) {
      this.logger.warn(`Could not build PDF for guardian invoice ${invoice.invoiceNumber}: ${error}`);
    }

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

      this.logger.log(`Guardian invoice ${invoice.invoiceNumber} sent to ${guardian.email}`);
    }
  }
}
