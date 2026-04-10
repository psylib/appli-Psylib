import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UpsertNetworkProfileDto, CreateReferralDto, UpdateReferralStatusDto, CreateGroupDto, DirectoryQueryDto } from './dto/network.dto';

@Injectable()
export class NetworkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly notifications: NotificationsService,
  ) {}

  private async getPsy(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId },
      include: { networkProfile: true },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');
    return psy;
  }

  // ─── PROFIL RÉSEAU ────────────────────────────────────────────────────────

  async getMyProfile(userId: string) {
    const psy = await this.getPsy(userId);
    if (!psy.networkProfile) {
      // Créer un profil vide par défaut
      return this.prisma.psyNetworkProfile.create({
        data: {
          psychologistId: psy.id,
          isVisible: false,
          approaches: [],
          specialties: [],
          languages: ['fr'],
        },
      });
    }
    return psy.networkProfile;
  }

  async upsertProfile(userId: string, dto: UpsertNetworkProfileDto) {
    const psy = await this.getPsy(userId);
    return this.prisma.psyNetworkProfile.upsert({
      where: { psychologistId: psy.id },
      create: {
        psychologistId: psy.id,
        isVisible: dto.isVisible ?? true,
        city: dto.city,
        department: dto.department,
        approaches: dto.approaches ?? [],
        specialties: dto.specialties ?? [],
        languages: dto.languages ?? ['fr'],
        acceptsReferrals: dto.acceptsReferrals ?? true,
        offersVisio: dto.offersVisio ?? false,
        bio: dto.bio,
        websiteUrl: dto.websiteUrl,
      },
      update: {
        ...(dto.isVisible !== undefined && { isVisible: dto.isVisible }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.department !== undefined && { department: dto.department }),
        ...(dto.approaches !== undefined && { approaches: dto.approaches }),
        ...(dto.specialties !== undefined && { specialties: dto.specialties }),
        ...(dto.languages !== undefined && { languages: dto.languages }),
        ...(dto.acceptsReferrals !== undefined && { acceptsReferrals: dto.acceptsReferrals }),
        ...(dto.offersVisio !== undefined && { offersVisio: dto.offersVisio }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.websiteUrl !== undefined && { websiteUrl: dto.websiteUrl }),
      },
    });
  }

  // ─── ANNUAIRE ─────────────────────────────────────────────────────────────

  async getDirectory(userId: string, query: DirectoryQueryDto) {
    const psy = await this.getPsy(userId);

    const where: Record<string, unknown> = {
      isVisible: true,
      psychologistId: { not: psy.id }, // s'exclure soi-même
    };

    if (query.city) where['city'] = { contains: query.city, mode: 'insensitive' };
    if (query.department) where['department'] = query.department;
    if (query.approach) where['approaches'] = { has: query.approach };
    if (query.specialty) where['specialties'] = { has: query.specialty };

    const profiles = await this.prisma.psyNetworkProfile.findMany({
      where,
      take: 50,
      orderBy: { updatedAt: 'desc' },
      include: {
        psychologist: {
          select: {
            id: true,
            name: true,
            slug: true,
            specialization: true,
          },
        },
      },
    });

    // Filtre nom si search
    if (query.search) {
      const q = query.search.toLowerCase();
      return profiles.filter((p) => p.psychologist.name.toLowerCase().includes(q));
    }

    return profiles;
  }

  async getPsyPublicProfile(slug: string, userId: string) {
    const me = await this.getPsy(userId);

    const profile = await this.prisma.psyNetworkProfile.findFirst({
      where: { psychologist: { slug }, isVisible: true },
      include: {
        psychologist: {
          select: { id: true, name: true, slug: true, specialization: true },
        },
      },
    });

    if (!profile) throw new NotFoundException('Profil introuvable');

    // Vérifier si un referral existe déjà entre les deux psys
    const existingReferral = await this.prisma.referral.findFirst({
      where: {
        OR: [
          { fromPsyId: me.id, toPsyId: profile.psychologistId },
          { fromPsyId: profile.psychologistId, toPsyId: me.id },
        ],
        status: { in: ['pending', 'accepted'] },
      },
    });

    return { ...profile, existingReferral: existingReferral ?? null };
  }

  // ─── ADRESSAGES (REFERRALS) ────────────────────────────────────────────────

  async createReferral(userId: string, dto: CreateReferralDto) {
    const psy = await this.getPsy(userId);

    if (psy.id === dto.toPsyId) throw new BadRequestException('Impossible de s\'adresser à soi-même');

    const toPsy = await this.prisma.psychologist.findUnique({ where: { id: dto.toPsyId } });
    if (!toPsy) throw new NotFoundException('Psychologue destinataire introuvable');

    const encryptedMessage = dto.message ? this.encryption.encrypt(dto.message) : undefined;

    const referral = await this.prisma.referral.create({
      data: {
        fromPsyId: psy.id,
        toPsyId: dto.toPsyId,
        patientInitials: dto.patientInitials,
        message: encryptedMessage,
        reason: dto.reason,
        status: 'pending',
      },
      select: {
        id: true, status: true, patientInitials: true, reason: true, createdAt: true,
        toPsy: { select: { id: true, name: true, slug: true } },
      },
    });

    // Notifier le destinataire de l'adressage
    await this.notifications.createNotification(
      toPsy.userId,
      'referral_received',
      'Nouvel adressage reçu',
      `${psy.name} vous a adressé un patient (${dto.patientInitials ?? 'initiales non précisées'}).`,
      { referralId: referral.id, fromPsyName: psy.name },
    );

    return referral;
  }

  async getMyReferrals(userId: string) {
    const psy = await this.getPsy(userId);

    const [sent, received] = await Promise.all([
      this.prisma.referral.findMany({
        where: { fromPsyId: psy.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true, status: true, patientInitials: true, reason: true, createdAt: true, respondedAt: true,
          toPsy: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.referral.findMany({
        where: { toPsyId: psy.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true, status: true, patientInitials: true, reason: true, createdAt: true, respondedAt: true,
          fromPsy: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);

    return { sent, received };
  }

  async updateReferralStatus(referralId: string, userId: string, dto: UpdateReferralStatusDto) {
    const psy = await this.getPsy(userId);

    const referral = await this.prisma.referral.findUnique({ where: { id: referralId } });
    if (!referral) throw new NotFoundException('Adressage introuvable');

    // Seul le destinataire peut accepter/décliner, l'expéditeur peut marquer completed
    if (dto.status === 'accepted' || dto.status === 'declined') {
      if (referral.toPsyId !== psy.id) throw new ForbiddenException();
    }
    if (dto.status === 'completed') {
      if (referral.fromPsyId !== psy.id && referral.toPsyId !== psy.id) throw new ForbiddenException();
    }

    return this.prisma.referral.update({
      where: { id: referralId },
      data: {
        status: dto.status,
        respondedAt: ['accepted', 'declined'].includes(dto.status) ? new Date() : undefined,
      },
      select: {
        id: true, status: true, respondedAt: true,
        toPsy: { select: { id: true, name: true } },
        fromPsy: { select: { id: true, name: true } },
      },
    });
  }

  // ─── GROUPES (SUPERVISION / INTERVISION) ──────────────────────────────────

  async createGroup(userId: string, dto: CreateGroupDto) {
    const psy = await this.getPsy(userId);

    const group = await this.prisma.networkGroup.create({
      data: {
        ownerId: psy.id,
        type: dto.type,
        name: dto.name,
        description: dto.description,
        city: dto.city,
        isPrivate: dto.isPrivate ?? false,
        maxMembers: dto.maxMembers ?? 20,
      },
    });

    // Ajouter le créateur comme premier membre
    await this.prisma.networkGroupMember.create({
      data: { groupId: group.id, psyId: psy.id, role: 'owner' },
    });

    return group;
  }

  async getGroups(userId: string) {
    const psy = await this.getPsy(userId);

    const [myGroups, publicGroups] = await Promise.all([
      // Groupes dont je suis membre
      this.prisma.networkGroup.findMany({
        where: { members: { some: { psyId: psy.id } } },
        include: {
          owner: { select: { id: true, name: true, slug: true } },
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Groupes publics dont je ne suis pas membre
      this.prisma.networkGroup.findMany({
        where: {
          isPrivate: false,
          members: { none: { psyId: psy.id } },
        },
        include: {
          owner: { select: { id: true, name: true, slug: true } },
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return { myGroups, publicGroups };
  }

  async joinGroup(groupId: string, userId: string) {
    const psy = await this.getPsy(userId);

    const group = await this.prisma.networkGroup.findUnique({
      where: { id: groupId },
      include: { _count: { select: { members: true } } },
    });
    if (!group) throw new NotFoundException('Groupe introuvable');
    if (group.isPrivate) throw new ForbiddenException('Groupe privé — invitation requise');
    if (group._count.members >= group.maxMembers) throw new BadRequestException('Groupe complet');

    const existing = await this.prisma.networkGroupMember.findUnique({
      where: { groupId_psyId: { groupId, psyId: psy.id } },
    });
    if (existing) throw new BadRequestException('Déjà membre de ce groupe');

    return this.prisma.networkGroupMember.create({
      data: { groupId, psyId: psy.id, role: 'member' },
    });
  }

  async leaveGroup(groupId: string, userId: string) {
    const psy = await this.getPsy(userId);

    const group = await this.prisma.networkGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Groupe introuvable');
    if (group.ownerId === psy.id) throw new ForbiddenException('Le propriétaire ne peut pas quitter son groupe');

    await this.prisma.networkGroupMember.delete({
      where: { groupId_psyId: { groupId, psyId: psy.id } },
    });

    return { left: true };
  }
}
