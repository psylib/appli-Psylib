import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import {
  OnboardingService,
  UpdatePsychologistProfileDto,
  OnboardingStep,
} from './onboarding.service';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';

class CompleteStepDto {
  @IsEnum(['profile', 'practice', 'preferences', 'first_patient', 'billing'])
  step!: OnboardingStep;
}

@ApiTags('Onboarding')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('progress')
  @ApiOperation({ summary: 'Progression onboarding' })
  async getProgress(@CurrentUser() user: KeycloakUser) {
    return this.onboardingService.getProgress(user.sub);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Profil psychologue' })
  async getProfile(@CurrentUser() user: KeycloakUser) {
    return this.onboardingService.getPsychologistProfile(user.sub);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Mettre à jour le profil' })
  async updateProfile(
    @Body() dto: UpdatePsychologistProfileDto,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.onboardingService.updateProfile(user.sub, dto);
  }

  @Post('steps/:step/complete')
  @ApiOperation({ summary: 'Marquer une étape comme complète' })
  async completeStep(
    @Param('step') step: OnboardingStep,
    @CurrentUser() user: KeycloakUser,
  ) {
    return this.onboardingService.completeStep(user.sub, step);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Finaliser l\'onboarding' })
  async markOnboarded(@CurrentUser() user: KeycloakUser) {
    return this.onboardingService.markOnboarded(user.sub);
  }
}
