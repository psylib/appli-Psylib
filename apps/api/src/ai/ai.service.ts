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

  content: `Tu es un assistant marketing pour psychologues libéraux.
Génère du contenu professionnel et bienveillant.
RÈGLE ABSOLUE : N'utilise JAMAIS de données patients, même anonymisées.`,
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private aiProvider!: 'anthropic' | 'openai' | null;
  private aiApiKey!: string | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly encryption: EncryptionService,
  ) {}

  onModuleInit() {
    const anthropicKey = this.config.get<string>('ANTHROPIC_API_KEY');
    const openaiKey = this.config.get<string>('OPENAI_API_KEY');
    if (anthropicKey) {
      this.aiProvider = 'anthropic';
      this.aiApiKey = anthropicKey;
    } else if (openaiKey) {
      this.aiProvider = 'openai';
      this.aiApiKey = openaiKey;
    } else {
      this.aiProvider = null;
      this.aiApiKey = null;
      this.logger.warn('Aucune cle IA configuree (ANTHROPIC_API_KEY ou OPENAI_API_KEY)');
    }
  }

  private requireAiKey(): string {
    if (!this.aiApiKey) {
      throw new BadRequestException('Cle IA non configuree. Ajoutez ANTHROPIC_API_KEY ou OPENAI_API_KEY dans .env');
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
      if (this.aiProvider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 300,
            system: EXTRACTION_PROMPT,
            messages: [{ role: 'user', content: summaryText }],
          }),
        });

        const result = await response.json() as {
          content: Array<{ text: string }>;
          usage?: { input_tokens: number; output_tokens: number };
        };

        const text = result.content[0]?.text ?? '{}';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch?.[0] ?? '{}') as Record<string, unknown>;
        const tokens = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);

        await this.trackUsage(psychologistId, 'session_summary_extraction', tokens, startedAt, 'claude-haiku-4-5-20251001');

        return { data: parsed, tokens };
      } else {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            max_tokens: 300,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: EXTRACTION_PROMPT },
              { role: 'user', content: summaryText },
            ],
          }),
        });

        const result = await response.json() as {
          choices: Array<{ message: { content: string } }>;
          usage?: { total_tokens: number };
        };

        const text = result.choices[0]?.message?.content ?? '{}';
        const parsed = JSON.parse(text) as Record<string, unknown>;
        const tokens = result.usage?.total_tokens ?? 0;

        await this.trackUsage(psychologistId, 'session_summary_extraction', tokens, startedAt, 'gpt-4o-mini');

        return { data: parsed, tokens };
      }
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
      if (this.aiProvider === 'anthropic') {
        await this.streamSummaryAnthropic(
          userMessage,
          systemPrompt,
          res,
          (tokens) => { totalTokens = tokens; },
          (text) => { fullSummary += text; },
        );
      } else {
        await this.streamSummaryOpenAI(
          userMessage,
          systemPrompt,
          res,
          (tokens) => { totalTokens = tokens; },
          (text) => { fullSummary += text; },
        );
      }

      const phase2Model = this.aiProvider === 'anthropic' ? 'claude-sonnet-4-6' : 'gpt-4o';
      await this.trackUsage(psy.id, 'session_summary', totalTokens, startedAt, phase2Model);

      // Phase 3: Extract structured data
      if (fullSummary.length > 50) {
        const extraction = await this.extractStructuredData(fullSummary, psy.id);
        if (extraction) {
          res.write(`data: ${JSON.stringify({ type: 'structured', data: { ...extraction.data, model: phase2Model } })}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ type: 'structured_error' })}\n\n`);
        }
      }

    } catch (error) {
      this.logger.error('AI streaming error:', error);
      res.write(`data: ${JSON.stringify({ error: 'Erreur IA' })}\n\n`);
    } finally {
      res.write('data: [DONE]\n\n');
      res.end();
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
      linkedin: 'Génère un post LinkedIn professionnel (max 300 mots, avec hashtags pertinents) pour un psychologue libéral.',
      newsletter: 'Génère un article de newsletter (500-800 mots, avec titre accrocheur, introduction, corps structuré et conclusion) informatif pour des patients.',
      blog: 'Génère un article de blog SEO-optimisé (800-1200 mots, avec titre H1, sous-titres H2, introduction et conclusion) sur la psychologie.',
    };

    const toneGuide: Record<string, string> = {
      professional: 'Ton professionnel et expert, vocabulaire précis.',
      warm: 'Ton chaleureux et bienveillant, proche du lecteur.',
      educational: 'Ton pédagogique et clair, vulgarisation accessible.',
    };

    const prompt = `${typePrompts[dto.type] ?? typePrompts['linkedin']}
Thème : ${dto.theme}
${toneGuide[dto.tone ?? 'professional']}

RAPPEL ABSOLU : N'utilise JAMAIS de données patients réels.`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const startedAt = Date.now();
    let totalTokens = 0;

    try {
      if (this.aiProvider === 'anthropic') {
        await this.streamSummaryAnthropic(
          prompt,
          SYSTEM_PROMPTS.content,
          res,
          (tokens) => { totalTokens = tokens; },
          () => {},
        );
      } else {
        await this.streamSummaryOpenAI(
          prompt,
          SYSTEM_PROMPTS.content,
          res,
          (tokens) => { totalTokens = tokens; },
          () => {},
        );
      }
      await this.trackUsage(psy.id, 'marketing_content', totalTokens, startedAt);
    } catch (error) {
      this.logger.error('AI content streaming error:', error);
      res.write(`data: ${JSON.stringify({ error: 'Erreur IA' })}\n\n`);
    } finally {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }

  private async streamSummaryAnthropic(
    userMessage: string,
    systemPrompt: string,
    res: Response,
    onComplete: (tokens: number) => void,
    onText: (text: string) => void,
  ): Promise<void> {
    const apiKey = this.requireAiKey();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let inputTokens = 0;
    let outputTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data) as {
            type: string;
            delta?: { type: string; text?: string };
            usage?: { input_tokens: number; output_tokens: number };
            message?: { usage: { input_tokens: number; output_tokens: number } };
          };

          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            const text = parsed.delta.text ?? '';
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
            onText(text);
          }
          if (parsed.type === 'message_start' && parsed.message?.usage) {
            inputTokens = parsed.message.usage.input_tokens;
          }
          if (parsed.type === 'message_delta' && parsed.usage) {
            outputTokens = parsed.usage.output_tokens;
          }
        } catch { /* ignore parse errors */ }
      }
    }

    onComplete(inputTokens + outputTokens);
  }

  private async streamSummaryOpenAI(
    userMessage: string,
    systemPrompt: string,
    res: Response,
    onComplete: (tokens: number) => void,
    onText: (text: string) => void,
  ): Promise<void> {
    const apiKey = this.requireAiKey();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 2000,
        stream: true,
        stream_options: { include_usage: true },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`OpenAI API error: ${response.status}`);
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
      linkedin: 'Génère un post LinkedIn professionnel (max 300 mots) pour un psychologue.',
      newsletter: 'Génère un article de newsletter (500-800 mots) informatif pour patients.',
      blog: 'Génère un article de blog SEO-optimisé (800-1200 mots) sur la psychologie.',
    };

    const prompt = `${typePrompts[dto.type] ?? typePrompts['linkedin']}
Thème: ${dto.theme}
Ton: ${dto.tone ?? 'professional'}

RAPPEL : N'utilise JAMAIS de données patients réels.`;

    const content = await this.callAiText(prompt, SYSTEM_PROMPTS.content);
    return { content, type: dto.type };
  }

  private async callAiJson(prompt: string, system: string): Promise<object> {
    const apiKey = this.requireAiKey();
    if (this.aiProvider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          system,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json() as { content: Array<{ text: string }> };
      const text = data.content[0]?.text ?? '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch?.[0] ?? '{}') as object;
    }
    return {};
  }

  private async callAiText(prompt: string, system: string): Promise<string> {
    const apiKey = this.requireAiKey();
    if (this.aiProvider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          system,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json() as { content: Array<{ text: string }> };
      return data.content[0]?.text ?? '';
    }
    return '';
  }

  private async trackUsage(
    psychologistId: string,
    feature: string,
    tokens: number,
    startedAt: number,
    model?: string,
  ): Promise<void> {
    const resolvedModel = model ?? (this.aiProvider === 'anthropic' ? 'claude-haiku-4-5' : 'gpt-4o-mini');

    const costMap: Record<string, number> = {
      'claude-sonnet-4-6': 3.0,
      'claude-haiku-4-5-20251001': 0.25,
      'gpt-4o': 2.5,
      'gpt-4o-mini': 0.15,
    };
    const costPer1M = costMap[resolvedModel] ?? 0.25;
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
