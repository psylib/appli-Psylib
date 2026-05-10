import { Controller, Get, Post, Param, Body, Query, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PublicBookingService } from './public-booking.service';
import { PublicBookingDto } from './dto/public-booking.dto';
import { ParseSlugPipe } from '../common/parse-slug.pipe';

@ApiTags('Public Booking')
@Controller('public/psy')
export class PublicBookingController {
  constructor(private readonly publicBookingService: PublicBookingService) {}

  @Get('psychologists')
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Liste des slugs publics pour sitemap' })
  async getPublicSlugs(@Query('limit') limit?: string) {
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit ?? '100', 10) || 100));
    return this.publicBookingService.getPublicSlugs(parsedLimit);
  }

  @Get('match')
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Recherche de psychologues avec score de compatibilité' })
  async match(
    @Query('problematics') problematics?: string,
    @Query('approaches[]') approaches?: string | string[],
    @Query('city') city?: string,
    @Query('department') department?: string,
    @Query('monPsy') monPsy?: string,
    @Query('visio') visio?: string,
  ) {
    // Sanitize inputs: cap string lengths + array size
    const safeCity = city?.slice(0, 100);
    const safeDept = department?.slice(0, 10);
    const safeProb = problematics?.slice(0, 200);
    const approachesArray = (
      approaches
        ? Array.isArray(approaches)
          ? approaches
          : [approaches]
        : []
    ).slice(0, 10).map((a) => a.slice(0, 100));

    return this.publicBookingService.matchPsychologists({
      problematics: safeProb,
      approaches: approachesArray,
      city: safeCity,
      department: safeDept,
      monPsy: monPsy === 'true',
      visio: visio === 'true',
    });
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Profil public de la psy' })
  async getProfile(@Param('slug', ParseSlugPipe) slug: string) {
    return this.publicBookingService.getPublicProfile(slug);
  }

  @Get(':slug/slots')
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Créneaux disponibles' })
  async getSlots(
    @Param('slug', ParseSlugPipe) slug: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('consultationTypeId') consultationTypeId?: string,
  ) {
    if (!from || !to || isNaN(new Date(from).getTime()) || isNaN(new Date(to).getTime())) {
      throw new BadRequestException('Paramètres from et to requis (format ISO date)');
    }
    return this.publicBookingService.getAvailableSlots(slug, from, to, consultationTypeId);
  }

  @Get(':slug/consultation-types')
  @ApiOperation({ summary: 'Types de consultation publics du psychologue' })
  async getConsultationTypes(@Param('slug', ParseSlugPipe) slug: string) {
    return this.publicBookingService.getPublicConsultationTypes(slug);
  }

  @Post(':slug/book')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { ttl: 60000, limit: 3 }, long: { ttl: 3600000, limit: 10 } })
  @ApiOperation({ summary: 'Soumettre une demande de RDV' })
  async book(@Param('slug', ParseSlugPipe) slug: string, @Body() dto: PublicBookingDto) {
    return this.publicBookingService.bookAppointment(slug, dto);
  }
}
