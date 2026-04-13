import { Controller, Post, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KeycloakGuard } from '../auth/guards/keycloak.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { KeycloakUser } from '../auth/keycloak-jwt.strategy';
import { SubscriptionService } from './subscription.service';
import { SubscriptionGuard } from './guards/subscription.guard';
import { RequirePlan } from './decorators/require-plan.decorator';
import { SubscriptionPlan } from '@psyscale/shared-types';
import { CreateCheckoutDto } from './dto/checkout.dto';
import { ConnectSettingsSchema, type ConnectSettingsDto } from './dto/connect-settings.dto';
import { PaymentLinkSchema, type PaymentLinkDto } from './dto/payment-link.dto';
import { RefundSchema, type RefundDto } from './dto/refund.dto';

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

  @Get('usage')
  @ApiOperation({ summary: 'Utilisation du plan (IA, formations)' })
  async getUsage(@CurrentUser() user: KeycloakUser) {
    return this.subscriptionService.getUsage(user.sub);
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

  @Put('connect/settings')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  @ApiOperation({ summary: 'Mettre à jour les paramètres de paiement Connect' })
  async updateConnectSettings(
    @CurrentUser() user: KeycloakUser,
    @Body() body: ConnectSettingsDto,
  ) {
    const parsed = ConnectSettingsSchema.parse(body);
    return this.subscriptionService.updateConnectSettings(user.sub, parsed);
  }

  @Post('payment-link')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  @ApiOperation({ summary: 'Créer un lien de paiement pour une séance' })
  async createPaymentLink(
    @CurrentUser() user: KeycloakUser,
    @Body() body: PaymentLinkDto,
  ) {
    const parsed = PaymentLinkSchema.parse(body);
    return this.subscriptionService.createPaymentLink(user.sub, parsed);
  }

  @Post('refund')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  @ApiOperation({ summary: 'Rembourser un paiement patient' })
  async refund(
    @CurrentUser() user: KeycloakUser,
    @Body() body: RefundDto,
  ) {
    const parsed = RefundSchema.parse(body);
    return this.subscriptionService.handleRefund(user.sub, parsed.appointmentId);
  }

  @Post('mark-paid/:appointmentId')
  @ApiOperation({ summary: 'Marquer un rendez-vous comme payé sur place' })
  async markPaidOnSite(
    @CurrentUser() user: KeycloakUser,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.subscriptionService.markPaidOnSite(user.sub, appointmentId);
  }

  @Get('payments')
  @UseGuards(SubscriptionGuard)
  @RequirePlan(SubscriptionPlan.PRO, SubscriptionPlan.CLINIC)
  @ApiOperation({ summary: 'Liste des paiements avec KPIs' })
  async getPayments(
    @CurrentUser() user: KeycloakUser,
    @Query() query: Record<string, string>,
  ) {
    return this.subscriptionService.getPayments(user.sub, query);
  }
}
