import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { SaveAvailabilityDto } from './dto/availability.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

@ApiTags('Availability')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  @ApiOperation({ summary: 'Récupère les créneaux de la psy connectée' })
  async getSlots(@CurrentUser() user: KeycloakUser) {
    return this.availabilityService.getSlots(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Sauvegarde les créneaux (remplace les existants)' })
  async saveSlots(@Body() dto: SaveAvailabilityDto, @CurrentUser() user: KeycloakUser) {
    return this.availabilityService.saveSlots(user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprime un créneau' })
  async deleteSlot(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.availabilityService.deleteSlot(user.sub, id);
  }
}
