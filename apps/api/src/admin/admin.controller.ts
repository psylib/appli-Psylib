import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RejectVerificationDto } from './dto/reject-verification.dto';
import type { FunnelMetrics, PendingVerification } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('funnel')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Métriques funnel activation (admin only)' })
  async getFunnel(): Promise<FunnelMetrics> {
    return this.adminService.getFunnelMetrics();
  }

  @Get('verifications')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inscriptions en attente de vérification (admin)' })
  async getPendingVerifications(): Promise<PendingVerification[]> {
    return this.adminService.listPendingVerifications();
  }

  @Post('verifications/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Valider un psychologue (profil public activé)' })
  async approveVerification(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    await this.adminService.approveVerification(id);
    return { success: true };
  }

  @Post('verifications/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rejeter un psychologue (usurpation suspectée)' })
  async rejectVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectVerificationDto,
  ): Promise<{ success: boolean }> {
    await this.adminService.rejectVerification(id, dto.reason);
    return { success: true };
  }
}
