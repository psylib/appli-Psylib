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
  CancelAppointmentDto,
  MarkPaidOnSiteDto,
} from './dto/appointment.dto';
import { CreateGroupAppointmentDto } from './dto/create-group-appointment.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePlan } from '../billing/decorators/require-plan.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TenantPsychologistUserId } from '../auth/decorators/tenant-psychologist.decorator';
import { SubscriptionPlan } from '@psyscale/shared-types';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles('psychologist', 'admin', 'assistant')
  @ApiOperation({ summary: 'Créer un RDV' })
  async create(
    @Body() dto: CreateAppointmentDto,
    @TenantPsychologistUserId() psyUserId: string,
  ) {
    return this.appointmentsService.create(psyUserId, dto);
  }

  @Post('group')
  @UseGuards(KeycloakGuard, RolesGuard, SubscriptionGuard)
  @Roles('psychologist', 'admin')
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  @ApiOperation({ summary: 'Créer un RDV de groupe multi-participants' })
  async createGroup(
    @Body() dto: CreateGroupAppointmentDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.appointmentsService.createGroup(user.sub, dto);
  }

  @Get()
  @Roles('psychologist', 'admin', 'assistant')
  @ApiOperation({ summary: 'RDV par période' })
  async findAll(
    @Query() query: AppointmentQueryDto,
    @TenantPsychologistUserId() psyUserId: string,
  ) {
    return this.appointmentsService.findAll(psyUserId, query);
  }

  @Put(':id')
  @Roles('psychologist', 'admin', 'assistant')
  @ApiOperation({ summary: 'Modifier un RDV' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
    @TenantPsychologistUserId() psyUserId: string,
  ) {
    return this.appointmentsService.update(psyUserId, id, dto);
  }

  @Delete(':id')
  @Roles('psychologist', 'admin', 'assistant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annuler un RDV' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAppointmentDto,
    @TenantPsychologistUserId() psyUserId: string,
  ) {
    return this.appointmentsService.cancel(psyUserId, id, dto);
  }

  @Get('pending')
  @Roles('psychologist', 'admin', 'assistant')
  @ApiOperation({ summary: 'Demandes en attente (source=public, status=scheduled)' })
  async getPending(@TenantPsychologistUserId() psyUserId: string) {
    return this.appointmentsService.getPending(psyUserId);
  }

  @Put(':id/confirm')
  @Roles('psychologist', 'admin', 'assistant')
  @ApiOperation({ summary: 'Confirmer un RDV (source public)' })
  async confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantPsychologistUserId() psyUserId: string,
  ) {
    return this.appointmentsService.confirmAppointment(psyUserId, id);
  }

  @Put(':id/decline')
  @Roles('psychologist', 'admin', 'assistant')
  @ApiOperation({ summary: 'Refuser un RDV (source public)' })
  async decline(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantPsychologistUserId() psyUserId: string,
  ) {
    return this.appointmentsService.declineAppointment(psyUserId, id);
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

  @Post(':id/mark-paid-on-site')
  @ApiOperation({ summary: 'Marquer un RDV comme payé sur place' })
  async markPaidOnSite(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkPaidOnSiteDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.appointmentsService.markAsPaidOnSite(user.sub, id, dto);
  }
}
