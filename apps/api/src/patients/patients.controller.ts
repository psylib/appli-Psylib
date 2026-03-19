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
  UseInterceptors,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto, PatientQueryDto } from './dto/create-patient.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditInterceptor } from '../common/audit.interceptor';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { RequireFeature } from '../billing/decorators/require-plan.decorator';
import { PatientInvitationService } from '../patient-portal/patient-invitation.service';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist', 'admin')
@UseInterceptors(AuditInterceptor)
@Controller('patients')
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly invitationService: PatientInvitationService,
  ) {}

  @Post()
  @UseGuards(SubscriptionGuard)
  @RequireFeature('patients')
  @ApiOperation({ summary: 'Créer un patient' })
  @ApiResponse({ status: 201, description: 'Patient créé' })
  async create(
    @Body() dto: CreatePatientDto,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    return this.patientsService.create(user.sub, dto, user.sub, req);
  }

  @Get()
  @ApiOperation({ summary: 'Liste paginée des patients' })
  async findAll(
    @Query() query: PatientQueryDto,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    return this.patientsService.findAll(user.sub, query, user.sub, req);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques patients' })
  async getStats(@CurrentUser() user: KeycloakUser) {
    return this.patientsService.getStats(user.sub);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export CSV de tous les patients' })
  async exportCsv(
    @CurrentUser() user: KeycloakUser,
    @Res() res: Response,
  ) {
    const csv = await this.patientsService.exportAllCsv(user.sub);
    const date = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="patients-${date}.csv"`);
    res.send('\uFEFF' + csv); // BOM UTF-8 pour Excel
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export RGPD complet d\'un patient (JSON)' })
  async exportRgpd(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
    @Res() res: Response,
  ) {
    const data = await this.patientsService.exportPatientRgpd(user.sub, id);
    const date = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="patient-rgpd-${id.slice(0, 8)}-${date}.json"`);
    res.json(data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fiche patient détaillée (notes déchiffrées)' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    return this.patientsService.findOne(user.sub, id, user.sub, req);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un patient' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    return this.patientsService.update(user.sub, id, dto, user.sub, req);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archiver un patient (soft delete)' })
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    return this.patientsService.archive(user.sub, id, user.sub, req);
  }

  @Delete(':id/purge')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Suppression totale RGPD (irréversible)' })
  @ApiResponse({ status: 204, description: 'Patient purgé' })
  async purge(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
    @Req() req: Request,
  ) {
    await this.patientsService.purge(user.sub, id, user.sub, req);
  }

  // ─── PORTAL PATIENT ────────────────────────────────────────────

  @Post(':id/invite')
  @ApiOperation({ summary: 'Inviter un patient à rejoindre son espace patient' })
  invite(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.invitationService.invitePatient(user.sub, id);
  }

  @Get(':id/portal-status')
  @ApiOperation({ summary: 'Statut d\'accès portal du patient' })
  getPortalStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.invitationService.getInvitationStatus(user.sub, id);
  }

  @Get(':id/portal-mood')
  @ApiOperation({ summary: 'Historique humeur du patient (vue psychologue)' })
  getPatientMood(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.patientsService.getPatientPortalMood(user.sub, id);
  }

  @Get(':id/portal-exercises')
  @ApiOperation({ summary: 'Exercices du patient (vue psychologue)' })
  getPatientExercises(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.patientsService.getPatientPortalExercises(user.sub, id);
  }
}
