import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { MatchQueryDto } from './dto/matching.dto';

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async findMatches(query: MatchQueryDto) {
    // Récupérer tous les profils visibles qui acceptent les adressages
    const profiles = await this.prisma.psyNetworkProfile.findMany({
      where: {
        isVisible: true,
        ...(query.department ? { department: query.department } : {}),
      },
      include: {
        psychologist: {
          select: { id: true, name: true, slug: true, specialization: true },
        },
      },
      take: 100,
    });

    // Scorer chaque profil
    const scored = profiles.map((profile) => {
      let score = 0;

      // Approches thérapeutiques (+40)
      if (query.approaches?.length) {
        const hasApproach = query.approaches.some((a) =>
          profile.approaches.map((p) => p.toLowerCase()).includes(a.toLowerCase())
        );
        if (hasApproach) score += 40;
      } else {
        score += 20; // bonus par défaut si pas de préférence d'approche
      }

      // Géolocalisation (+30)
      if (query.city && profile.city?.toLowerCase().includes(query.city.toLowerCase())) {
        score += 30;
      } else if (query.department && profile.department === query.department) {
        score += 20;
      }

      // Spécialités / problématiques (+20)
      if (query.problematics) {
        const words = query.problematics.toLowerCase().split(/[\s,;]+/);
        const specialtiesLower = profile.specialties.map((s) => s.toLowerCase());
        const hasSpecialty = words.some((w) =>
          specialtiesLower.some((s) => s.includes(w) || w.includes(s))
        );
        if (hasSpecialty) score += 20;
      }

      // Langue (+10)
      if (query.language && profile.languages.includes(query.language)) {
        score += 10;
      } else if (!query.language) {
        score += 10; // par défaut
      }

      return {
        score,
        profile: {
          id: profile.id,
          city: profile.city,
          department: profile.department,
          approaches: profile.approaches,
          specialties: profile.specialties,
          languages: profile.languages,
          acceptsReferrals: profile.acceptsReferrals,
          bio: profile.bio,
          psychologist: profile.psychologist,
        },
      };
    });

    // Trier par score décroissant, prendre top 10
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((s) => ({ ...s.profile, matchScore: s.score }));
  }
}
