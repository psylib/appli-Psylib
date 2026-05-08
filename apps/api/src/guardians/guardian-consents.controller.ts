import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import type { Request } from 'express';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import { GuardianConsentsService } from './guardian-consents.service';
import { PrismaService } from '../common/prisma.service';

class RequestConsentDto {
  @IsUUID()
  guardianId!: string;

  @IsString()
  type!: string;
}

@ApiTags('Guardian Consents')
@Controller()
export class GuardianConsentsController {
  constructor(
    private readonly service: GuardianConsentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('patients/:patientId/guardian-consents')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  @ApiOperation({ summary: 'Demander un consentement au tuteur' })
  async requestConsent(
    @CurrentUser() user: KeycloakUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: RequestConsentDto,
  ) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId: user.sub } });
    if (!psy) throw new Error('Psychologue introuvable');
    return this.service.requestConsent(psy.id, patientId, dto.guardianId, dto.type, user.sub);
  }

  @Get('guardian-consents/:token')
  @ApiOperation({ summary: 'Page de consentement (public)' })
  getConsentPage(@Param('token') token: string) {
    return this.service.getConsentPage(token);
  }

  @Post('guardian-consents/:token/approve')
  @ApiOperation({ summary: 'Approuver le consentement' })
  approveConsent(@Param('token') token: string, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.socket.remoteAddress ?? '';
    return this.service.approveConsent(token, ip);
  }

  @Post('guardian-consents/:token/refuse')
  @ApiOperation({ summary: 'Refuser le consentement' })
  refuseConsent(@Param('token') token: string, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.socket.remoteAddress ?? '';
    return this.service.refuseConsent(token, ip);
  }
}
