import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import { ReferralService } from './referral.service';
import { ValidateReferralDto } from './dto/validate-referral.dto';

@ApiTags('Referral')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist')
@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('my-code')
  @ApiOperation({ summary: 'Obtenir ou créer le code de parrainage du psy connecté' })
  getMyCode(@CurrentUser() user: KeycloakUser) {
    return this.referralService.getOrCreateCode(user.sub);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques de parrainage' })
  getStats(@CurrentUser() user: KeycloakUser) {
    return this.referralService.getStats(user.sub);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Valider un code de parrainage (lors de l\'onboarding)' })
  validateCode(@Body() dto: ValidateReferralDto, @CurrentUser() user: KeycloakUser) {
    return this.referralService.validateCode(user.sub, dto.code);
  }
}
