import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import {
  getSessionSummaryPrompt,
  EXTRACTION_PROMPT,
} from './prompts/session-summary.prompts';
import { Response } from 'express';
import { NotificationsService } from '../notifications/notifications.service';

export interface SessionSummaryDto {
  rawNotes: string;
  context?: string;
  sessionId: string;
}

export interface GenerateExerciseDto {
  patientContext: string; // Contexte anonymisé — jamais de nom
  theme: string;
  exerciseType: 'breathing' | 'journaling' | 'exposure' | 'mindfulness' | 'cognitive';
}

export interface GenerateContentDto {
  type: 'linkedin' | 'newsletter' | 'blog';
  theme: string;
  tone?: 'professional' | 'warm' | 'educational';
}

export interface StreamContentDto {
  type: 'linkedin' | 'newsletter' | 'blog';
  theme: string;
  tone?: 'professional' | 'warm' | 'educational';
}

const SYSTEM_PROMPTS = {
  exercise: `Tu es un assistant pour psychologues. Génère un exercice thérapeutique personnalisé.
Format JSON :
{
  "title": "Nom de l'exercice",
  "description": "Description détaillée pour le patient (2-3 paragraphes)",
  "instructions": ["étape 1", "étape 2"],
  "duration": "durée estimée",
  "frequency": "fréquence recommandée",
  "disclaimer": "Texte de disclaimer médical"
}`,

  content: `Tu es un assistant marketing pour le fondateur de PsyLib, un SaaS de gestion de cabinet pour psychologues libéraux.
Le fondateur n'est PAS psychologue — sa compagne est psychologue libérale, et c'est en la voyant galérer avec l'administratif qu'il a décidé de construire PsyLib.
L'angle éditorial : authenticité, proximité avec le terrain, compréhension du métier de psy via le vécu quotidien avec sa compagne.
Ton : humain, transparent, jamais corporate. On raconte une vraie histoire, pas un pitch.
RÈGLE ABSOLUE : N'utilise JAMAIS de données patients, même anonymisées.`,
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private aiApiKey!: string | null;
  private aiBaseUrl!: string;
  private modelMain!: string;
  private modelFast!: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly encryption: EncryptionService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    this.aiApiKey = this.config.get<string>('OPENROUTER_API_KEY') ?? null;
    this.aiBaseUrl = this.config.get<string>('OPENROUTER_BASE_URL') ?? 'https://openrouter.ai/api/v1';
    this.modelMain = this.config.get<string>('OPENROUTER_MODEL_MAIN') ?? 'anthropic/claude-sonnet-4';
    this.modelFast = this.config.get<string>('OPENROUTER_MODEL_FAST') ?? 'anthropic/claude-haiku-4';
    if (!this.aiApiKey) {
      this.logger.warn('Aucune cle IA configuree (OPENROUTER_API_KEY)');
    }
  }

  private requireAiKey(): string {
    if (!this.aiApiKey) {
      throw new BadRequestException('Cle IA non configuree. Ajoutez OPENROUTER_API_KEY dans .env');
    }
    return this.aiApiKey;
  }

  /**
   * Vérifie que le patient a donné son consentement pour le traitement IA
   */
  private async checkAiConsent(sessionId: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { patientId: true },
    });
    if (!session) return;

    const consent = await this.prisma.gdprConsent.findFirst({
      where: {
        patientId: session.patientId,
        type: 'ai_processing',
        withdrawnAt: null,
      },
    });

    if (!consent) {
      throw new ForbiddenException(
        'Le patient n\'a pas donné son consentement pour le traitement IA. '
        + 'Demandez-lui d\'accepter le consentement "Traitement IA" dans son espace patient.',
      );
    }
  }

  /**
   * Phase 1 — Collect patient history (last 15 sessions).
   * Decrypts summaries/notes and builds a formatted dossier string.
   * Filtered by psychologistId for tenant isolation.
   */
  private async collectPatientHistory(
    sessionId: string,
    psychologistId: string,
  ): Promise<{ dossier: string; orientation: import('@prisma/client').TherapyOrientation | null; date: Date | null; duration: number | null }> {
    const currentSession = await this.prisma.session.findFirst({
      where: { id: sessionId, psychologistId },
      select: { patientId: true, orientation: true, date: true, duration: true },
    });

    if (!currentSession) {
      return { dossier: 'Aucun historique disponible', orientation: null, date: null, duration: null };
    }

    const pastSessions = await this.prisma.session.findMany({
      where: {
        patientId: currentSession.patientId,
        psychologistId,
        id: { not: sessionId },
      },
      orderBy: { date: 'desc' },
      take: 15,
      select: {
        date: true,
        duration: true,
        orientation: true,
        tags: true,
        notes: true,
        summaryAi: true,
      },
    });

    if (pastSessions.length === 0) {
      return {
        dossier: 'Aucun historique disponible',
        orientation: currentSession.orientation,
        date: currentSession.date,
        duration: currentSession.duration,
      };
    }

    const entries = pastSessions.map((s) => {
      const dateStr = s.date.toISOString().split('T')[0];
      const orientationStr = s.orientation ?? 'Non spécifiée';
      const tagsStr = s.tags.length > 0 ? `Tags: ${s.tags.join(', ')}` : '';

      let summaryText = 'Pas de résumé disponible';
      try {
        if (s.summaryAi) {
          summaryText = this.encryption.decrypt(s.summaryAi);
          if (summaryText.length > 800) {
            summaryText = summaryText.slice(0, 800) + '...';
          }
        } else if (s.notes) {
          const decryptedNotes = this.encryption.decrypt(s.notes);
          summaryText = decryptedNotes.slice(0, 500) + (decryptedNotes.length > 500 ? '...' : '');
        }
      } catch {
        summaryText = '[Notes indisponibles]';
      }

      return [
        `[${dateStr}] Séance ${s.duration}min (${orientationStr})`,
        tagsStr,
        `Résumé: ${summaryText}`,
        '',
      ].filter(Boolean).join('\n');
    });

    return {
      dossier: `=== Historique patient (${pastSessions.length} dernières séances) ===\n\n${entries.join('\n')}`,
      orientation: currentSession.orientation,
      date: currentSession.date,
      duration: currentSession.duration,
    };
  }

  /**
   * Phase 3 — Extract structured data from the narrative summary using a fast model.
   */
  private async extractStructuredData(
    summaryText: string,
    psychologistId: string,
  ): Promise<{ data: Record<string, unknown>; tokens: number } | null> {
    const apiKey = this.requireAiKey();
    const startedAt = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      const response = await fetch(`${this.aiBaseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://psylib.eu',
          'X-Title': 'PsyLib',
        },
        body: JSON.stringify({
          model: this.modelFast,
          max_tokens: 300,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: EXTRACTION_PROMPT },
            { role: 'user', content: summaryText },
          ],
        }),
      });
      clearTimeout(timeout);

      if (!response.ok) {
        this.logger.error(`OpenRouter extraction API error: ${response.status}`);
        return null;
      }

      const result = await response.json() as {
        choices: Array<{ message: { content: string } }>;
        usage?: { total_tokens: number };
      };

      const text = result.choices?.[0]?.message?.content ?? '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] ?? '{}') as Record<string, unknown>;
      const tokens = result.usage?.total_tokens ?? 0;

      await this.trackUsage(psychologistId, 'session_summary_extraction', tokens, startedAt, this.modelFast);

      return { data: parsed, tokens };
    } catch (error) {
      this.logger.error('Phase 3 extraction failed:', error);
      return null;
    }
  }

  /**
   * Résumé de séance — 3-Phase Pipeline with SSE Streaming
   *
   * Phase 1: Collect patient history (before SSE headers)
   * Phase 2: Stream narrative summary via Sonnet/GPT-4o (SSE)
   * Phase 3: Extract structured data via Haiku/GPT-4o-mini
   *
   * CRITIQUE : Les notes ne quittent le serveur qu'avec consentement explicite du patient
   */
  async streamSessionSummary(
    psychologistUserId: string,
    dto: SessionSummaryDto,
    res: Response,
  ): Promise<void> {
    const psy = await this.getPsychologist(psychologistUserId);

    if (!dto.rawNotes || dto.rawNotes.trim().length < 20) {
      throw new BadRequestException('Notes trop courtes pour générer un résumé');
    }

    await this.checkAiConsent(dto.sessionId);
    this.requireAiKey();

    // Phase 1: Collect patient history (before SSE headers)
    const { dossier, orientation, date, duration } = await this.collectPatientHistory(
      dto.sessionId,
      psy.id,
    );

    const orientationLabel = orientation ?? 'Non spécifiée';
    const dateStr = date ? date.toISOString().split('T')[0] : 'inconnue';
    const durationStr = duration ? `${duration}` : '?';
    const userMessage = `=== Notes de la séance du ${dateStr} ===\nOrientation: ${orientationLabel}\nDurée: ${durationStr} min\n\n${dto.rawNotes}\n\n${dossier}`;

    const systemPrompt = getSessionSummaryPrompt(orientation);

    // SSE headers (set AFTER Phase 1)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const startedAt = Date.now();
    let totalTokens = 0;
    let fullSummary = '';

    try {
      // Phase 2: Stream narrative summary
      await this.streamChat(
        userMessage,
        systemPrompt,
        this.modelMain,
        res,
        (tokens) => { totalTokens = tokens; },
        (text) => { fullSummary += text; },
      );

      await this.trackUsage(psy.id, 'session_summary', totalTokens, startedAt, this.modelMain);

      // Phase 3: Extract structured data
      if (fullSummary.length > 50 && !res.writableEnded) {
        const extraction = await this.extractStructuredData(fullSummary, psy.id);
        if (!res.writableEnded) {
          if (extraction) {
            res.write(`data: ${JSON.stringify({ type: 'structured', data: { ...extraction.data, model: this.modelMain } })}\n\n`);
          } else {
            res.write(`data: ${JSON.stringify({ type: 'structured_error' })}\n\n`);
          }
        }
      }

      // Notify psychologist that AI summary is ready
      void this.notifications.createAndDispatch(
        psychologistUserId,
        'ai_complete',
        'Résumé IA prêt',
        `Le résumé de séance a été généré avec succès`,
        { href: `/dashboard/sessions/${dto.sessionId}` },
      );

    } catch (error) {
      this.logger.error('AI streaming error:', error);
      if (!res.writableEnded) res.write(`data: ${JSON.stringify({ error: 'Erreur IA' })}\n\n`);
    } finally {
      if (!res.writableEnded) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }
  }

  /**
   * Contenu marketing — Streaming SSE
   * RÈGLE ABSOLUE : jamais de données patients
   */
  async streamContent(
    psychologistUserId: string,
    dto: StreamContentDto,
    res: Response,
  ): Promise<void> {
    const psy = await this.getPsychologist(psychologistUserId);

    this.requireAiKey();

    const typePrompts: Record<string, string> = {
      linkedin: 'Génère un post LinkedIn (max 300 mots, avec hashtags pertinents) pour le fondateur de PsyLib. Il n\'est pas psy — sa compagne est psychologue libérale. Il parle de son expérience en tant que développeur qui vit avec une psy et qui construit un SaaS pour les psys. Ton authentique et humain.',
      newsletter: 'Génère un article de newsletter (500-800 mots, avec titre accrocheur, introduction, corps structuré et conclusion) pour PsyLib, SaaS de gestion de cabinet pour psychologues. Angle : le fondateur dont la compagne est psy.',
      blog: 'Génère un article de blog SEO-optimisé (800-1200 mots, avec titre H1, sous-titres H2, introduction et conclusion) pour PsyLib. Le fondateur n\'est pas psy mais sa compagne l\'est — cet angle humanise le contenu.',
    };

    const toneGuide: Record<string, string> = {
      professional: 'Ton professionnel mais accessible. Pas corporate.',
      warm: 'Ton chaleureux et authentique, comme si tu racontais à un ami.',
      educational: 'Ton pédagogique et clair, vulgarisation accessible.',
    };

    const prompt = `${typePrompts[dto.type] ?? typePrompts['linkedin']}
Thème : ${dto.theme}
${toneGuide[dto.tone ?? 'professional']}

CONTEXTE : Le fondateur de PsyLib est développeur. Sa compagne est psychologue libérale. C'est en la voyant galérer chaque soir avec l'administratif qu'il a décidé de construire PsyLib.
RAPPEL ABSOLU : N'utilise JAMAIS de données patients réels.`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const startedAt = Date.now();
    let totalTokens = 0;

    try {
      await this.streamChat(
        prompt,
        SYSTEM_PROMPTS.content,
        this.modelMain,
        res,
        (tokens) => { totalTokens = tokens; },
        () => {},
      );
      await this.trackUsage(psy.id, 'marketing_content', totalTokens, startedAt, this.modelMain);
    } catch (error) {
      this.logger.error('AI content streaming error:', error);
      if (!res.writableEnded) res.write(`data: ${JSON.stringify({ error: 'Erreur IA' })}\n\n`);
    } finally {
      if (!res.writableEnded) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }
  }

  /**
   * Unified streaming via OpenRouter (OpenAI-compatible SSE format)
   */
  private async streamChat(
    userMessage: string,
    systemPrompt: string,
    model: string,
    res: Response,
    onComplete: (tokens: number) => void,
    onText: (text: string) => void,
  ): Promise<void> {
    const apiKey = this.requireAiKey();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000); // 60s for streaming
    const response = await fetch(`${this.aiBaseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://psylib.eu',
        'X-Title': 'PsyLib',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        stream: true,
        stream_options: { include_usage: true },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });
    clearTimeout(timeout);

    if (!response.ok || !response.body) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let totalTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') { onComplete(totalTokens); continue; }

        try {
          const parsed = JSON.parse(data) as {
            choices: Array<{ delta?: { content?: string } }>;
            usage?: { total_tokens: number };
          };
          const text = parsed.choices[0]?.delta?.content;
          if (text) {
            if (res.writableEnded) break;
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
            onText(text);
          }
          if (parsed.usage) totalTokens = parsed.usage.total_tokens;
        } catch { /* ignore */ }
      }
    }
  }

  async generateExercise(
    psychologistUserId: string,
    dto: GenerateExerciseDto & { patientId?: string },
  ): Promise<object> {
    await this.getPsychologist(psychologistUserId);

    // Vérifier le consentement IA si un patient est associé
    if (dto.patientId) {
      const consent = await this.prisma.gdprConsent.findFirst({
        where: {
          patientId: dto.patientId,
          type: 'ai_processing',
          withdrawnAt: null,
        },
      });
      if (!consent) {
        throw new ForbiddenException(
          'Le patient n\'a pas donné son consentement pour le traitement IA.',
        );
      }
    }

    this.requireAiKey();

    const prompt = `Type d'exercice: ${dto.exerciseType}
Thème thérapeutique: ${dto.theme}
Contexte patient (anonymisé): ${dto.patientContext}

Génère un exercice thérapeutique adapté au format JSON demandé.`;

    const result = await this.callAiJson(prompt, SYSTEM_PROMPTS.exercise);
    return result;
  }

  async generateContent(
    psychologistUserId: string,
    dto: GenerateContentDto,
  ): Promise<{ content: string; type: string }> {
    await this.getPsychologist(psychologistUserId);

    const typePrompts: Record<string, string> = {
      linkedin: 'Génère un post LinkedIn (max 300 mots) pour le fondateur de PsyLib, dont la compagne est psy libérale. Ton authentique, pas un pitch.',
      newsletter: 'Génère un article de newsletter (500-800 mots) pour PsyLib, SaaS pour psys. Le fondateur vit avec une psy.',
      blog: 'Génère un article de blog SEO-optimisé (800-1200 mots) pour PsyLib. Angle : fondateur dev, compagne psy libérale.',
    };

    const prompt = `${typePrompts[dto.type] ?? typePrompts['linkedin']}
Thème: ${dto.theme}
Ton: ${dto.tone ?? 'professional'}

CONTEXTE : Le fondateur est développeur. Sa compagne est psychologue libérale. C'est son vécu quotidien qui inspire PsyLib.
RAPPEL : N'utilise JAMAIS de données patients réels.`;

    const content = await this.callAiText(prompt, SYSTEM_PROMPTS.content);
    return { content, type: dto.type };
  }

  private async callAiJson(prompt: string, system: string): Promise<object> {
    const apiKey = this.requireAiKey();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const res = await fetch(`${this.aiBaseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://psylib.eu',
        'X-Title': 'PsyLib',
      },
      body: JSON.stringify({
        model: this.modelFast,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({})) as { error?: { message?: string } };
      throw new BadRequestException(errBody.error?.message ?? `Erreur IA (${res.status})`);
    }
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const text = data.choices?.[0]?.message?.content ?? '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch?.[0] ?? '{}') as object;
  }

  private async callAiText(prompt: string, system: string): Promise<string> {
    const apiKey = this.requireAiKey();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const res = await fetch(`${this.aiBaseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://psylib.eu',
        'X-Title': 'PsyLib',
      },
      body: JSON.stringify({
        model: this.modelMain,
        max_tokens: 2000,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({})) as { error?: { message?: string } };
      throw new BadRequestException(errBody.error?.message ?? `Erreur IA (${res.status})`);
    }
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices?.[0]?.message?.content ?? '';
  }

  private async trackUsage(
    psychologistId: string,
    feature: string,
    tokens: number,
    startedAt: number,
    model?: string,
  ): Promise<void> {
    const resolvedModel = model ?? this.modelFast;

    // Cost per 1M tokens (blended input/output average via OpenRouter)
    const costMap: Record<string, number> = {
      'anthropic/claude-sonnet-4': 3.0,
      'anthropic/claude-haiku-4': 0.25,
      'openai/gpt-4o': 2.5,
      'openai/gpt-4o-mini': 0.15,
      'google/gemini-2.5-flash': 0.15,
    };
    const costPer1M = costMap[resolvedModel] ?? 1.0;
    const costUsd = (tokens / 1_000_000) * costPer1M;

    try {
      await this.prisma.aiUsage.create({
        data: {
          psychologistId,
          feature,
          tokensUsed: tokens,
          model: resolvedModel,
          costUsd,
        },
      });
    } catch (e) {
      this.logger.error('Failed to track AI usage:', e);
    }
  }

  async saveMarketingContent(
    psychologistUserId: string,
    dto: { type: string; theme: string; tone: string; content: string },
  ) {
    const psy = await this.getPsychologist(psychologistUserId);
    return this.prisma.marketingContent.create({
      data: {
        psychologistId: psy.id,
        type: dto.type,
        theme: dto.theme,
        tone: dto.tone,
        content: dto.content,
      },
    });
  }

  async getMarketingContents(psychologistUserId: string) {
    const psy = await this.getPsychologist(psychologistUserId);
    return this.prisma.marketingContent.findMany({
      where: { psychologistId: psy.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        theme: true,
        tone: true,
        content: true,
        createdAt: true,
      },
    });
  }

  async deleteMarketingContent(psychologistUserId: string, contentId: string) {
    const psy = await this.getPsychologist(psychologistUserId);
    const content = await this.prisma.marketingContent.findFirst({
      where: { id: contentId, psychologistId: psy.id },
    });
    if (!content) throw new ForbiddenException('Contenu introuvable');
    await this.prisma.marketingContent.delete({ where: { id: contentId } });
    return { deleted: true };
  }

  private async getPsychologist(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');
    return psy;
  }
}
