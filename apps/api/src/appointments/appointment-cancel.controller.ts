import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AppointmentsService } from './appointments.service';
import { CancelAppointmentDto } from './dto/appointment.dto';
import { ParseTokenPipe } from '../common/parse-slug.pipe';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Appointment Cancel')
@Public()
@Controller('appointments/cancel')
export class AppointmentCancelController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get(':token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Infos annulation par token (public)' })
  async getCancelInfo(@Param('token', ParseTokenPipe) token: string) {
    return this.appointmentsService.getCancelInfo(token);
  }

  @Post(':token')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Annuler un RDV par token (public)' })
  async cancelByToken(
    @Param('token', ParseTokenPipe) token: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancelByToken(token, dto.cancellationReason);
  }
}
