import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(dto: CreateLeadDto) {
    return this.prisma.lead.upsert({
      where: { email: dto.email },
      update: {},
      create: {
        email: dto.email,
        source: dto.source ?? 'landing_beta',
        ip: dto.ip ?? null,
      },
      select: { id: true, email: true, source: true, createdAt: true },
    });
  }
}
