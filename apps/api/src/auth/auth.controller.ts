import {
  Controller,
  Post,
  Get,
  Delete,
  Req,
  Res,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { KeycloakGuard } from './guards/keycloak.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { KeycloakUser } from './keycloak-jwt.strategy';
import { CacheService } from '../common/cache.service';
import { AuthService } from './auth.service';
import { ProSanteConnectService } from './pro-sante-connect.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RegisterDto } from './dto/register.dto';

function decodeJwtPayload(
  token: string,
): { jti?: string; exp?: number } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = Buffer.from(parts[1]!, 'base64url').toString('utf-8');
    return JSON.parse(payload) as { jti?: string; exp?: number };
  } catch {
    return null;
  }
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly frontendUrl: string;

  constructor(
    private readonly cache: CacheService,
    private readonly authService: AuthService,
    private readonly pscService: ProSanteConnectService,
    private readonly config: ConfigService,
  ) {
    this.frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
  }

  /**
   * POST /auth/register
   * Crée un compte psychologue (Keycloak + DB) et envoie un email
   * pour définir le mot de passe.
   */
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Inscription psychologue' })
  async register(
    @Body() dto: RegisterDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.authService.registerPsychologist(
      dto.email,
      dto.firstName,
      dto.lastName,
      dto.adeliOrRpps,
    );
  }

  /**
   * POST /auth/revoke
   * Révoque le JWT courant en le mettant en blacklist Redis.
   */
  @Post('revoke')
  @UseGuards(KeycloakGuard)
  @HttpCode(HttpStatus.OK)
  async revokeToken(@Req() req: Request): Promise<{ revoked: boolean }> {
    const authHeader = (req.headers as Record<string, string>)['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return { revoked: true };

    const token = authHeader.slice(7);
    const decoded = decodeJwtPayload(token);

    if (decoded?.jti && decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.cache.set(`revoked:${decoded.jti}`, '1', ttl);
      }
    }

    return { revoked: true };
  }

  /**
   * DELETE /auth/account
   * Supprime définitivement le compte psy : Stripe annulé, données purgées, Keycloak supprimé.
   */
  @Delete('account')
  @UseGuards(KeycloakGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer son compte (irréversible)' })
  async deleteAccount(@CurrentUser() user: KeycloakUser): Promise<void> {
    await this.authService.deleteAccount(user.sub);
  }

  /**
   * GET /auth/psc/status
   * Indique si la vérification Pro Santé Connect est activée (pour afficher
   * le bouton côté front). Public.
   */
  @Get('psc/status')
  @Public()
  @HttpCode(HttpStatus.OK)
  pscStatus(): { enabled: boolean } {
    return { enabled: this.pscService.isConfigured() };
  }

  /**
   * GET /auth/psc/start
   * Démarre la vérification d'identité Pro Santé Connect (e-CPS) pour le psy
   * connecté. Renvoie l'URL d'autorisation PSC à ouvrir côté front.
   */
  @Get('psc/start')
  @UseGuards(KeycloakGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Démarrer la vérification Pro Santé Connect' })
  async pscStart(
    @CurrentUser() user: KeycloakUser,
  ): Promise<{ url: string }> {
    const url = await this.pscService.startForUser(user.sub);
    return { url };
  }

  /**
   * GET /auth/psc/callback
   * Retour de Pro Santé Connect après authentification e-CPS. Public : PSC
   * redirige le navigateur ici sans notre JWT (le `state` lie au psy).
   * Redirige ensuite vers le front avec le résultat.
   */
  @Get('psc/callback')
  @Public()
  async pscCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    const dest = `${this.frontendUrl}/dashboard/settings`;
    try {
      const outcome = await this.pscService.handleCallback(code, state);
      res.redirect(`${dest}?psc=${outcome.status}`);
    } catch {
      res.redirect(`${dest}?psc=error`);
    }
  }

  /**
   * POST /auth/forgot-password
   * Triggers Keycloak password reset email via Admin API.
   */
  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 2 } })
  @ApiOperation({ summary: 'Demande de réinitialisation de mot de passe' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ sent: boolean }> {
    await this.authService.requestPasswordReset(dto.email);
    return { sent: true };
  }
}
