import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma.service';

export interface PatientUser {
  sub: string;       // userId
  patientId: string;
  email: string;
}

@Injectable()
export class PatientJwtStrategy extends PassportStrategy(Strategy, 'patient-jwt') {
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

  async validate(payload: { sub: string; patientId: string; email: string }): Promise<PatientUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });

    if (!user || user.role !== 'patient') {
      throw new UnauthorizedException('Token patient invalide');
    }

    return { sub: payload.sub, patientId: payload.patientId, email: payload.email };
  }
}
