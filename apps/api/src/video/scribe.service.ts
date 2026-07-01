import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { AuditService } from '../common/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as fs from 'fs';

export interface ScribeNote {
  motif: string;
  contenu: string;
  thematiques: string[];
  plan_therapeutique: string;
  points_vigilance: string;
  disclaimer: string;
}

/** Section d'un modèle de note personnalisé (cf. NoteTemplate.sections). */
export interface ScribeTemplateSection {
  id: string;
  title: string;
  placeholder?: string;
  required?: boolean;
}

/** Modèle structurant la note générée par l'IA (choisi par le psy). */
export interface ScribeTemplate {
  name: string;
  sections: ScribeTemplateSection[];
}

/** Note IA structurée selon un modèle personnalisé. */
export interface TemplatedScribeNote {
  sections: Array<{ title: string; content: string }>;
  thematiques: string[];
  disclaimer: string;
}

/** Résultat unifié : note formatée (markdown) + tags thématiques. */
export interface ScribeOutput {
  formattedNote: string;
  tags: string[];
}

const DEFAULT_DISCLAIMER =
  "Note générée par IA à partir d'une transcription automatique — à réviser et valider par le praticien avant tout usage clinique.";

const SCRIBE_RULES = `RÈGLES ABSOLUES :
- Ne jamais formuler de diagnostic médical ou psychiatrique
- Ne jamais interpréter au-delà de ce qui est explicitement dit
- Sois factuel, sobre, professionnel. N'invente rien.
- Si une information manque, laisse le champ vide (chaîne vide).
- Toujours inclure le disclaimer`;

const SCRIBE_SYSTEM_PROMPT = `Tu es un assistant pour psychologue clinicien.
Tu reçois la transcription brute d'une séance de psychothérapie.
Génère une note clinique structurée en JSON.
${SCRIBE_RULES}

Réponds UNIQUEMENT avec ce JSON (pas de markdown, pas de texte autour) :
{
  "motif": "Motif de consultation en 1-2 phrases",
  "contenu": "Résumé de la séance en 3-5 paragraphes (style clinique sobre)",
  "thematiques": ["tag1", "tag2"],
  "plan_therapeutique": "Prochaines étapes et orientations thérapeutiques",
  "points_vigilance": "Points d'attention éventuels (chaîne vide si rien)",
  "disclaimer": "${DEFAULT_DISCLAIMER}"
}`;

/**
 * Construit le prompt système quand le psy a choisi un modèle de note.
 * L'IA remplit chaque section du modèle à partir de la transcription.
 */
export function buildTemplatedSystemPrompt(template: ScribeTemplate): string {
  const sectionsList = template.sections
    .map((s, i) => {
      const hint = s.placeholder ? ` — ${s.placeholder}` : '';
      return `  ${i + 1}. "${s.title}"${hint}`;
    })
    .join('\n');

  return `Tu es un assistant pour psychologue clinicien.
Tu reçois la transcription brute d'une séance de psychothérapie.
Tu dois rédiger une note clinique en suivant STRICTEMENT le modèle « ${template.name} » du praticien, section par section.
${SCRIBE_RULES}
- Conserve l'ordre et l'intitulé exact des sections du modèle.
- Si une section n'est pas couverte par la transcription, mets une chaîne vide dans "content".

Sections du modèle à remplir :
${sectionsList}

Réponds UNIQUEMENT avec ce JSON (pas de markdown, pas de texte autour) :
{
  "sections": [{ "title": "Intitulé exact de la section", "content": "Contenu rédigé pour cette section" }],
  "thematiques": ["tag1", "tag2"],
  "disclaimer": "${DEFAULT_DISCLAIMER}"
}`;
}

/** Formate une note standard (sans modèle) en markdown. */
export function formatDefaultNote(note: ScribeNote): string {
  return [
    `**Motif :** ${note.motif}`,
    '',
    note.contenu,
    '',
    `**Plan thérapeutique :** ${note.plan_therapeutique}`,
    note.points_vigilance ? `\n**Points de vigilance :** ${note.points_vigilance}` : '',
    '',
    `---\n*${note.disclaimer || DEFAULT_DISCLAIMER}*`,
  ]
    .filter((l) => l !== undefined)
    .join('\n');
}

