import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Res,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des factures du psychologue' })
  async findAll(@CurrentUser() user: KeycloakUser) {
    return this.invoicesService.findAll(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une facture' })
  @ApiResponse({ status: 201, description: 'Facture créée' })
  async create(
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.invoicesService.create(user.sub, dto);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Générer le PDF de la facture' })
  @ApiResponse({
    status: 200,
    description: 'PDF de la facture',
    headers: { 'Content-Type': { description: 'application/pdf' } },
  })
  async getPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
    @Res() res: Response,
  ): Promise<void> {
    await this.invoicesService.generatePdf(user.sub, id, res);
  }

  @Patch(':id/send')
  @ApiOperation({ summary: 'Marquer la facture comme envoyée' })
  async markAsSent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.invoicesService.markAsSent(user.sub, id);
  }
}
