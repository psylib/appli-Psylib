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
          }
        }
      }
    }
  }
}
