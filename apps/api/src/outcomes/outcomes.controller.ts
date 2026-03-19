import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OutcomesService } from './outcomes.service';
import { CreateAssessmentDto, SubmitAssessmentDto } from './dto/outcomes.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import { AssessmentType } from '@prisma/client';

@ApiTags('Outcomes')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('outcomes')
export class OutcomesController {
  constructor(private readonly outcomesService: OutcomesService) {}

  @Get()
  @ApiOperation({ summary: 'Overview outcomes — tous les patients' })
  getOverview(@CurrentUser() user: KeycloakUser) {
    return this.outcomesService.getOverview(user.sub);
  }

  @Post('assessments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une évaluation pour un patient' })
  createAssessment(
    @Body() dto: CreateAssessmentDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.outcomesService.createAssessment(dto, user.sub);
  }

  @Post('assessments/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soumettre les réponses d'une évaluation" })
  submitAssessment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitAssessmentDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.outcomesService.submitAssessment(id, dto, user.sub);
  }

  @Get('patients/:patientId')
  @ApiOperation({ summary: "Liste des évaluations d'un patient" })
  getPatientAssessments(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.outcomesService.getPatientAssessments(patientId, user.sub);
  }

  @Get('patients/:patientId/evolution')
  @ApiOperation({ summary: "Évolution d'un patient (pour graphique)" })
  getPatientEvolution(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('type') type: AssessmentType | undefined,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.outcomesService.getPatientEvolution(patientId, user.sub, type);
  }
}
