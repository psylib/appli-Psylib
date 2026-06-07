import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { PatientJwtStrategy } from '../patient-jwt.strategy';

const config = { getOrThrow: vi.fn().mockReturnValue('a'.repeat(64)) };
const prisma = {
  user: { findUnique: vi.fn() },
  patient: { findFirst: vi.fn() },
};

function createStrategy(): PatientJwtStrategy {
  return new PatientJwtStrategy(config as never, prisma as never);
}

const payload = { sub: 'user-1', patientId: 'patient-1', email: 'p@example.com' };

describe('PatientJwtStrategy.validate', () => {
  beforeEach(() => {
    prisma.user.findUnique.mockReset();
    prisma.patient.findFirst.mockReset();
  });

  it('accepts a token whose patientId belongs to the user', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'p@example.com', role: 'patient' });
    prisma.patient.findFirst.mockResolvedValue({ id: 'patient-1' });

    await expect(createStrategy().validate(payload)).resolves.toEqual({
      sub: 'user-1',
      patientId: 'patient-1',
      email: 'p@example.com',
    });
    expect(prisma.patient.findFirst).toHaveBeenCalledWith({
      where: { id: 'patient-1', userId: 'user-1' },
      select: { id: true },
    });
  });

  it('rejects when the user is missing or not a patient', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'psychologist' });
    await expect(createStrategy().validate(payload)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.patient.findFirst).not.toHaveBeenCalled();
  });

  it('rejects when the patientId claim does not belong to the user (IDOR attempt)', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'p@example.com', role: 'patient' });
    prisma.patient.findFirst.mockResolvedValue(null); // patient-1 belongs to someone else
    await expect(createStrategy().validate(payload)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
