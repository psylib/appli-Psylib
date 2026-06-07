import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { GlobalAuthGuard } from '../global-auth.guard';
import { IS_PUBLIC_KEY, IS_ALT_AUTH_KEY } from '../../decorators/public.decorator';

function makeContext() {
  const handler = () => undefined;
  class FakeController {}
  return {
    getHandler: () => handler,
    getClass: () => FakeController,
    switchToHttp: () => ({ getRequest: () => ({}), getResponse: () => ({}) }),
    getType: () => 'http',
  } as never;
}

function makeReflector(flags: Record<string, boolean>) {
  return {
    getAllAndOverride: vi.fn((key: string) => flags[key] ?? undefined),
  } as never;
}

function makeConfig(enabled: boolean) {
  return {
    get: vi.fn(() => (enabled ? 'true' : 'false')),
  } as never;
}

// Spy target: the parent AuthGuard('keycloak-jwt') canActivate.
const parentProto = Object.getPrototypeOf(GlobalAuthGuard.prototype);

describe('GlobalAuthGuard', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('is a no-op when GLOBAL_AUTH_GUARD is not "true" (never calls Keycloak)', () => {
    const parentSpy = vi.spyOn(parentProto, 'canActivate');
    const guard = new GlobalAuthGuard(makeReflector({}), makeConfig(false));
    expect(guard.canActivate(makeContext())).toBe(true);
    expect(parentSpy).not.toHaveBeenCalled();
  });

  it('skips @Public routes when enabled', () => {
    const parentSpy = vi.spyOn(parentProto, 'canActivate');
    const guard = new GlobalAuthGuard(
      makeReflector({ [IS_PUBLIC_KEY]: true }),
      makeConfig(true),
    );
    expect(guard.canActivate(makeContext())).toBe(true);
    expect(parentSpy).not.toHaveBeenCalled();
  });

  it('skips @AltAuth routes when enabled (own patient/guardian guard handles it)', () => {
    const parentSpy = vi.spyOn(parentProto, 'canActivate');
    const guard = new GlobalAuthGuard(
      makeReflector({ [IS_ALT_AUTH_KEY]: true }),
      makeConfig(true),
    );
    expect(guard.canActivate(makeContext())).toBe(true);
    expect(parentSpy).not.toHaveBeenCalled();
  });

  it('delegates to Keycloak auth for unmarked routes when enabled', () => {
    const parentSpy = vi
      .spyOn(parentProto, 'canActivate')
      .mockReturnValue('DELEGATED' as never);
    const guard = new GlobalAuthGuard(makeReflector({}), makeConfig(true));
    expect(guard.canActivate(makeContext())).toBe('DELEGATED');
    expect(parentSpy).toHaveBeenCalledOnce();
  });

  it('handleRequest throws when no user resolved', () => {
    const guard = new GlobalAuthGuard(makeReflector({}), makeConfig(true));
    expect(() => guard.handleRequest(null, false)).toThrow(UnauthorizedException);
  });

  it('handleRequest returns the user when present', () => {
    const guard = new GlobalAuthGuard(makeReflector({}), makeConfig(true));
    const user = { sub: 'u1' };
    expect(guard.handleRequest(null, user)).toBe(user);
  });
});
