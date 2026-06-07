import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RebookService } from './rebook.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Rebook (earlier slot)')
@Public()
@Controller('public/rebook')
export class RebookController {
  constructor(private readonly rebook: RebookService) {}

  @Get(':token')
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Infos du RDV + créneaux plus tôt disponibles' })
  async listSlots(@Param('token') token: string) {
    return this.rebook.listEarlierSlots(token);
  }

  @Post(':token')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Déplacer le RDV sur un créneau plus tôt' })
  async move(@Param('token') token: string, @Body() body: { newSlot?: string }) {
    if (!body?.newSlot) throw new BadRequestException('newSlot requis');
    return this.rebook.moveToSlot(token, body.newSlot);
  }

  @Get(':token/unsubscribe')
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Ne plus recevoir les alertes de place plus tôt' })
  async unsubscribe(@Param('token') token: string) {
    return this.rebook.unsubscribe(token);
  }
}
