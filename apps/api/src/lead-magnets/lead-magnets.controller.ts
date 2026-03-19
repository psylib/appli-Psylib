import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LeadMagnetsService } from './lead-magnets.service';
import { RequestLeadMagnetDto } from './dto/request-lead-magnet.dto';

@ApiTags('Lead Magnets')
@Controller('lead-magnets')
export class LeadMagnetsController {
  constructor(private readonly leadMagnetsService: LeadMagnetsService) {}

  @Post('download')
  @Throttle({ short: { ttl: 60000, limit: 3 }, long: { ttl: 3600000, limit: 10 } })
  @ApiOperation({ summary: 'Demander un lead magnet PDF par email (public)' })
  requestDownload(@Body() dto: RequestLeadMagnetDto) {
    return this.leadMagnetsService.requestDownload(dto);
  }
}
