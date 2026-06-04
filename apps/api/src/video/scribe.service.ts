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

const SCRIBE_SYSTEM_PROMPT = `Tu es un assistant pour psychologue clinicien.
Tu reçois la transcription brute d'une séance de psychothérapie.
Génère une note clinique structurée en JSON. Sois factuel, sobre, professionnel.
N'invente rien. Si une information manque, laisse le champ vide (chaîne vide).
RÈGLES ABSOLUES :
- Ne jamais formuler de diagnostic médical ou psychiatrique
- Ne jamais interpréter au-delà de ce qui est explicitement dit
- Toujours inclure le disclaimer

Réponds UNIQUEMENT avec ce JSON (pas de markdown, pas de texte autour) :
{
  "motif": "Motif de consultation en 1-2 phrases",
  "contenu": "Résumé de la séance en 3-5 paragraphes (style clinique sobre)",
  "thematiques": ["tag1", "tag2"],
  "plan_therapeutique": "Prochaines étapes et orientations thérapeutiques",
  "points_vigilance": "Points d'attention éventuels (chaîne vide si rien)",
  "disclaimer": "Note générée par IA à partir d'une transcription automatique — à réviser et valider par le praticien avant tout usage clinique."
}`;

@Injectable()
export class ScribeService {
  private readonly logger = new Logger(ScribeService.name);
  private readonly openaiApiKey: string;
  private readonly openrouterApiKey: string;
  private readonly openrouterBaseUrl: string;
  private readonly modelMain: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {
    this.openaiApiKey = this.config.get<string>('OPENAI_API_KEY', '');
    this.openrouterApiKey = this.config.get<string>('OPENROUTER_API_KEY', '');
    this.openrouterBaseUrl = this.config.get<string>('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1');
    this.modelMain = this.config.get<string>('OPENROUTER_MODEL_MAIN', 'anthropic/claude-sonnet-4');
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    if (!this.openaiApiKey) throw new Error('OPENAI_API_KEY manquante — transcription impossible');

    const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', blob, 'session.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'fr');
    formData.append('response_format', 'text');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.openaiApiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Whisper API ${response.status}: ${body.slice(0, 200)}`);
    }

    return response.text();
  }

  async generateNote(transcript: string): Promise<ScribeNote> {
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
          { role: 'system', content: SCRIBE_SYSTEM_PROMPT },
          { role: 'user', content: `Transcription de séance :\n\n${transcript}` },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenRouter ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices?.[0]?.message?.content ?? '{}';

    try {
      return JSON.parse(content) as ScribeNote;
    } catch {
      throw new Error(`Note JSON invalide : ${content.slice(0, 100)}`);
    }
  }

  async processScribeJob(videoRoomId: string, audioFilePath: string): Promise<void> {
    let audioBuffer: Buffer;
    try {
      audioBuffer = fs.readFileSync(audioFilePath);
    } catch {
      this.logger.error(`Fichier audio introuvable : ${audioFilePath}`);
      await this.markFailed(videoRoomId);
      return;
    } finally {
      fs.unlink(audioFilePath, () => {});
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
      return;
    }

    const sessionId = room.appointment.sessionId;

    try {
      this.logger.log(`Scribe: transcription Whisper pour room ${videoRoomId}`);
      const transcript = await this.transcribeAudio(audioBuffer);

      this.logger.log(`Scribe: génération note Claude pour room ${videoRoomId}`);
      const note = await this.generateNote(transcript);

      const formattedNote = [
        `**Motif :** ${note.motif}`,
        '',
        note.contenu,
        '',
        `**Plan thérapeutique :** ${note.plan_therapeutique}`,
        note.points_vigilance ? `\n**Points de vigilance :** ${note.points_vigilance}` : '',
        '',
        `---\n*${note.disclaimer}*`,
      ].filter((l) => l !== undefined).join('\n');

      const encryptedTranscript = this.encryption.encrypt(transcript);
      const encryptedSummary = this.encryption.encrypt(formattedNote);

      if (sessionId) {
        await this.prisma.session.update({
          where: { id: sessionId },
          data: {
            scribeTranscript: encryptedTranscript,
            summaryAi: encryptedSummary,
            tags: note.thematiques,
          },
        });
      }

      await this.prisma.videoRoom.update({
        where: { id: videoRoomId },
        data: { scribeStatus: 'done' },
      });

      await this.prisma.aiUsage.create({
        data: {
          psychologistId: room.psychologistId,
          feature: 'session_scribe',
          tokensUsed: Math.round(transcript.length / 4),
          model: this.modelMain,
          costUsd: 0,
        },
      });

      await this.notifications.createNotification({
        userId: room.psychologist.userId,
        type: 'ai_complete',
        title: 'Note générée par le Scribe IA',
        body: 'La transcription de votre séance a été traitée. La note est disponible dans la fiche de séance.',
        data: { sessionId: sessionId ?? null, videoRoomId },
      });

      await this.audit.log({
        actorId: room.psychologistId,
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
      await this.notifications.createNotification({
        userId: room.psychologist.userId,
        type: 'ai_complete',
        title: 'Scribe IA : échec de traitement',
        body: 'La génération automatique de la note a échoué. Vous pouvez rédiger votre note manuellement.',
        data: { videoRoomId },
      });
      await this.audit.log({
        actorId: room.psychologistId,
        actorType: 'system',
        action: 'AI_SCRIBE_FAILED',
        entityType: 'video_room',
        entityId: videoRoomId,
        metadata: { error: String(err).slice(0, 200) },
      });
    }
  }

  private async markFailed(videoRoomId: string) {
    await this.prisma.videoRoom.update({
      where: { id: videoRoomId },
      data: { scribeStatus: 'failed' },
    }).catch(() => {});
  }
}
