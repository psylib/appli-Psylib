import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
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
  sessionSummary: `Tu es un assistant pour psychologues. Génère un résumé structuré de séance thérapeutique.
Format de sortie en Markdown :
## Résumé de séance
[Synthèse en 2-3 phrases]

## Thèmes abordés
- [thème 1]
- [thème 2]

## Points de suivi
- [point 1]

## Suggestions pour la prochaine séance
- [suggestion 1]

RÈGLES ABSOLUES :
- Garde uniquement les informations cliniques pertinentes
- N'invente aucune information non présente dans les notes
- Rappelle que ce résumé est un outil d'aide et que le praticien reste responsable`,

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
   * Résumé de séance — Streaming SSE
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

    // Vérifier le consentement IA du patient avant envoi au LLM
    await this.checkAiConsent(dto.sessionId);

    this.requireAiKey();

    // Headers SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const startedAt = Date.now();
    let totalTokens = 0;

    try {
      if (this.aiProvider === 'anthropic') {
        await this.streamWithAnthropic(dto.rawNotes, dto.context, res, (tokens) => {
          totalTokens = tokens;
        });
      } else {
        await this.streamWithOpenAI(dto.rawNotes, dto.context, res, (tokens) => {
          totalTokens = tokens;
        });
      }

      // Tracker l'usage IA
      await this.trackUsage(psy.id, 'session_summary', totalTokens, startedAt);

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
        await this.streamWithAnthropic(prompt, undefined, res, (tokens) => { totalTokens = tokens; });
      } else {
        await this.streamWithOpenAI(prompt, undefined, res, (tokens) => { totalTokens = tokens; });
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

  private async streamWithAnthropic(
    notes: string,
    context: string | undefined,
    res: Response,
    onComplete: (tokens: number) => void,
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        stream: true,
        system: SYSTEM_PROMPTS.sessionSummary,
        messages: [
          {
            role: 'user',
            content: `Notes de séance:\n${notes}${context ? `\n\nContexte additionnel:\n${context}` : ''}`,
          },
        ],
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
            res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
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

  private async streamWithOpenAI(
    notes: string,
    context: string | undefined,
    res: Response,
    onComplete: (tokens: number) => void,
  ): Promise<void> {
    const apiKey = this.requireAiKey();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1500,
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS.sessionSummary },
          {
            role: 'user',
            content: `Notes de séance:\n${notes}${context ? `\n\nContexte:\n${context}` : ''}`,
          },
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
          if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
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
  ): Promise<void> {
    const model = this.aiProvider === 'anthropic' ? 'claude-haiku-4-5' : 'gpt-4o-mini';

    // Coût approximatif ($/1M tokens)
    const costPer1M = model.startsWith('claude') ? 0.25 : 0.15;
    const costUsd = (tokens / 1_000_000) * costPer1M;

    try {
      await this.prisma.aiUsage.create({
        data: {
          psychologistId,
          feature,
          tokensUsed: tokens,
          model,
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
