/**
 * Integrationstest: AdminUsersService gegen echte Postgres-DB
 * Direkte Instanziierung — kein NestJS DI-Container nötig.
 * Voraussetzungen: DATABASE_URL in der Umgebung, Docker Compose läuft.
 */
import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';

const prisma = new PrismaClient();
const adminUsers = new AdminUsersService(prisma as never);

let adminId: string;
let targetId: string;

beforeAll(async () => {
  await prisma.$connect();

  const admin = await prisma.user.upsert({
    where: { handle: '__integration_admin__' },
    update: {},
    create: {
      handle: '__integration_admin__',
      email: '__integration_admin__@klopilot.ch',
      role: 'admin',
    },
  });
  adminId = admin.id;

  const target = await prisma.user.upsert({
    where: { handle: '__integration_target__' },
    update: { role: 'user', status: 'active', bannedAt: null, bannedReason: null, deletedAt: null },
    create: {
      handle: '__integration_target__',
      email: '__integration_target__@klopilot.ch',
      role: 'user',
    },
  });
  targetId = target.id;
}, 20_000);

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [adminId, targetId] } } });
  await prisma.$disconnect();
});

describe('AdminUsersService', () => {
  it('listet Nutzer mit Suche/Paginierung', async () => {
    const res = await adminUsers.list(1, 30, '__integration_target__');
    expect(res.items.some((u) => u.id === targetId)).toBe(true);
    expect(res.total).toBeGreaterThanOrEqual(1);
  });

  it('ändert die Rolle eines Nutzers', async () => {
    const updated = await adminUsers.updateRole(targetId, { role: 'moderator' }, adminId);
    expect(updated.role).toBe('moderator');
  });

  it('verweigert das Entziehen der eigenen Admin-Rolle', async () => {
    await expect(adminUsers.updateRole(adminId, { role: 'user' }, adminId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('sperrt und entsperrt einen Nutzer', async () => {
    const banned = await adminUsers.ban(targetId, { reason: 'Testsperre' }, adminId);
    expect(banned.status).toBe('banned');
    expect(banned.bannedReason).toBe('Testsperre');

    const unbanned = await adminUsers.unban(targetId);
    expect(unbanned.status).toBe('active');
  });

  it('verweigert das Sperren des eigenen Kontos', async () => {
    await expect(adminUsers.ban(adminId, { reason: 'egal' }, adminId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('wirft NotFoundException für unbekannten Nutzer', async () => {
    await expect(
      adminUsers.ban('00000000-0000-0000-0000-000000000000', { reason: 'x' }, adminId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('anonymisiert einen Nutzer (DSGVO-Löschung) und verhindert Doppel-Löschung', async () => {
    const anonymized = await adminUsers.anonymize(targetId, adminId);
    expect(anonymized.handle).toBe(`geloescht-${targetId.slice(0, 8)}`);
    expect(anonymized.deletedAt).toBeTruthy();

    const reloaded = await prisma.user.findUniqueOrThrow({ where: { id: targetId } });
    expect(reloaded.email).toBeNull();
    expect(reloaded.status).toBe('banned');

    await expect(adminUsers.anonymize(targetId, adminId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('verweigert das Löschen des eigenen Kontos', async () => {
    await expect(adminUsers.anonymize(adminId, adminId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
