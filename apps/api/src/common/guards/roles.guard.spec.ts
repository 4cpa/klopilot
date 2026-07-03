import { describe, it, expect, vi } from 'vitest';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

function makeContext(user: { role?: string } | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('lässt den Zugriff zu, wenn keine Rollen gefordert sind', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(undefined) } as never;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(makeContext({ role: 'user' }))).toBe(true);
  });

  it('lässt den Zugriff zu, wenn die Nutzerrolle in den geforderten Rollen enthalten ist', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(['admin']) } as never;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(makeContext({ role: 'admin' }))).toBe(true);
  });

  it('wirft ForbiddenException bei fehlender Rolle', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(['admin']) } as never;
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(makeContext({ role: 'user' }))).toThrow(ForbiddenException);
  });

  it('wirft ForbiddenException ohne authentifizierten Nutzer', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(['admin']) } as never;
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(ForbiddenException);
  });
});
