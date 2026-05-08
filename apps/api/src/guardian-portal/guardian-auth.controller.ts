import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { GuardianAuthService } from './guardian-auth.service';

class GuardianLoginDto {
  email!: string;
  password!: string;
}

@ApiTags('Guardian Portal - Auth')
@Controller('guardian-portal/auth')
export class GuardianAuthController {
  constructor(private readonly authService: GuardianAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 5 }, long: { ttl: 3600000, limit: 20 } })
  @ApiOperation({ summary: 'Login tuteur legal' })
  @ApiResponse({ status: 200, description: 'JWT retourne' })
  login(@Body() dto: GuardianLoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Rafraichir le token guardian' })
  refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }
}
