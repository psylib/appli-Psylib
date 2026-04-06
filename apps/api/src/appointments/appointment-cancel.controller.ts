import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AppointmentsService } from './appointments.service';

@ApiTags('Appointment Cancel')
@Controller('appointments/cancel')
export class AppointmentCancelController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get(':token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Infos annulation par token (public)' })
  async getCancelInfo(@Param('token') token: string) {
    return this.appointmentsService.getCancelInfo(token);
  }

  @Post(':token')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Annuler un RDV par token (public)' })
  async cancelByToken(@Param('token') token: string) {
    return this.appointmentsService.cancelByToken(token);
  }
}
