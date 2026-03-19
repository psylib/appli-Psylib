import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Prisma, TherapyOrientation } from '@prisma/client';
import { CreateNoteTemplateDto, UpdateNoteTemplateDto } from './dto/note-templates.dto';

// Sections par orientation thérapeutique
const SYSTEM_TEMPLATES: Array<{
  orientation: TherapyOrientation;
  name: string;
  description: string;
  sections: Array<{ id: string; title: string; placeholder: string; required: boolean }>;
}> = [
  {
    orientation: 'TCC',
    name: 'Note TCC — Thérapie Cognitive et Comportementale',
    description: "Modèle structuré pour les séances TCC : pensées automatiques, émotions, comportements.",
    sections: [
      { id: 'presenting', title: "Motif de séance / Événement déclencheur", placeholder: "Situation ou événement qui a déclenché la détresse cette semaine...", required: true },
      { id: 'thoughts', title: "Pensées automatiques identifiées", placeholder: "Quelles pensées automatiques le patient a-t-il rapportées ? Distorsions cognitives observées (catastrophisation, pensée dichotomique, généralisation, etc.)...", required: false },
      { id: 'emotions', title: "Émotions et intensité (0-100)", placeholder: "Tristesse (80/100), anxiété (60/100)... Lien émotion-pensée discuté ?", required: false },
      { id: 'behaviors', title: "Comportements / Évitements", placeholder: "Comportements observés ou rapportés. Évitements identifiés. Schémas comportementaux...", required: false },
      { id: 'restructuring', title: "Restructuration cognitive effectuée", placeholder: "Technique utilisée : colonnes de Beck, questionnement socratique, etc. Pensée alternative élaborée...", required: false },
      { id: 'homework', title: "Tâches entre les séances (homework)", placeholder: "Exercices à réaliser : journal de pensées, exposition progressive, enregistrement comportemental...", required: false },
      { id: 'progress', title: "Évaluation des progrès / Plan thérapeutique", placeholder: "Évolution depuis la dernière séance. Objectifs de la prochaine séance...", required: false },
    ],
  },
  {
    orientation: 'PSYCHODYNAMIQUE',
    name: 'Note Psychodynamique',
    description: "Modèle pour l'approche psychodynamique et analytique : transfert, résistances, dynamiques inconscientes.",
    sections: [
      { id: 'presenting', title: "Thème central de séance", placeholder: "Thème dominant abordé, matériel apporté par le patient (rêves, associations libres, récits)...", required: true },
      { id: 'transference', title: "Transfert et contre-transfert", placeholder: "Éléments transférentiels observés. Résonance contre-transférentielle du thérapeute...", required: false },
      { id: 'defenses', title: "Mécanismes de défense / Résistances", placeholder: "Défenses repérées : projection, déni, intellectualisation, refoulement, etc. Résistances en séance...", required: false },
      { id: 'dynamics', title: "Dynamiques relationnelles et historiques", placeholder: "Liens avec l'histoire précoce, schémas relationnels répétés, conflits internes...", required: false },
      { id: 'interventions', title: "Interventions thérapeutiques", placeholder: "Clarifications, confrontations, interprétations proposées. Réaction du patient...", required: false },
      { id: 'evolution', title: "Évolution du processus thérapeutique", placeholder: "Mouvement psychique observé. Hypothèses cliniques actualisées...", required: false },
    ],
  },
  {
    orientation: 'SYSTEMIQUE',
    name: 'Note Systémique',
    description: "Modèle pour la thérapie systémique : dynamiques familiales, patterns relationnels, contexte.",
    sections: [
      { id: 'presenting', title: "Présentation du problème / Contexte systémique", placeholder: "Qui était présent ? Quel est le problème tel que défini par le système ? Contexte familial/professionnel...", required: true },
      { id: 'patterns', title: "Patterns relationnels et communication", placeholder: "Cycles interactionnels observés. Triangulations. Communications paradoxales. Alliances...", required: false },
      { id: 'genogram', title: "Observations génogramme / Histoire familiale", placeholder: "Éléments transgénérationnels. Répétitions. Mythes familiaux. Loyautés...", required: false },
      { id: 'hypotheses', title: "Hypothèses systémiques", placeholder: "Quelle fonction remplit le symptôme dans le système ? Hypothèse circulaire...", required: false },
      { id: 'interventions', title: "Interventions et recadrage", placeholder: "Questions circulaires posées. Recadrages proposés. Tâches prescrites. Paradoxes thérapeutiques...", required: false },
      { id: 'next', title: "Objectifs et prochaine séance", placeholder: "Changements à observer. Composition du groupe pour la prochaine séance...", required: false },
    ],
  },
  {
    orientation: 'ACT',
    name: "Note ACT — Thérapie d'Acceptation et d'Engagement",
    description: "Modèle pour l'ACT : flexibilité psychologique, valeurs, défusion, pleine conscience.",
    sections: [
      { id: 'presenting', title: "Difficultés rapportées / Fusion cognitive", placeholder: "Pensées ou émotions dont le patient est 'fusionné'. Lutte contre l'expérience intérieure...", required: true },
      { id: 'hexaflex', title: "Processus ACT travaillés (Hexaflex)", placeholder: "Acceptation, Défusion cognitive, Moment présent, Soi comme contexte, Valeurs, Engagement — lesquels ont été travaillés ?", required: false },
      { id: 'values', title: "Clarification des valeurs", placeholder: "Valeurs explorées. Écart entre vie actuelle et vie valorisée. Boussole de valeurs...", required: false },
      { id: 'defusion', title: "Exercices de défusion utilisés", placeholder: "Techniques utilisées : feuilles sur le courant, bus des passagers, reconnaissance des pensées, métaphores...", required: false },
      { id: 'mindfulness', title: "Pleine conscience / Moment présent", placeholder: "Exercices de mindfulness pratiqués. Observation de l'expérience sans jugement...", required: false },
      { id: 'committed', title: "Actions engagées", placeholder: "Engagements pris. Actions concrètes alignées avec les valeurs. Plan d'action...", required: false },
    ],
  },
  {
    orientation: 'AUTRE',
    name: 'Note Libre',
    description: "Modèle général non orienté — structure libre adaptable à toute approche.",
    sections: [
      { id: 'presenting', title: "Motif de séance", placeholder: "Raison de la consultation, problème présenté...", required: true },
      { id: 'content', title: "Contenu de la séance", placeholder: "Résumé des échanges, thèmes abordés...", required: true },
      { id: 'clinical', title: "Observations cliniques", placeholder: "État du patient, comportement en séance, observations pertinentes...", required: false },
      { id: 'interventions', title: "Interventions thérapeutiques", placeholder: "Techniques utilisées, réponse du patient...", required: false },
      { id: 'plan', title: "Plan et suite", placeholder: "Objectifs, tâches, prochaine séance...", required: false },
    ],
  },
];

