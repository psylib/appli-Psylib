/**
 * Integration tests for Billing — SubscriptionGuard pattern
 *
 * Tests:
 * - Free plan blocks features gated behind Solo/Pro
 * - Pro plan allows all features
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  Controller,
  Get,
  UseGuards,
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import request from 'supertest';
import { PSY_A, setCurrentUser } from './setup';
import type { KeycloakUser } from '../../auth/keycloak-jwt.strategy';

// ─── State ───────────────────────────────────────────────────────────────────

let _user: KeycloakUser | null = PSY_A;
let currentPlan: 'free' | 'solo' | 'pro' | 'clinic' = 'free';

function setUser(u: KeycloakUser | null) {
  _user = u;
  setCurrentUser(u);
}

function setTestPlan(plan: 'free' | 'solo' | 'pro' | 'clinic') {
  currentPlan = plan;
}

// Feature→allowed plans
const FEATURE_PLANS: Record<string, string[]> = {
  ai_summary: ['solo', 'pro', 'clinic'],
  courses: ['pro', 'clinic'],
};

// ─── Guards ──────────────────────────────────────────────────────────────────

@Injectable()
class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (!_user) return false;
    context.switchToHttp().getRequest().user = _user;
    return true;
  }
}

// Route-level metadata to tag feature requirements
const featureMap = new Map<Function, string>();

function RequireFeature(feature: string): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor) => {
    featureMap.set(descriptor.value as Function, feature);
    return descriptor;
  };
}

@Injectable()
class MockSubscriptionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler();
    const feature = featureMap.get(handler);
    if (!feature) return true;

    const allowedPlans = FEATURE_PLANS[feature];
    if (!allowedPlans) return true;

    if (!allowedPlans.includes(currentPlan)) {
      throw new ForbiddenException(
        `Fonctionnalité réservée au plan ${allowedPlans[0]} ou supérieur. Plan actuel : ${currentPlan}`,
      );
    }
    return true;
  }
}

// ─── Controller ──────────────────────────────────────────────────────────────

@UseGuards(MockAuthGuard, MockSubscriptionGuard)
@Controller('test-billing')
class TestBillingController {
  @Get('ai-summary')
  @RequireFeature('ai_summary')
  aiSummary() {
    return { message: 'AI summary accessible' };
  }

  @Get('courses')
  @RequireFeature('courses')
  courses() {
    return { message: 'Courses accessible' };
  }

  @Get('free-feature')
  freeFeature() {
    return { message: 'Always accessible' };
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SubscriptionGuard Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TestBillingController],
      providers: [MockAuthGuard, MockSubscriptionGuard],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    setUser(PSY_A);
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('Free plan', () => {
    it('can access unguarded endpoints', async () => {
      setTestPlan('free');
      const res = await request(app.getHttpServer())
        .get('/test-billing/free-feature')
        .expect(200);
      expect(res.body.message).toBe('Always accessible');
    });

    it('CANNOT access ai_summary → 403', async () => {
      setTestPlan('free');
      const res = await request(app.getHttpServer())
        .get('/test-billing/ai-summary')
        .expect(403);
      expect(res.body.message).toContain('solo');
    });

    it('CANNOT access courses → 403', async () => {
      setTestPlan('free');
      await request(app.getHttpServer())
        .get('/test-billing/courses')
        .expect(403);
    });
  });

  describe('Solo plan', () => {
    it('CAN access ai_summary', async () => {
      setTestPlan('solo');
      const res = await request(app.getHttpServer())
        .get('/test-billing/ai-summary')
        .expect(200);
      expect(res.body.message).toBe('AI summary accessible');
    });

    it('CANNOT access courses → 403', async () => {
      setTestPlan('solo');
      await request(app.getHttpServer())
        .get('/test-billing/courses')
        .expect(403);
    });
  });

  describe('Pro plan', () => {
    it('CAN access ai_summary', async () => {
      setTestPlan('pro');
      await request(app.getHttpServer())
        .get('/test-billing/ai-summary')
        .expect(200);
    });

    it('CAN access courses', async () => {
      setTestPlan('pro');
      const res = await request(app.getHttpServer())
        .get('/test-billing/courses')
        .expect(200);
      expect(res.body.message).toBe('Courses accessible');
    });
  });
});
