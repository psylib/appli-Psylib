import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../common/prisma.service';
import type { GuardianUser } from '../strategies/guardian-jwt.strategy';
import type { GuardianPermissions } from '@psyscale/shared-types';

export const GUARDIAN_PERMISSION_KEY = 'guardian_permission';

@Injectable()
export class GuardianAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<keyof GuardianPermissions | undefined>(
      GUARDIAN_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user as GuardianUser;
    const patientId = request.params?.patientId;

    if (!user?.sub) throw new ForbiddenException('Acces non autorise');
    if (!patientId) throw new ForbiddenException('Patient ID requis');

    const guardian = await this.prisma.legalGuardian.findFirst({
      where: { userId: user.sub, patientId },
      include: {
        patient: { select: { isMinor: true, psychologistId: true } },
        psychologist: {
          include: { subscription: { select: { plan: true, status: true } } },
        },
      },
    });

    if (!guardian) throw new NotFoundException('Acces non autorise a ce patient');
    if (!guardian.patient.isMinor) throw new ForbiddenException('Ce patient n\'est plus mineur');
    if (guardian.psychologistId !== guardian.patient.psychologistId) throw new ForbiddenException('Incoherence tenant');

    // Plan gating
    const plan = guardian.psychologist.subscription?.plan ?? 'free';
    if (plan === 'free') throw new ForbiddenException('Le plan du praticien ne permet pas l\'acces portail tuteur');
    if (plan === 'solo' && !guardian.isPrimary) throw new ForbiddenException('Seul le tuteur principal peut acceder au portail avec le plan Solo');

    // Permission check
    if (requiredPermission) {
      const permissions = guardian.permissions as unknown as GuardianPermissions;
      if (!permissions[requiredPermission]) {
        throw new ForbiddenException(`Vous n'avez pas la permission "${requiredPermission}"`);
      }
    }

    // Attach guardian data to request for downstream use
    request.guardianData = guardian;
    return true;
  }
}