@Injectable()
export class NoteTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureSystemTemplates(): Promise<void> {
    const count = await this.prisma.noteTemplate.count({ where: { isSystem: true } });
    if (count > 0) return;

    await this.prisma.noteTemplate.createMany({
      data: SYSTEM_TEMPLATES.map((t) => ({
        orientation: t.orientation,
        name: t.name,
        description: t.description,
        sections: t.sections as unknown as Prisma.InputJsonValue,
        isSystem: true,
        isActive: true,
      })),
      skipDuplicates: true,
    });
  }

  async getTemplates(userId: string) {
    await this.ensureSystemTemplates();
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });

    return this.prisma.noteTemplate.findMany({
      where: {
        isActive: true,
        OR: [
          { isSystem: true },
          ...(psy ? [{ psychologistId: psy.id }] : []),
        ],
      },
      orderBy: [{ isSystem: 'desc' }, { orientation: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true, orientation: true, name: true, description: true,
        sections: true, isSystem: true, isActive: true, createdAt: true,
      },
    });
  }

  async getTemplatesByOrientation(userId: string, orientation: TherapyOrientation) {
    await this.ensureSystemTemplates();
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });

    return this.prisma.noteTemplate.findMany({
      where: {
        orientation,
        isActive: true,
        OR: [
          { isSystem: true },
          ...(psy ? [{ psychologistId: psy.id }] : []),
        ],
      },
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createTemplate(dto: CreateNoteTemplateDto, userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    return this.prisma.noteTemplate.create({
      data: {
        psychologistId: psy.id,
        orientation: dto.orientation,
        name: dto.name,
        description: dto.description,
        sections: dto.sections as unknown as Prisma.InputJsonValue,
        isSystem: false,
      },
    });
  }

  async updateTemplate(id: string, dto: UpdateNoteTemplateDto, userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const template = await this.prisma.noteTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template introuvable');
    if (template.isSystem) throw new ForbiddenException('Impossible de modifier un template système');
    if (template.psychologistId !== psy.id) throw new ForbiddenException();

    return this.prisma.noteTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sections !== undefined && { sections: dto.sections as unknown as Prisma.InputJsonValue }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteTemplate(id: string, userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const template = await this.prisma.noteTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template introuvable');
    if (template.isSystem) throw new ForbiddenException('Impossible de supprimer un template système');
    if (template.psychologistId !== psy.id) throw new ForbiddenException();

    await this.prisma.noteTemplate.delete({ where: { id } });
    return { deleted: true };
  }
}
