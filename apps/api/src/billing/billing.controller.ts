import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import { SubscriptionService } from './subscription.service';
import { CreateCheckoutDto } from './dto/checkout.dto';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(KeycloakGuard, RolesGuard)
@Roles('psychologist')
@Controller('billing')
export class BillingController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Créer une session Stripe Checkout' })
  async createCheckout(
    @Body() dto: CreateCheckoutDto,
    @CurrentUser() user: KeycloakUser,
  ): Promise<{ url: string }> {
    return this.subscriptionService.createCheckoutSession(user.sub, dto.plan, dto.referralCode);
  }

  @Post('portal')
  @ApiOperation({ summary: 'Accéder au portail client Stripe' })
  async createPortal(@CurrentUser() user: KeycloakUser): Promise<{ url: string }> {
    return this.subscriptionService.createPortalSession(user.sub);
  }

  @Get('subscription')
  @ApiOperation({ summary: 'État de l\'abonnement courant' })
  async getSubscription(@CurrentUser() user: KeycloakUser) {
    return this.subscriptionService.getSubscription(user.sub);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Historique des factures' })
  async getInvoices(@CurrentUser() user: KeycloakUser) {
    return this.subscriptionService.getInvoices(user.sub);
  }

  @Post('connect/onboard')
  @ApiOperation({ summary: 'Démarrer onboarding Stripe Connect Express' })
  async startConnectOnboarding(@CurrentUser() user: KeycloakUser): Promise<{ url: string }> {
    return this.subscriptionService.startConnectOnboarding(user.sub);
  }

  @Get('connect/status')
  @ApiOperation({ summary: 'Statut du compte Stripe Connect' })
  async getConnectStatus(@CurrentUser() user: KeycloakUser) {
    return this.subscriptionService.getConnectStatus(user.sub);
  }
}