/** Formate une note structurée selon un modèle personnalisé en markdown. */
export function formatTemplatedNote(note: TemplatedScribeNote): string {
  const body = note.sections
    .map((s) => `**${s.title}**\n${s.content?.trim() ? s.content.trim() : '_(non abordé)_'}`)
    .join('\n\n');
  return [body, '', `---\n*${note.disclaimer || DEFAULT_DISCLAIMER}*`].join('\n');
}

@Injectable()
export class ScribeService {
  private readonly logger = new Logger(ScribeService.name);
  private readonly openrouterApiKey: string;
  private readonly openrouterBaseUrl: string;
  private readonly modelMain: string;
  // Transcription (Whisper) — provider-configurable so it can point at an
  // EU-hosted, OpenAI-compatible endpoint (ex. OVHcloud AI Endpoints, France)
  // instead of OpenAI. Defaults keep the previous OpenAI behaviour.
  private readonly transcriptionBaseUrl: string;
  private readonly transcriptionModel: string;
  private readonly transcriptionApiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {
    this.openrouterApiKey = this.config.get<string>('OPENROUTER_API_KEY', '');
    this.openrouterBaseUrl = this.config.get<string>('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1');
    this.modelMain = this.config.get<string>('OPENROUTER_MODEL_MAIN', 'anthropic/claude-sonnet-4');
    // Transcription config (falls back to OpenAI Whisper if the dedicated vars are absent).
    this.transcriptionBaseUrl = this.config
      .get<string>('TRANSCRIPTION_BASE_URL', 'https://api.openai.com/v1')
      .replace(/\/+$/, '');
    this.transcriptionModel = this.config.get<string>('TRANSCRIPTION_MODEL', 'whisper-1');
    this.transcriptionApiKey =
      this.config.get<string>('TRANSCRIPTION_API_KEY', '') ||
      this.config.get<string>('OPENAI_API_KEY', '');
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    if (!this.transcriptionApiKey) {
      throw new Error('Clé de transcription manquante (TRANSCRIPTION_API_KEY / OPENAI_API_KEY) — transcription impossible');
    }

    const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', blob, 'session.webm');
    formData.append('model', this.transcriptionModel);
    formData.append('language', 'fr');
    formData.append('response_format', 'text');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);
    try {
      const response = await fetch(`${this.transcriptionBaseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.transcriptionApiKey}` },
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Whisper API ${response.status}: ${body.slice(0, 200)}`);
      }

      return response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /** Appel LLM brut renvoyant le JSON parsé. */
  private async callLlm<T>(systemPrompt: string, transcript: string, maxTokens: number): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);
    try {
      const response = await fetch(`${this.openrouterBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://psylib.eu',
          'X-Title': 'PsyLib AI Scribe',
        },
        body: JSON.stringify({
          model: this.modelMain,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Transcription de séance :\n\n${transcript}` },
          ],
          response_format: { type: 'json_object' },
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`OpenRouter ${response.status}: ${body.slice(0, 200)}`);
      }

      const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
      const content = data.choices?.[0]?.message?.content ?? '{}';

      try {
        return JSON.parse(content) as T;
      } catch {
        throw new Error(`Note JSON invalide : ${content.slice(0, 100)}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async generateNote(transcript: string): Promise<ScribeNote> {
    return this.callLlm<ScribeNote>(SCRIBE_SYSTEM_PROMPT, transcript, 2000);
  }

  async generateTemplatedNote(transcript: string, template: ScribeTemplate): Promise<TemplatedScribeNote> {
    return this.callLlm<TemplatedScribeNote>(buildTemplatedSystemPrompt(template), transcript, 2500);
  }

  /**
   * Transcription déjà faite → génère et formate la note.
   * Si un modèle est fourni, la note suit la trame du psy ; sinon format standard.
   */
  async buildNote(transcript: string, template?: ScribeTemplate | null): Promise<ScribeOutput> {
    if (template && template.sections.length > 0) {
      const note = await this.generateTemplatedNote(transcript, template);
      return { formattedNote: formatTemplatedNote(note), tags: note.thematiques ?? [] };
    }
    const note = await this.generateNote(transcript);
    return { formattedNote: formatDefaultNote(note), tags: note.thematiques ?? [] };
  }

  /** Pipeline Scribe pour une visio (room → session liée). */
  async processScribeJob(videoRoomId: string, audioFilePath: string): Promise<void> {
    let audioBuffer: Buffer;
    try {
      audioBuffer = fs.readFileSync(audioFilePath);
    } catch {
      this.logger.error(`Fichier audio introuvable : ${audioFilePath}`);
      await this.markFailed(videoRoomId);
      return;
    }

    const room = await this.prisma.videoRoom.findUnique({
      where: { id: videoRoomId },
      include: {
        appointment: { select: { sessionId: true, patientId: true } },
        psychologist: { select: { userId: true } },
      },
    });

    if (!room) {
      this.logger.error(`VideoRoom ${videoRoomId} introuvable`);
      fs.unlink(audioFilePath, () => {});
      return;
    }

    const sessionId = room.appointment.sessionId;

    try {
      this.logger.log(`Scribe: transcription Whisper pour room ${videoRoomId}`);
      const transcript = await this.transcribeAudio(audioBuffer);

      this.logger.log(`Scribe: génération note pour room ${videoRoomId}`);
      const { formattedNote, tags } = await this.buildNote(transcript);

      const encryptedTranscript = this.encryption.encrypt(transcript);
      const encryptedSummary = this.encryption.encrypt(formattedNote);

      if (sessionId) {
        await this.prisma.session.update({
          where: { id: sessionId },
          data: {
            scribeTranscript: encryptedTranscript,
            summaryAi: encryptedSummary,
            tags,
          },
        });
      }

      await this.prisma.videoRoom.update({
        where: { id: videoRoomId },
        data: { scribeStatus: 'done' },
      });

      await this.recordUsage(room.psychologistId, transcript, audioBuffer.length);

      await this.notifications.createAndDispatch(
        room.psychologist.userId,
        'ai_complete',
        'Note générée par le Scribe IA',
        'La transcription de votre séance a été traitée. La note est disponible dans la fiche de séance.',
        { sessionId: sessionId ?? null, videoRoomId },
      );

      await this.audit.log({
        actorId: room.psychologist.userId,
        actorType: 'system',
        action: 'AI_SCRIBE_COMPLETE',
        entityType: 'video_room',
        entityId: videoRoomId,
        metadata: { sessionId, transcriptLength: transcript.length },
      });

      this.logger.log(`Scribe: terminé avec succès pour room ${videoRoomId}`);
    } catch (err) {
      this.logger.error(`Scribe: échec pour room ${videoRoomId}: ${err}`);
      await this.markFailed(videoRoomId);
      await this.notifications.createAndDispatch(
        room.psychologist.userId,
        'ai_complete',
        'Scribe IA : échec de traitement',
        'La génération automatique de la note a échoué. Vous pouvez rédiger votre note manuellement.',
        { videoRoomId },
      );
      await this.audit.log({
        actorId: room.psychologist.userId,
        actorType: 'system',
        action: 'AI_SCRIBE_FAILED',
        entityType: 'video_room',
        entityId: videoRoomId,
        metadata: { error: String(err).slice(0, 200) },
      });
    } finally {
      fs.unlink(audioFilePath, () => {});
    }
  }

  /**
   * Pipeline Scribe pour un import audio attaché directement à une séance
   * (présentiel — sans visio). La note suit le modèle de la séance si défini.
   */
  async processSessionScribeJob(sessionId: string, audioFilePath: string): Promise<void> {
    let audioBuffer: Buffer;
    try {
      audioBuffer = fs.readFileSync(audioFilePath);
    } catch {
      this.logger.error(`Fichier audio introuvable : ${audioFilePath}`);
      await this.markSessionFailed(sessionId);
      return;
    }

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        psychologist: { select: { userId: true } },
        template: { select: { name: true, sections: true } },
      },
    });

    if (!session) {
      this.logger.error(`Session ${sessionId} introuvable`);
      fs.unlink(audioFilePath, () => {});
      return;
    }

    const template = this.parseTemplate(session.template);

    try {
      this.logger.log(`Scribe: transcription Whisper pour séance ${sessionId}`);
      const transcript = await this.transcribeAudio(audioBuffer);

      this.logger.log(`Scribe: génération note pour séance ${sessionId} (modèle: ${template?.name ?? 'standard'})`);
      const { formattedNote, tags } = await this.buildNote(transcript, template);

      const encryptedTranscript = this.encryption.encrypt(transcript);
      const encryptedSummary = this.encryption.encrypt(formattedNote);

      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          scribeTranscript: encryptedTranscript,
          summaryAi: encryptedSummary,
          tags,
          scribeStatus: 'done',
        },
      });

      await this.recordUsage(session.psychologistId, transcript, audioBuffer.length);

      await this.notifications.createAndDispatch(
        session.psychologist.userId,
        'ai_complete',
        'Note générée par le Scribe IA',
        'La transcription de votre audio a été traitée. La note est disponible dans la fiche de séance.',
        { sessionId },
      );

      await this.audit.log({
        actorId: session.psychologist.userId,
        actorType: 'system',
        action: 'AI_SCRIBE_COMPLETE',
        entityType: 'session',
        entityId: sessionId,
        metadata: { transcriptLength: transcript.length, templated: !!template },
      });

      this.logger.log(`Scribe: terminé avec succès pour séance ${sessionId}`);
    } catch (err) {
      this.logger.error(`Scribe: échec pour séance ${sessionId}: ${err}`);
      await this.markSessionFailed(sessionId);
      await this.notifications.createAndDispatch(
        session.psychologist.userId,
        'ai_complete',
        'Scribe IA : échec de traitement',
        "La génération automatique de la note a échoué. Vous pouvez rédiger votre note manuellement.",
        { sessionId },
      );
      await this.audit.log({
        actorId: session.psychologist.userId,
        actorType: 'system',
        action: 'AI_SCRIBE_FAILED',
        entityType: 'session',
        entityId: sessionId,
        metadata: { error: String(err).slice(0, 200) },
      });
    } finally {
      fs.unlink(audioFilePath, () => {});
    }
  }

  /** Convertit le champ JSON `sections` d'un NoteTemplate en ScribeTemplate sûr. */
  private parseTemplate(
    template: { name: string; sections: unknown } | null,
  ): ScribeTemplate | null {
    if (!template || !Array.isArray(template.sections)) return null;
    const sections = (template.sections as Array<Record<string, unknown>>)
      .filter((s) => s && typeof s.title === 'string')
      .map((s) => ({
        id: typeof s.id === 'string' ? s.id : '',
        title: s.title as string,
        placeholder: typeof s.placeholder === 'string' ? s.placeholder : undefined,
      }));
    if (sections.length === 0) return null;
    return { name: template.name, sections };
  }

  private async recordUsage(psychologistId: string, transcript: string, audioBytes: number) {
    // Rough: audioBuffer.length bytes / 32000 bytes/sec (webm ~32kbps) / 60 sec/min * $0.006/min
    const estimatedMinutes = audioBytes / (32000 * 60);
    const estimatedCost = Math.round(estimatedMinutes * 0.006 * 100000) / 100000;
    await this.prisma.aiUsage.create({
      data: {
        psychologistId,
        feature: 'session_scribe',
        tokensUsed: Math.round(transcript.length / 4),
        model: this.modelMain,
        costUsd: estimatedCost,
      },
    });
  }

  private async markFailed(videoRoomId: string) {
    await this.prisma.videoRoom
      .update({ where: { id: videoRoomId }, data: { scribeStatus: 'failed' } })
      .catch(() => {});
  }

  private async markSessionFailed(sessionId: string) {
    await this.prisma.session
      .update({ where: { id: sessionId }, data: { scribeStatus: 'failed' } })
      .catch(() => {});
  }
}
