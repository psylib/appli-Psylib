import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { SubscriptionPlan, SubscriptionStatus } from '@psyscale/shared-types';
import { PrismaService } from '../../common/prisma.service';
import { SubscriptionService } from '../subscription.service';
import { PLAN_KEY, FEATURE_KEY, BillingFeature } from '../decorators/require-plan.decorator';
import type { KeycloakUser } from '../../auth/keycloak-jwt.strategy';

interface RequestWithUser extends Request {
  user?: KeycloakUser;
}

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionService: SubscriptionService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<BillingFeature | undefined>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredPlans = this.reflector.getAllAndOverride<SubscriptionPlan[] | undefined>(
      PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Pas de restriction déclarée — laisser passer
    if (!requiredFeature && !requiredPlans) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Non authentifié');

    const psy = await this.prisma.psychologist.findUnique({
      where: { userId: user.sub },
      include: { subscription: true },
    });

    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');

    const sub = psy.subscription;
    const plan = (sub?.plan ?? SubscriptionPlan.FREE) as SubscriptionPlan;
    const status = (sub?.status ?? SubscriptionStatus.ACTIVE) as SubscriptionStatus;

    // Abonnement expiré
    if (
      sub &&
      (status === SubscriptionStatus.CANCELED || status === SubscriptionStatus.PAST_DUE)
    ) {
      throw new ForbiddenException(
        'Abonnement inactif — veuillez mettre à jour votre paiement sur /dashboard/settings/billing',
      );
    }

    // Vérification plan minimum
    if (requiredPlans && !requiredPlans.includes(plan)) {
      throw new ForbiddenException(
        `Cette fonctionnalité requiert le plan ${requiredPlans.join(' ou ')}`,
      );
    }

    // Vérification limites feature
    if (requiredFeature === 'patients') {
      await this.subscriptionService.checkPatientLimit(psy.id);
    } else if (requiredFeature === 'sessions') {
      await this.subscriptionService.checkSessionLimit(psy.id);
    } else if (requiredFeature === 'ai_summary') {
      await this.subscriptionService.checkAiUsage(psy.id, 'session_summary');
    } else if (requiredFeature === 'courses') {
      await this.subscriptionService.checkCourseLimit(psy.id);
    }

    return true;
  }
}
