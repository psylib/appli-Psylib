import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../notifications/email.service';
import { LeadMagnetPdfService } from './lead-magnet-pdf.service';
import { RequestLeadMagnetDto } from './dto/request-lead-magnet.dto';

const LEAD_MAGNET_TITLES: Record<string, string> = {
  'kit-demarrage-cabinet': 'Kit de demarrage cabinet psy',
  'templates-notes-tcc': 'Templates notes cliniques TCC',
  'guide-tarifs-facturation': 'Guide tarifs et facturation psychologue',
  'guide-rgpd-hds': 'Guide RGPD et HDS pour psychologues liberaux',
};

@Injectable()
export class LeadMagnetsService {
  private readonly logger = new Logger(LeadMagnetsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly pdf: LeadMagnetPdfService,
  ) {}

  async requestDownload(dto: RequestLeadMagnetDto) {
    const title = LEAD_MAGNET_TITLES[dto.slug];
    if (!title) {
      throw new BadRequestException('Lead magnet introuvable');
    }

    // 1. Upsert lead
    await this.prisma.lead.upsert({
      where: { email: dto.email },
      update: {},
      create: {
        email: dto.email,
        source: `lead_magnet_${dto.slug}`,
      },
    });

    // 2. Generate PDF
    const pdfBuffer = await this.pdf.generatePdf(dto.slug);

    // 3. Send email with PDF attachment (non-blocking)
    void this.email.sendLeadMagnet(dto.email, {
      title,
      slug: dto.slug,
      pdfBuffer,
    });

    this.logger.log(`Lead magnet "${dto.slug}" requested by ${dto.email}`);

    return { success: true };
  }
}
