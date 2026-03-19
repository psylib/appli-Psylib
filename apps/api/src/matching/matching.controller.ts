import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MatchingService } from './matching.service';
import { MatchQueryDto } from './dto/matching.dto';

@ApiTags('Matching')
@Controller('public/match') // PAS de garde auth — endpoint public
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Trouver un psy par critères (public, sans auth)' })
  findMatches(@Query() query: MatchQueryDto) {
    return this.matchingService.findMatches(query);
  }
}
