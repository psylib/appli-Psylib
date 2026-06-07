import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MatchingService } from './matching.service';
import { MatchQueryDto } from './dto/matching.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Matching')
@Public() // PAS de garde auth — endpoint public
@Controller('public/match')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Trouver un psy par critères (public, sans auth)' })
  findMatches(@Query() query: MatchQueryDto) {
    return this.matchingService.findMatches(query);
  }
}
