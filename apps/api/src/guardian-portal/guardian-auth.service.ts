import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class GuardianAuthService {
  private readonly logger = new Logger(GuardianAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    // Validate at startup that the required secret is configured
    this.config.getOrThrow<string>('GUARDIAN_JWT_SECRET');
  }

  /**
   * Login guardian par email/password
   */
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== 'guardian' || !user.passwordHash) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Email ou mot de passe incorrect');

    // Verify user has at least one guardian link
    const guardianLink = await this.prisma.legalGuardian.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!guardianLink) throw new UnauthorizedException('Compte tuteur non associe');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSignInAt: new Date() },
    });

    this.logger.log(`Guardian login: ${user.id}`);

    return this.generateTokens(user.id, user.email);
  }

  /**
   * Rafraichit le token guardian via refresh token
   */
  async refreshToken(refreshTokenValue: string) {
    const secret = this.config.getOrThrow<string>('GUARDIAN_JWT_SECRET');

    try {
      const decoded = this.jwt.verify(refreshTokenValue, { secret }) as {
        sub: string;
        role: string;
        type?: string;
      };

      if (decoded.type !== 'refresh' || decoded.role !== 'guardian') {
        throw new UnauthorizedException('Token invalide');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, email: true, role: true },
      });

      if (!user || user.role !== 'guardian') {
        throw new UnauthorizedException('Compte introuvable');
      }

      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expire');
    }
  }

  private generateTokens(userId: string, email: string) {
    const secret = this.config.getOrThrow<string>('GUARDIAN_JWT_SECRET');
    const payload = { sub: userId, role: 'guardian', email };

    const accessToken = this.jwt.sign(payload, {
      secret,
      expiresIn: '1h',
      algorithm: 'HS256',
    });

    const refreshToken = this.jwt.sign(
      { sub: userId, role: 'guardian', type: 'refresh' },
      {
        secret,
        expiresIn: '7d',
        algorithm: 'HS256',
      },
    );

    return { accessToken, refreshToken, userId, email };
  }
}
