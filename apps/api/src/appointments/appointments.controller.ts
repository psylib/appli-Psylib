import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentQueryDto,
  SendPaymentLinkDto,
} from './dto/appointment.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un RDV' })
  async create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: KeycloakUser) {
    return this.appointmentsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'RDV par période' })
  async findAll(@Query() query: AppointmentQueryDto, @CurrentUser() user: KeycloakUser) {
    return this.appointmentsService.findAll(user.sub, query);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un RDV' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.appointmentsService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annuler un RDV' })
  async cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: KeycloakUser) {
    return this.appointmentsService.cancel(user.sub, id);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Demandes en attente (source=public, status=scheduled)' })
  async getPending(@CurrentUser() user: KeycloakUser) {
    return this.appointmentsService.getPending(user.sub);
  }

  @Put(':id/confirm')
  @ApiOperation({ summary: 'Confirmer un RDV (source public)' })
  async confirm(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: KeycloakUser) {
    return this.appointmentsService.confirmAppointment(user.sub, id);
  }

  @Put(':id/decline')
  @ApiOperation({ summary: 'Refuser un RDV (source public)' })
  async decline(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: KeycloakUser) {
    return this.appointmentsService.declineAppointment(user.sub, id);
  }

  @Post(':id/send-payment-link')
  @ApiOperation({ summary: 'Envoyer un lien de paiement au patient' })
  async sendPaymentLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendPaymentLinkDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.appointmentsService.sendPaymentLink(user.sub, id, dto);
  }
}
