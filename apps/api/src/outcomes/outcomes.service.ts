import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { AuditService } from '../common/audit.service';
import { ScoringService } from './scoring.service';
import { CreateAssessmentDto, SubmitAssessmentDto } from './dto/outcomes.dto';
import { AssessmentType } from '@prisma/client';

@Injectable()
export class OutcomesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
    private readonly scoring: ScoringService,
  ) {}

  private async getPsychologist(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');
    return psy;
  }

  private async ensureTemplate(type: AssessmentType) {
    const existing = await this.prisma.assessmentTemplate.findFirst({
      where: { type, isActive: true },
    });
    if (existing) return existing;

    if (type === 'PHQ9') {
      return this.prisma.assessmentTemplate.create({
        data: {
          type: 'PHQ9',
          name: 'PHQ-9 — Questionnaire sur la santé du patient',
          description: "Évalue les symptômes dépressifs sur les 2 dernières semaines.",
          maxScore: 27,
          questions: [
            { id: 'q1', text: "Peu d'intérêt ou de plaisir dans vos activités", minValue: 0, maxValue: 3, labels: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
            { id: 'q2', text: "Se sentir triste, déprimé(e) ou désespéré(e)", minValue: 0, maxValue: 3, labels: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
            { id: 'q3', text: "Difficultés à s'endormir, sommeil interrompu ou trop long", minValue: 0, maxValue: 3, labels: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
            { id: 'q4', text: "Se sentir fatigué(e) ou manquer d'énergie", minValue: 0, maxValue: 3, labels: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
            { id: 'q5', text: 'Manque d\'appétit ou manger trop', minValue: 0, maxValue: 3, labels: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
            { id: 'q6', text: "Mauvaise opinion de vous-même, sentiment d'être nul/nulle", minValue: 0, maxValue: 3, labels: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
            { id: 'q7', text: "Difficultés à vous concentrer (lecture, télévision)", minValue: 0, maxValue: 3, labels: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
            { id: 'q8', text: "Bouger ou parler lentement / agité(e) plus que d'habitude", minValue: 0, maxValue: 3, labels: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
            { id: 'q9', text: "Penser qu'il vaudrait mieux mourir ou vouloir se faire du mal", minValue: 0, maxValue: 3, labels: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
          ],
          scoringRanges: [
            { min: 0, max: 4, label: 'Minimal', severity: 'minimal' },
            { min: 5, max: 9, label: 'Léger', severity: 'mild' },
            { min: 10, max: 14, label: 'Modéré', severity: 'moderate' },
            { min: 15, max: 19, label: 'Modérément sévère', severity: 'moderately_severe' },
            { min: 20, max: 27, label: 'Sévère', severity: 'severe' },
          ],
        },
      });
    }

    if (type === 'GAD7') {
      return this.prisma.assessmentTemplate.create({
        data: {
          type: 'GAD7',
          name: 'GAD-7 — Trouble Anxieux Généralisé',
          description: "Évalue les symptômes anxieux sur les 2 dernières semaines.",
          maxScore: 21,
          questions: [
            { id: 'q1', text: 'Se sentir nerveux, anxieux/anxieuse ou à bout', minValue: 0, maxValue: 3, labels: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
            { id: 'q2', text: "Ne pas être capable d'arrêter de s'inquiéter", minValue: 0, maxValue: 3, labels: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
            { id: 'q3', text: "S'inquiéter trop à propos de différentes choses", minValue: 0, maxValue: 3, labels: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
            { id: 'q4', text: 'Avoir de la difficulté à se détendre', minValue: 0, maxValue: 3, labels: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
            { id: 'q5', text: "Être tellement agité(e) qu'il est difficile de rester assis(e)", minValue: 0, maxValue: 3, labels: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
            { id: 'q6', text: 'Devenir facilement irritable ou irrité(e)', minValue: 0, maxValue: 3, labels: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
            { id: 'q7', text: "Avoir peur que quelque chose d'épouvantable puisse arriver", minValue: 0, maxValue: 3, labels: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'] },
          ],
          scoringRanges: [
            { min: 0, max: 4, label: 'Minimal', severity: 'minimal' },
            { min: 5, max: 9, label: 'Léger', severity: 'mild' },
            { min: 10, max: 14, label: 'Modéré', severity: 'moderate' },
            { min: 15, max: 21, label: 'Sévère', severity: 'severe' },
          ],
        },
      });
    }

    return this.prisma.assessmentTemplate.create({
      data: {
        type: 'CORE_OM',
        name: 'CORE-OM — Évaluation des résultats cliniques',
        description: 'Mesure le bien-être, les problèmes, le fonctionnement et les risques.',
        maxScore: 40,
        questions: Array.from({ length: 10 }, (_, i) => ({
          id: `q${i + 1}`,
          text: `Question CORE-OM ${i + 1}`,
          minValue: 0,
          maxValue: 4,
          labels: ['Jamais', 'Rarement', 'Parfois', 'Souvent', 'Presque toujours'],
        })),
        scoringRanges: [
          { min: 0, max: 5, label: 'Sain', severity: 'healthy' },
          { min: 6, max: 10, label: 'Léger', severity: 'low' },
          { min: 11, max: 15, label: 'Modéré', severity: 'moderate' },
          { min: 16, max: 20, label: 'Modérément sévère', severity: 'moderate_severe' },
          { min: 21, max: 40, label: 'Sévère', severity: 'severe' },
        ],
      },
    });
  }

  async createAssessment(dto: CreateAssessmentDto, userId: string) {
    const psy = await this.getPsychologist(userId);
    const template = await this.ensureTemplate(dto.type);

    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, psychologistId: psy.id },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');

    return this.prisma.assessment.create({
      data: {
        templateId: template.id,
        patientId: dto.patientId,
        psychologistId: psy.id,
        status: 'pending',
      },
      include: { template: true },
    });
  }

  async submitAssessment(id: string, dto: SubmitAssessmentDto, userId: string) {
    const psy = await this.getPsychologist(userId);

    const assessment = await this.prisma.assessment.findFirst({
      where: { id, psychologistId: psy.id },
      include: { template: true },
    });
    if (!assessment) throw new NotFoundException('Évaluation introuvable');
    if (assessment.status === 'completed') throw new ForbiddenException('Évaluation déjà complétée');

    const answersMap = dto.answers.reduce(
      (acc, a) => { acc[a.questionId] = a.value; return acc; },
      {} as Record<string, number>,
    );

    const result = this.scoring.score(assessment.template.type, answersMap);
    const encryptedAnswers = this.encryption.encrypt(JSON.stringify(answersMap));

    const updated = await this.prisma.assessment.update({
      where: { id },
      data: {
        answers: encryptedAnswers,
        score: result.score,
        severity: result.severity,
        status: 'completed',
        completedAt: new Date(),
      },
      include: { template: true },
    });

    await this.audit.log({
      actorId: psy.userId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'assessment',
      entityId: id,
    });

    return { ...updated, answers: undefined, scoringResult: result };
  }

  async getPatientAssessments(patientId: string, userId: string) {
    const psy = await this.getPsychologist(userId);

    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId: psy.id },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');

    return this.prisma.assessment.findMany({
      where: { patientId, psychologistId: psy.id, status: 'completed' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        score: true,
        severity: true,
        status: true,
        completedAt: true,
        createdAt: true,
        template: {
          select: { type: true, name: true, maxScore: true, scoringRanges: true },
        },
      },
    });
  }

  async getPatientEvolution(patientId: string, userId: string, type?: AssessmentType) {
    const psy = await this.getPsychologist(userId);

    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId: psy.id },
    });
    if (!patient) throw new NotFoundException('Patient introuvable');

    const assessments = await this.prisma.assessment.findMany({
      where: {
        patientId,
        psychologistId: psy.id,
        status: 'completed',
        ...(type ? { template: { type } } : {}),
      },
      orderBy: { completedAt: 'asc' },
      select: {
        id: true,
        score: true,
        severity: true,
        completedAt: true,
        createdAt: true,
        template: {
          select: { type: true, name: true, maxScore: true, scoringRanges: true },
        },
      },
    });

    const byType = assessments.reduce(
      (acc, a) => {
        const t = a.template.type;
        if (!acc[t]) acc[t] = [];
        acc[t].push(a);
        return acc;
      },
      {} as Record<string, typeof assessments>,
    );

    return {
      patientId,
      patientName: patient.name,
      series: Object.entries(byType).map(([t, items]) => ({
        type: t,
        name: items[0]?.template.name,
        maxScore: items[0]?.template.maxScore,
        scoringRanges: items[0]?.template.scoringRanges,
        dataPoints: items.map((i) => ({
          date: i.completedAt ?? i.createdAt,
          score: i.score,
          severity: i.severity,
        })),
      })),
    };
  }

  async getOverview(userId: string) {
    const psy = await this.getPsychologist(userId);

    const recent = await this.prisma.assessment.findMany({
      where: { psychologistId: psy.id, status: 'completed' },
      orderBy: { completedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        score: true,
        severity: true,
        status: true,
        completedAt: true,
        patient: { select: { id: true, name: true } },
        template: { select: { type: true, name: true, maxScore: true } },
      },
    });

    const totalCount = await this.prisma.assessment.count({
      where: { psychologistId: psy.id, status: 'completed' },
    });

    return { totalCount, recent };
  }
}
