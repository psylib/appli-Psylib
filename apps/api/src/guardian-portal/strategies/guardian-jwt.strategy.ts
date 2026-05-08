import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma.service';

export interface GuardianUser {
  sub: string;
  role: 'guardian';
  email: string;
}

@Injectable()
export class GuardianJwtStrategy extends PassportStrategy(Strategy, 'guardian-jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('PATIENT_JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: { sub: string; role: string; email: string }): Promise<GuardianUser> {
    if (payload.role !== 'guardian') {
      throw new UnauthorizedException('Token guardian invalide');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });
    if (!user || user.role !== 'guardian') {
      throw new UnauthorizedException('Token guardian invalide');
    }
    return { sub: payload.sub, role: 'guardian', email: payload.email };
  }
}
