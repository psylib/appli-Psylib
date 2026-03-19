import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NoteTemplatesService } from './note-templates.service';
import { CreateNoteTemplateDto, UpdateNoteTemplateDto } from './dto/note-templates.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import { TherapyOrientation } from '@prisma/client';

@ApiTags('Note Templates')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('note-templates')
export class NoteTemplatesController {
  constructor(private readonly service: NoteTemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste tous les templates (système + perso)' })
  getTemplates(
    @CurrentUser() user: KeycloakUser,
    @Query('orientation') orientation?: TherapyOrientation,
  ) {
    if (orientation) return this.service.getTemplatesByOrientation(user.sub, orientation);
    return this.service.getTemplates(user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un template personnalisé' })
  createTemplate(@Body() dto: CreateNoteTemplateDto, @CurrentUser() user: KeycloakUser) {
    return this.service.createTemplate(dto, user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un template personnalisé' })
  updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNoteTemplateDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.service.updateTemplate(id, dto, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un template personnalisé' })
  deleteTemplate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: KeycloakUser) {
    return this.service.deleteTemplate(id, user.sub);
  }
}
