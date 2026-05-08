import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('multer');
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { ShareDocumentDto } from './dto/share-document.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionGuard } from '../billing/guards/subscription.guard';
import { RequireFeature } from '../billing/decorators/require-plan.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import type { Request } from 'express';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('share')
  @RequireFeature('documents')
  @UseGuards(SubscriptionGuard)
  @ApiOperation({ summary: 'Partager un document avec un patient' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  share(
    @CurrentUser() user: KeycloakUser,
    @Body() dto: ShareDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return this.documentsService.share(user.sub, dto, file, req);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les documents partagés' })
  findAll(
    @CurrentUser() user: KeycloakUser,
    @Query('patientId') patientId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    return this.documentsService.findAll(
      user.sub,
      patientId,
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un document partagé" })
  findOne(
    @CurrentUser() user: KeycloakUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documentsService.findOne(user.sub, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un document partagé' })
  remove(
    @CurrentUser() user: KeycloakUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    return this.documentsService.softDelete(user.sub, id, req);
  }
}
