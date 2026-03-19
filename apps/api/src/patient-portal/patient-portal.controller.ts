import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PatientJwtGuard } from './guards/patient-jwt.guard';
import { PatientPortalService } from './patient-portal.service';
import { CreateMoodDto, CreateJournalEntryDto, UpdateExerciseDto } from './dto/patient-portal.dto';
import { CurrentPatient } from './decorators/current-patient.decorator';
import type { PatientUser } from './strategies/patient-jwt.strategy';

@ApiTags('Patient Portal')
@ApiBearerAuth()
@UseGuards(PatientJwtGuard)
@Controller('patient-portal')
export class PatientPortalController {
  constructor(private readonly service: PatientPortalService) {}

  // ─── PROFIL ────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Profil du patient connecté' })
  getProfile(@CurrentPatient() user: PatientUser) {
    return this.service.getProfile(user.patientId);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard patient — humeur, exercices, RDV' })
  getDashboard(@CurrentPatient() user: PatientUser) {
    return this.service.getDashboard(user.patientId);
  }

  // ─── MOOD ──────────────────────────────────────────────────────

  @Post('mood')
  @ApiOperation({ summary: 'Enregistrer son humeur du jour' })
  createMood(@CurrentPatient() user: PatientUser, @Body() dto: CreateMoodDto) {
    return this.service.createMood(user.patientId, dto);
  }

  @Get('mood')
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiOperation({ summary: 'Historique humeur (30 derniers jours par défaut)' })
  getMoodHistory(
    @CurrentPatient() user: PatientUser,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.service.getMoodHistory(user.patientId, days);
  }

  // ─── EXERCICES ─────────────────────────────────────────────────

  @Get('exercises')
  @ApiOperation({ summary: 'Liste des exercices assignés' })
  getExercises(@CurrentPatient() user: PatientUser) {
    return this.service.getExercises(user.patientId);
  }

  @Patch('exercises/:id')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'un exercice' })
  updateExercise(
    @CurrentPatient() user: PatientUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExerciseDto,
  ) {
    return this.service.updateExercise(user.patientId, id, dto);
  }

  // ─── JOURNAL ───────────────────────────────────────────────────

  @Post('journal')
  @ApiOperation({ summary: 'Créer une entrée de journal' })
  createJournalEntry(@CurrentPatient() user: PatientUser, @Body() dto: CreateJournalEntryDto) {
    return this.service.createJournalEntry(user.patientId, dto, user.sub);
  }

  @Get('journal')
  @ApiOperation({ summary: 'Lister ses entrées de journal' })
  getJournalEntries(@CurrentPatient() user: PatientUser) {
    return this.service.getJournalEntries(user.patientId, user.sub);
  }

  @Delete('journal/:id')
  @ApiOperation({ summary: 'Supprimer une entrée de journal' })
  deleteJournalEntry(
    @CurrentPatient() user: PatientUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.deleteJournalEntry(user.patientId, id);
  }

  // ─── ASSESSMENTS ──────────────────────────────────────────────

  @Get('assessments')
  @ApiOperation({ summary: 'Liste des évaluations du patient' })
  getAssessments(@CurrentPatient() user: PatientUser) {
    return this.service.getAssessments(user.patientId);
  }

  @Post('assessments/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soumettre les réponses d\'une évaluation' })
  submitAssessment(
    @CurrentPatient() user: PatientUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { answers: Array<{ questionId: string; value: number }> },
  ) {
    return this.service.submitPatientAssessment(id, user.patientId, body.answers);
  }
}
