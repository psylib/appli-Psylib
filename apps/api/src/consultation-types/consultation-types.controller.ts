import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ConsultationTypesService } from './consultation-types.service';
import { CreateConsultationTypeDto } from './dto/create-consultation-type.dto';
import { UpdateConsultationTypeDto } from './dto/update-consultation-type.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

@ApiTags('Consultation Types')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('consultation-types')
export class ConsultationTypesController {
  constructor(private readonly service: ConsultationTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des types de consultation du psychologue' })
  @ApiResponse({ status: 200, description: 'Types retournés' })
  findAll(@CurrentUser() user: KeycloakUser) {
    return this.service.findAll(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un type de consultation' })
  @ApiResponse({ status: 201, description: 'Type créé' })
  create(
    @Body() dto: CreateConsultationTypeDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.service.create(user.sub, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un type de consultation' })
  @ApiResponse({ status: 200, description: 'Type modifié' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConsultationTypeDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.service.update(user.sub, id, dto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Désactiver un type de consultation' })
  @ApiResponse({ status: 200, description: 'Type désactivé' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.service.deactivate(user.sub, id);
  }
}
