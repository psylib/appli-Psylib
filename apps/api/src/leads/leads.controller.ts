import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreateBetaLeadDto } from './dto/create-beta-lead.dto';
import { LeadNurtureSequenceService } from '../notifications/lead-nurture-sequence.service';

@ApiTags('Leads')
@Controller('leads') // public — pas de garde Keycloak
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly leadNurture: LeadNurtureSequenceService,
  ) {}

  @Post()
  @Throttle({ short: { ttl: 60000, limit: 3 }, long: { ttl: 3600000, limit: 10 } })
  @ApiOperation({ summary: 'Enregistrer un lead depuis la landing page (public)' })
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.upsert(dto);
  }

  @Post('beta')
  @Throttle({ short: { ttl: 60000, limit: 2 }, long: { ttl: 3600000, limit: 5 } })
  @ApiOperation({ summary: 'Candidature Fondateur beta (public)' })
  async createBetaLead(@Body() dto: CreateBetaLeadDto) {
    // 1. Upsert dans la table leads
    const lead = await this.leadsService.upsert({
      email: dto.email,
      source: 'beta_founders',
      ip: dto.ip,
    });

    // 2. Enregistrer le lead + envoyer le welcome nurturing
    await this.leadNurture.registerLeadAndSendWelcome({
      email: dto.email,
      name: dto.name,
      adeli: dto.adeli,
      message: dto.message,
      ipAddress: dto.ip,
    });

    return lead;
  }
}
