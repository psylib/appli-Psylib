import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@ApiTags('Leads')
@Controller('leads') // public — pas de garde Keycloak
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Throttle({ short: { ttl: 60000, limit: 3 }, long: { ttl: 3600000, limit: 10 } })
  @ApiOperation({ summary: 'Enregistrer un lead depuis la landing page (public)' })
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.upsert(dto);
  }
}
