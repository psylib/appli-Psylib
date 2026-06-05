import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, Matches } from 'class-validator';
import { AvailabilityService } from './availability.service';
import { SaveAvailabilityDto } from './dto/availability.dto';
import { TimeslotsQueryDto } from './dto/timeslots-query.dto';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';

class UpdateSlotDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Format requis : HH:MM' })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Format requis : HH:MM' })
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantPsychologistUserId } from '../auth/decorators/tenant-psychologist.decorator';

@ApiTags('Availability')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist', 'admin')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('timeslots')
  @Roles('psychologist', 'admin', 'assistant')
  @ApiOperation({ summary: 'Créneaux disponibles pour la psy connectée' })
  async getTimeslots(
    @Query() query: TimeslotsQueryDto,
    @TenantPsychologistUserId() psyUserId: string,
  ) {
    const psy = await this.availabilityService.getPsychologist(psyUserId);
    const from = new Date(query.from);
    const to = new Date(query.to);

    const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 62) {
      throw new BadRequestException('La plage ne peut pas dépasser 62 jours');
    }

    const slots = await this.availabilityService.getAvailableTimeslots(
      psy.id,
      from,
      to,
      query.duration ?? 50,
    );
    return slots.map((d) => d.toISOString());
  }

  @Get()
  @Roles('psychologist', 'admin', 'assistant')
  @ApiOperation({ summary: 'Récupère les créneaux de la psy connectée' })
  async getSlots(@TenantPsychologistUserId() psyUserId: string) {
    return this.availabilityService.getSlots(psyUserId);
  }

  @Post()
  @Roles('psychologist', 'admin', 'assistant')
  @ApiOperation({ summary: 'Sauvegarde les créneaux (remplace les existants)' })
  async saveSlots(
    @Body() dto: SaveAvailabilityDto,
    @TenantPsychologistUserId() psyUserId: string,
  ) {
    return this.availabilityService.saveSlots(psyUserId, dto);
  }

  @Put(':id')
  @Roles('psychologist', 'admin', 'assistant')
  @ApiOperation({ summary: 'Modifier un créneau' })
  async updateSlot(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSlotDto,
    @TenantPsychologistUserId() psyUserId: string,
  ) {
    return this.availabilityService.updateSlot(psyUserId, id, body);
  }

  @Delete(':id')
  @Roles('psychologist', 'admin', 'assistant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprime un créneau' })
  async deleteSlot(
    @Param('id', ParseUUIDPipe) id: string,
    @TenantPsychologistUserId() psyUserId: string,
  ) {
    return this.availabilityService.deleteSlot(psyUserId, id);
  }
}
