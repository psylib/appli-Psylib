import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import { GuardiansService } from './guardians.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { PrismaService } from '../common/prisma.service';

@ApiTags('Guardians')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('patients/:patientId/guardians')
export class GuardiansController {
  constructor(
    private readonly service: GuardiansService,
    private readonly prisma: PrismaService,
  ) {}

  private async getPsyId(userId: string): Promise<string> {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');
    return psy.id;
  }

  @Post()
  @ApiOperation({ summary: 'Ajouter un tuteur au patient mineur (max 2)' })
  async create(
    @CurrentUser() user: KeycloakUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateGuardianDto,
  ) {
    const psyId = await this.getPsyId(user.sub);
    return this.service.create(psyId, patientId, dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les tuteurs du patient' })
  async findAll(
    @CurrentUser() user: KeycloakUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    const psyId = await this.getPsyId(user.sub);
    return this.service.findAll(psyId, patientId);
  }

  @Put(':guardianId')
  @ApiOperation({ summary: 'Modifier un tuteur' })
  async update(
    @CurrentUser() user: KeycloakUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('guardianId', ParseUUIDPipe) guardianId: string,
    @Body() dto: UpdateGuardianDto,
  ) {
    const psyId = await this.getPsyId(user.sub);
    return this.service.update(psyId, patientId, guardianId, dto, user.sub);
  }

  @Delete(':guardianId')
  @ApiOperation({ summary: 'Supprimer un tuteur' })
  async remove(
    @CurrentUser() user: KeycloakUser,
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('guardianId', ParseUUIDPipe) guardianId: string,
  ) {
    const psyId = await this.getPsyId(user.sub);
    return this.service.remove(psyId, patientId, guardianId, user.sub);
  }
}
