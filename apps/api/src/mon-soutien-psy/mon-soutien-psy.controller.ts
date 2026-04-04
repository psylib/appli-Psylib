import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MonSoutienPsyService } from './mon-soutien-psy.service';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../common/prisma.service';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

@ApiTags('Mon Soutien Psy')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist')
@Controller('mon-soutien-psy')
export class MonSoutienPsyController {
  constructor(
    private readonly mspService: MonSoutienPsyService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Vue d\'ensemble MSP — tous les patients de l\'année' })
  async getOverview(@CurrentUser() user: KeycloakUser) {
    const psy = await this.resolvePsychologistId(user.sub);
    return this.mspService.getOverview(psy.id);
  }

  @Get('patients/:patientId')
  @ApiOperation({ summary: 'Suivi MSP d\'un patient pour l\'année en cours' })
  async getPatientTracking(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    const psy = await this.resolvePsychologistId(user.sub);
    const tracking = await this.mspService.getPatientTracking(psy.id, patientId);
    return {
      tracking,
      quotaReached: this.mspService.isQuotaReached(tracking),
      nearQuota: this.mspService.isNearQuota(tracking),
    };
  }

  @Get('patients/:patientId/history')
  @ApiOperation({ summary: 'Historique MSP d\'un patient (toutes les années)' })
  async getPatientHistory(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    const psy = await this.resolvePsychologistId(user.sub);
    return this.mspService.getPatientHistory(psy.id, patientId);
  }

  private async resolvePsychologistId(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!psy) {
      throw new Error('Profil psychologue introuvable');
    }
    return psy;
  }
}
