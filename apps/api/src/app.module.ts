import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { PatientsModule } from './patients/patients.module';
import { SessionsModule } from './sessions/sessions.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { AiModule } from './ai/ai.module';
import { BillingModule } from './billing/billing.module';
import { PatientPortalModule } from './patient-portal/patient-portal.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagingModule } from './messaging/messaging.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { InvoicesModule } from './invoices/invoices.module';
import { CoursesModule } from './courses/courses.module';
import { OutcomesModule } from './outcomes/outcomes.module';
import { NoteTemplatesModule } from './note-templates/note-templates.module';
import { NetworkModule } from './network/network.module';
import { MatchingModule } from './matching/matching.module';
import { LeadsModule } from './leads/leads.module';
import { LeadMagnetsModule } from './lead-magnets/lead-magnets.module';
import { SupervisionModule } from './supervision/supervision.module';
import { AvailabilityModule } from './availability/availability.module';
import { PublicBookingModule } from './public-booking/public-booking.module';
import { ReferralModule } from './referral/referral.module';
import { AdminModule } from './admin/admin.module';
import { ConsultationTypesModule } from './consultation-types/consultation-types.module';
import { MonSoutienPsyModule } from './mon-soutien-psy/mon-soutien-psy.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { ReminderModule } from './reminder/reminder.module';
import { VideoModule } from './video/video.module';
import { AccountingModule } from './accounting/accounting.module';
import { ExpensesModule } from './expenses/expenses.module';
import { RecurringExpensesModule } from './recurring-expenses/recurring-expenses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),

    // Redis / BullMQ — connexion globale
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') ?? 'localhost',
          port: config.get<number>('REDIS_PORT') ?? 6379,
          password: config.get<string>('REDIS_PASSWORD') ?? undefined,
        },
      }),
    }),

    // Scheduler (cron jobs)
    ScheduleModule.forRoot(),

    // Event emitter (domain events between modules)
    EventEmitterModule.forRoot(),

    // Infrastructure
    CommonModule,
    AuthModule,
    HealthModule,

    // Business modules
    PatientsModule,
    SessionsModule,
    AppointmentsModule,
    DashboardModule,
    OnboardingModule,
    AiModule,
    BillingModule,
    PatientPortalModule,
    NotificationsModule,
    MessagingModule,
    AnalyticsModule,
    InvoicesModule,
    CoursesModule,
    OutcomesModule,
    NoteTemplatesModule,
    NetworkModule,
    MatchingModule,
    LeadsModule,
    LeadMagnetsModule,
    SupervisionModule,
    AvailabilityModule,
    PublicBookingModule,
    ReferralModule,
    AdminModule,
    ConsultationTypesModule,
    MonSoutienPsyModule,
    WaitlistModule,
    ReminderModule,
    VideoModule,
    AccountingModule,
    ExpensesModule,
    RecurringExpensesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
