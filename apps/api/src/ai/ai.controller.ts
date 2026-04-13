import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, MaxLength, MinLength } from 'class-validator';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import {
  AiService,
  SessionSummaryDto,
  GenerateExerciseDto,
  GenerateContentDto,
  StreamContentDto,
} from './ai.service';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { RequireFeature } from '../billing/decorators/require-plan.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

class SessionSummaryRequestDto implements SessionSummaryDto {
  @IsString()
  @MinLength(20)
  @MaxLength(50000)
  rawNotes!: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  context?: string;

  @IsString()
  sessionId!: string;
}

class GenerateExerciseRequestDto implements GenerateExerciseDto {
  @IsString()
  @MaxLength(500)
  patientContext!: string;

  @IsString()
  @MaxLength(200)
  theme!: string;

  @IsEnum(['breathing', 'journaling', 'exposure', 'mindfulness', 'cognitive'])
  exerciseType!: 'breathing' | 'journaling' | 'exposure' | 'mindfulness' | 'cognitive';
}

class GenerateContentRequestDto implements GenerateContentDto {
  @IsEnum(['linkedin', 'newsletter', 'blog'])
  type!: 'linkedin' | 'newsletter' | 'blog';

  @IsString()
  @MaxLength(200)
  theme!: string;

  @IsEnum(['professional', 'warm', 'educational'])
  @IsOptional()
  tone?: 'professional' | 'warm' | 'educational';
}

class StreamContentRequestDto implements StreamContentDto {
  @IsEnum(['linkedin', 'newsletter', 'blog'])
  type!: 'linkedin' | 'newsletter' | 'blog';

  @IsString()
  @MaxLength(200)
  theme!: string;

  @IsEnum(['professional', 'warm', 'educational'])
  @IsOptional()
  tone?: 'professional' | 'warm' | 'educational';
}

class SaveContentRequestDto {
  @IsString()
  type!: string;

  @IsString()
  @MaxLength(200)
  theme!: string;

  @IsString()
  tone!: string;

  @IsString()
  @MaxLength(10000)
  content!: string;
}

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * Résumé de séance — streaming SSE
   * Rate limit : 5 req/min (protection coût IA)
   * DISCLAIMER : outil d'aide — le praticien reste responsable
   */
  @Post('session-summary')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Résumé structuré de séance (streaming SSE)',
    description:
      'Génère un résumé IA à partir des notes brutes. DISCLAIMER: outil d\'aide uniquement — le praticien reste responsable.',
  })
  @ApiResponse({ status: 200, description: 'Stream SSE text/event-stream' })
  async streamSessionSummary(
    @Body() dto: SessionSummaryRequestDto,
    @CurrentUser() user: KeycloakUser,
    @Res() res: Response,
  ) {
    await this.aiService.streamSessionSummary(user.sub, dto, res);
  }

  @Post('generate-exercise')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Générer un exercice thérapeutique personnalisé' })
  async generateExercise(
    @Body() dto: GenerateExerciseRequestDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.aiService.generateExercise(user.sub, dto);
  }

  @Post('generate-content')
  @UseGuards(SubscriptionGuard)
  @RequireFeature('ai_summary')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Générer du contenu marketing (LinkedIn, newsletter, blog)',
    description: 'RÈGLE: jamais de données patients — thèmes anonymisés uniquement',
  })
  async generateContent(
    @Body() dto: GenerateContentRequestDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.aiService.generateContent(user.sub, dto);
  }

  @Post('stream-content')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SubscriptionGuard)
  @RequireFeature('ai_summary')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Génération streaming de contenu marketing (SSE)' })
  async streamContent(
    @Body() dto: StreamContentRequestDto,
    @CurrentUser() user: KeycloakUser,
    @Res() res: Response,
  ) {
    await this.aiService.streamContent(user.sub, dto, res);
  }

  @Get('content-library')
  @ApiOperation({ summary: 'Bibliothèque de contenus marketing sauvegardés' })
  async getContentLibrary(@CurrentUser() user: KeycloakUser) {
    return this.aiService.getMarketingContents(user.sub);
  }

  @Post('content-library')
  @ApiOperation({ summary: 'Sauvegarder un contenu marketing généré' })
  async saveContent(
    @Body() dto: SaveContentRequestDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.aiService.saveMarketingContent(user.sub, dto);
  }

  @Delete('content-library/:id')
  @ApiOperation({ summary: 'Supprimer un contenu de la bibliothèque' })
  async deleteContent(
    @Param('id') id: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.aiService.deleteMarketingContent(user.sub, id);
  }
}
