import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import { GuardianInvitationsService } from './guardian-invitations.service';
import { PrismaService } from '../common/prisma.service';

class AcceptGuardianInvitationDto {
  @IsString()
  @MinLength(8)
  password!: string;
}

@ApiTags('Guardian Invitations')
@Controller()
export class GuardianInvitationsController {
  constructor(
    private readonly service: GuardianInvitationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('patients/:patientId/guardians/:guardianId/invite')
  @ApiBearerAuth()
  @UseGuards(KeycloakGuard, RolesGuard)
  @Roles('psychologist', 'admin')
  @ApiOperation({ summary: 'Envoyer invitation portail au tuteur' })
  async sendInvitation(
    @CurrentUser() user: KeycloakUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('guardianId', ParseUUIDPipe) guardianId: string,
  ) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId: user.sub } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');
    return this.service.sendInvitation(psy.id, patientId, guardianId, user.sub);
  }

  @Get('guardian-invitations/:token')
  @ApiOperation({ summary: 'Valider un token d\'invitation (public)' })
  validateToken(@Param('token') token: string) {
    return this.service.validateToken(token);
  }

  @Post('guardian-invitations/:token/accept')
  @ApiOperation({ summary: 'Accepter l\'invitation — creer compte guardian' })
  acceptInvitation(
    @Param('token') token: string,
    @Body() dto: AcceptGuardianInvitationDto,
  ) {
    return this.service.acceptInvitation(token, dto.password);
  }
}
