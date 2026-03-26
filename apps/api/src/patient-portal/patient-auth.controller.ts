import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PatientAuthService } from './patient-auth.service';
import { AcceptInvitationDto, PatientLoginDto } from './dto/patient-auth.dto';

@ApiTags('Patient Portal — Auth')
@Controller('patient-portal/auth')
export class PatientAuthController {
  constructor(private readonly authService: PatientAuthService) {}

  @Get('invitation/:token')
  @ApiOperation({ summary: 'Valider et lire les infos d\'une invitation' })
  validateInvitation(@Param('token') token: string) {
    return this.authService.validateInvitationToken(token);
  }

  @Post('accept-invitation')
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Accepter l\'invitation et créer son compte patient' })
  @ApiResponse({ status: 201, description: 'Compte créé, JWT retourné' })
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.authService.acceptInvitation(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 5 }, long: { ttl: 3600000, limit: 20 } })
  @ApiOperation({ summary: 'Login patient' })
  login(@Body() dto: PatientLoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Rafraîchir le token patient' })
  refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }
}
