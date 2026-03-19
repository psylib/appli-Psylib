import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import {
  CreateGroupDto, UpdateGroupDto, CreateSessionDto,
  UpdateSessionDto, CreateCaseStudyDto,
} from './dto/supervision.dto';
import type { Prisma } from '@prisma/client';

@Injectable()
export class SupervisionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  // ─── Groups ─────────────────────────────────────────────────────────────────

  async getMyGroups(psyKeycloakId: string) {
    const psy = await this.resolvePsy(psyKeycloakId);

    return this.prisma.supervisionGroup.findMany({
      where: {
        OR: [
          { ownerId: psy.id },
          { members: { some: { psyId: psy.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { members: true, sessions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGroup(psyKeycloakId: string, dto: CreateGroupDto) {
    const psy = await this.resolvePsy(psyKeycloakId);

    const group = await this.prisma.supervisionGroup.create({
      data: {
        ownerId: psy.id,
        type: dto.type,
        name: dto.name,
        description: dto.description,
        isPrivate: dto.isPrivate ?? false,
        maxMembers: dto.maxMembers ?? 12,
      },
    });

    // Le créateur devient membre automatiquement
    await this.prisma.supervisionMember.create({
      data: { groupId: group.id, psyId: psy.id, role: 'owner' },
    });

    return group;
  }

  async updateGroup(psyKeycloakId: string, groupId: string, dto: UpdateGroupDto) {
    const psy = await this.resolvePsy(psyKeycloakId);
    const group = await this.getGroupOrThrow(groupId);
    if (group.ownerId !== psy.id) throw new ForbiddenException('Accès refusé');

    return this.prisma.supervisionGroup.update({
      where: { id: groupId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.isPrivate !== undefined ? { isPrivate: dto.isPrivate } : {}),
        ...(dto.maxMembers ? { maxMembers: dto.maxMembers } : {}),
      },
    });
  }

  async deleteGroup(psyKeycloakId: string, groupId: string) {
    const psy = await this.resolvePsy(psyKeycloakId);
    const group = await this.getGroupOrThrow(groupId);
    if (group.ownerId !== psy.id) throw new ForbiddenException('Accès refusé');

    await this.prisma.supervisionGroup.delete({ where: { id: groupId } });
    return { success: true };
  }

  async joinGroup(psyKeycloakId: string, groupId: string) {
    const psy = await this.resolvePsy(psyKeycloakId);
    const group = await this.getGroupOrThrow(groupId);

    const count = await this.prisma.supervisionMember.count({ where: { groupId } });
    if (count >= group.maxMembers) {
      throw new ForbiddenException('Ce groupe est complet');
    }

    const existing = await this.prisma.supervisionMember.findUnique({
      where: { groupId_psyId: { groupId, psyId: psy.id } },
    });
    if (existing) return existing;

    return this.prisma.supervisionMember.create({
      data: { groupId, psyId: psy.id, role: 'member' },
    });
  }

  async leaveGroup(psyKeycloakId: string, groupId: string) {
    const psy = await this.resolvePsy(psyKeycloakId);
    const group = await this.getGroupOrThrow(groupId);

    if (group.ownerId === psy.id) {
      throw new ForbiddenException("Le propriétaire ne peut pas quitter son groupe. Supprimez-le à la place.");
    }

    await this.prisma.supervisionMember.deleteMany({
      where: { groupId, psyId: psy.id },
    });
    return { success: true };
  }

  // ─── Sessions ────────────────────────────────────────────────────────────────

  async getSessions(psyKeycloakId: string, groupId: string) {
    const psy = await this.resolvePsy(psyKeycloakId);
    await this.assertMember(psy.id, groupId);

    const sessions = await this.prisma.supervisionSession.findMany({
      where: { groupId },
      include: { _count: { select: { caseStudies: true } } },
      orderBy: { scheduledAt: 'desc' },
    });

    // Déchiffrer notes si présentes
    return sessions.map((s) => ({
      ...s,
      notes: s.notes ? this.encryption.decrypt(s.notes) : null,
    }));
  }

  async createSession(psyKeycloakId: string, groupId: string, dto: CreateSessionDto) {
    const psy = await this.resolvePsy(psyKeycloakId);
    await this.assertMember(psy.id, groupId);

    return this.prisma.supervisionSession.create({
      data: {
        groupId,
        scheduledAt: new Date(dto.scheduledAt),
        duration: dto.duration ?? 90,
        location: dto.location,
        status: 'planned',
      },
    });
  }

  async updateSession(psyKeycloakId: string, sessionId: string, dto: UpdateSessionDto) {
    const psy = await this.resolvePsy(psyKeycloakId);
    const session = await this.prisma.supervisionSession.findUniqueOrThrow({
      where: { id: sessionId },
    });
    await this.assertMember(psy.id, session.groupId);

    const encryptedNotes = dto.notes ? this.encryption.encrypt(dto.notes) : undefined;

    return this.prisma.supervisionSession.update({
      where: { id: sessionId },
      data: {
        ...(dto.scheduledAt ? { scheduledAt: new Date(dto.scheduledAt) } : {}),
        ...(dto.duration ? { duration: dto.duration } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(encryptedNotes ? { notes: encryptedNotes } : {}),
      },
    });
  }

  // ─── Case Studies ─────────────────────────────────────────────────────────

  async getCaseStudies(psyKeycloakId: string, sessionId: string) {
    const psy = await this.resolvePsy(psyKeycloakId);
    const session = await this.prisma.supervisionSession.findUniqueOrThrow({
      where: { id: sessionId },
    });
    await this.assertMember(psy.id, session.groupId);

    const cases = await this.prisma.caseStudy.findMany({
      where: { sessionId },
      include: {
        presenter: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return cases.map((c) => ({
      ...c,
      content: this.encryption.decrypt(c.content),
    }));
  }

  async createCaseStudy(psyKeycloakId: string, dto: CreateCaseStudyDto) {
    const psy = await this.resolvePsy(psyKeycloakId);
    const session = await this.prisma.supervisionSession.findUniqueOrThrow({
      where: { id: dto.sessionId },
    });
    await this.assertMember(psy.id, session.groupId);

    return this.prisma.caseStudy.create({
      data: {
        sessionId: dto.sessionId,
        presenterId: psy.id,
        initials: dto.initials,
        ageRange: dto.ageRange,
        problematic: dto.problematic,
        content: this.encryption.encrypt(dto.content),
      } as Prisma.CaseStudyUncheckedCreateInput,
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async resolvePsy(keycloakId: string) {
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId: keycloakId },
    });
    if (!psy) throw new NotFoundException('Psychologue non trouvé');
    return psy;
  }

  private async getGroupOrThrow(groupId: string) {
    const group = await this.prisma.supervisionGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Groupe non trouvé');
    return group;
  }

  private async assertMember(psyId: string, groupId: string) {
    const member = await this.prisma.supervisionMember.findUnique({
      where: { groupId_psyId: { groupId, psyId } },
    });
    if (!member) throw new ForbiddenException('Vous n\'êtes pas membre de ce groupe');
  }
}
