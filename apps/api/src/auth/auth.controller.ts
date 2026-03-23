import { Controller, Post, Req, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KeycloakGuard } from './guards/keycloak.guard';
import { CacheService } from '../common/cache.service';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

function decodeJwtPayload(token: string): { jti?: string; exp?: number } | null {
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
  constructor(
    private readonly cache: CacheService,
    private readonly authService: AuthService,
  ) {}

  /**
   * POST /auth/revoke
   * Révoque le JWT courant en le mettant en blacklist Redis (TTL = durée de vie restante).
   * Appelé par le frontend au logout avant signOut().
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
   * POST /auth/forgot-password
   * Triggers Keycloak password reset email via Admin API.
   * Always returns 200 to avoid leaking whether the email exists.
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demande de réinitialisation de mot de passe' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ sent: boolean }> {
    await this.authService.requestPasswordReset(dto.email);
    return { sent: true };
  }
}
