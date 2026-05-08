import { Injectable, Logger, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OnEvent } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { AuditService } from '../common/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GoogleCalendarProvider } from './google-calendar.provider';
import { CALENDAR_SYNC_QUEUE, DEFAULT_GOOGLE_COLOR, GOOGLE_COLOR_MAP } from './calendar-sync.constants';
import type { AppointmentEventPayload } from '@psyscale/shared-types';

// ─── Internal types ───────────────────────────────────────────────────────────

interface CalendarConnectionRecord {
  id: string;
  psychologistId: string;
  calendarId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date | null;
  syncToken: string | null;
  watchChannelId: string | null;
  watchResourceId: string | null;
  watchToken: string | null;
  watchExpiration: Date | null;
  isActive: boolean;
}

interface StatePayload {
  psychologistId: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class CalendarSyncService implements OnModuleInit {
  private readonly logger = new Logger(CalendarSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
    private readonly googleProvider: GoogleCalendarProvider,
    @InjectQueue(CALENDAR_SYNC_QUEUE) private readonly syncQueue: Queue,
  ) {}

  // ─── onModuleInit — register repeatable polling job ───────────────────────

  async onModuleInit(): Promise<void> {
    await this.syncQueue.add('poll-all', {}, {
      repeat: { every: 15 * 60 * 1000 },
      removeOnComplete: { count: 10 },
    });
    this.logger.log('Calendar sync polling job registered (every 15 min)');
  }

  // =========================================================================
  // OAuth flow
  // =========================================================================

  /**
   * Returns the Google OAuth authorization URL.
   * Signs a short-lived JWT (10 min) containing the psychologistId as the `state`
   * parameter, so we can validate the callback securely.
   */
  getAuthUrl(psychologistId: string): string {
    const secret = this.config.get<string>('ENCRYPTION_KEY') ?? '';
    const state = jwt.sign({ psychologistId } as StatePayload, secret, { expiresIn: '10m' });
    return this.googleProvider.getAuthUrl(state);
  }

  /**
   * Verifies the JWT `state` returned by Google after OAuth consent.
   * Throws if the token is invalid or expired.
   */
  verifyState(state: string): { psychologistId: string } {
    const secret = this.config.get<string>('ENCRYPTION_KEY') ?? '';
    const payload = jwt.verify(state, secret) as StatePayload;
    return { psychologistId: payload.psychologistId };
  }

  /**
   * Exchanges the OAuth code for tokens, stores them encrypted in DB,
   * logs the audit event, and enqueues an initial full sync.
   */
  async handleCallback(psychologistId: string, code: string): Promise<void> {
    const tokenInfo = await this.googleProvider.exchangeCode(code);

    const encryptedAccess = this.encryption.encrypt(tokenInfo.accessToken);
    const encryptedRefresh = this.encryption.encrypt(tokenInfo.refreshToken);

    await this.prisma.calendarConnection.upsert({
      where: { psychologistId },
      create: {
        psychologistId,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: tokenInfo.expiresAt,
        email: tokenInfo.email,
        isActive: true,
      },
      update: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: tokenInfo.expiresAt,
        email: tokenInfo.email,
        isActive: true,
        syncToken: null,
      },
    });

    await this.audit.log({
      actorId: psychologistId,
      actorType: 'psychologist',
      action: 'CALENDAR_CONNECT',
      entityType: 'calendar_connection',
      entityId: psychologistId,
      metadata: { email: tokenInfo.email },
    });

    await this.syncQueue.add('initial-sync', { psychologistId }, {
      removeOnComplete: { count: 5 },
      removeOnFail: { count: 5 },
    });

    this.logger.log(`Google Calendar connected for psychologist ${psychologistId} (${tokenInfo.email})`);
  }

  /**
   * Disconnects Google Calendar: stops the push watch, revokes the access token,
   * clears googleEventId on appointments, and deletes the connection record.
   */
  async disconnect(psychologistId: string, userId: string): Promise<void> {
    const conn = await this.prisma.calendarConnection.findUnique({
      where: { psychologistId },
    });
    if (!conn) return;

    // Stop push watch if active
    if (conn.watchChannelId && conn.watchResourceId) {
      try {
        const accessToken = this.encryption.decrypt(conn.accessToken);
        await this.googleProvider.stopWatch(accessToken, conn.watchChannelId, conn.watchResourceId);
      } catch (err) {
        this.logger.warn(`Could not stop watch on disconnect: ${(err as Error).message}`);
      }
    }

    // Revoke the access token
    try {
      const accessToken = this.encryption.decrypt(conn.accessToken);
      await this.googleProvider.revokeToken(accessToken);
    } catch (err) {
      this.logger.warn(`Could not revoke token on disconnect: ${(err as Error).message}`);
    }

    // Clear googleEventId from all appointments for this psy
    await this.prisma.appointment.updateMany({
      where: { psychologistId },
      data: { googleEventId: null },
    });

    // Delete the connection (cascade deletes ExternalCalendarEvents)
    await this.prisma.calendarConnection.delete({
      where: { psychologistId },
    });

    await this.audit.log({
      actorId: userId,
      actorType: 'psychologist',
      action: 'CALENDAR_DISCONNECT',
      entityType: 'calendar_connection',
      entityId: psychologistId,
    });

    this.logger.log(`Google Calendar disconnected for psychologist ${psychologistId}`);
  }

  /**
   * Returns the current sync status for a psychologist.
   */
  async getStatus(psychologistId: string): Promise<{
    connected: boolean;
    email: string | null;
    lastSyncAt: Date | null;
    isActive: boolean;
  }> {
    const conn = await this.prisma.calendarConnection.findUnique({
      where: { psychologistId },
      select: { email: true, lastSyncAt: true, isActive: true },
    });

    if (!conn) {
      return { connected: false, email: null, lastSyncAt: null, isActive: false };
    }

    return {
      connected: true,
      email: conn.email,
      lastSyncAt: conn.lastSyncAt,
      isActive: conn.isActive,
    };
  }

  // =========================================================================
  // Token management
  // =========================================================================

  /**
   * Returns a valid (non-expired) access token for the given connection.
   * Refreshes automatically if expired (with 5 min buffer).
   * On refresh failure, marks the connection inactive and notifies the psy.
   */
  async getValidAccessToken(conn: CalendarConnectionRecord): Promise<string> {
    const now = new Date();
    const bufferMs = 5 * 60 * 1000; // 5 minutes

    const isExpired =
      !conn.tokenExpiresAt ||
      conn.tokenExpiresAt.getTime() - now.getTime() < bufferMs;

    if (!isExpired) {
      return this.encryption.decrypt(conn.accessToken);
    }

    // Token expired — attempt refresh
    try {
      const refreshToken = this.encryption.decrypt(conn.refreshToken);
      const refreshed = await this.googleProvider.refreshAccessToken(refreshToken);

      await this.prisma.calendarConnection.update({
        where: { id: conn.id },
        data: {
          accessToken: this.encryption.encrypt(refreshed.accessToken),
          tokenExpiresAt: refreshed.expiresAt,
        },
      });

      this.logger.debug(`Access token refreshed for connection ${conn.id}`);
      return refreshed.accessToken;
    } catch (err) {
      this.logger.error(
        `Token refresh failed for connection ${conn.id}: ${(err as Error).message}`,
      );

      // Mark connection inactive
      await this.prisma.calendarConnection.update({
        where: { id: conn.id },
        data: { isActive: false },
      });

      // Notify the psychologist
      const psy = await this.prisma.psychologist.findUnique({
        where: { id: conn.psychologistId },
        select: { userId: true },
      });
      if (psy?.userId) {
        void this.notifications.createAndDispatch(
          psy.userId,
          'calendar_sync_error',
          'Synchronisation Google Calendar interrompue',
          'Votre connexion Google Calendar a expiré. Veuillez vous reconnecter dans les paramètres.',
          { psychologistId: conn.psychologistId },
        ).catch(() => {});
      }

      throw new ForbiddenException(
        'Google Calendar token expired and refresh failed. Please reconnect.',
      );
    }
  }

  // =========================================================================
  // Outbound sync — PsyLib → Google (via @OnEvent)
  // =========================================================================

  @OnEvent('appointment.created')
  async handleAppointmentCreated(event: AppointmentEventPayload): Promise<void> {
    try {
      await this.pushToGoogle('create', event);
    } catch (err) {
      this.logger.warn(
        `Outbound sync (create) failed for appointment ${event.appointmentId}: ${(err as Error).message}`,
      );
    }
  }

  @OnEvent('appointment.updated')
  async handleAppointmentUpdated(event: AppointmentEventPayload): Promise<void> {
    try {
      await this.pushToGoogle('update', event);
    } catch (err) {
      this.logger.warn(
        `Outbound sync (update) failed for appointment ${event.appointmentId}: ${(err as Error).message}`,
      );
    }
  }

  @OnEvent('appointment.cancelled')
  async handleAppointmentCancelled(event: AppointmentEventPayload): Promise<void> {
    try {
      await this.pushToGoogle('delete', event);
    } catch (err) {
      this.logger.warn(
        `Outbound sync (delete) failed for appointment ${event.appointmentId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Pushes a single appointment to Google Calendar (create / update / delete).
   */
  private async pushToGoogle(
    action: 'create' | 'update' | 'delete',
    event: AppointmentEventPayload,
  ): Promise<void> {
    const conn = await this.prisma.calendarConnection.findUnique({
      where: { psychologistId: event.psychologistId },
    });
    if (!conn || !conn.isActive) return;

    const accessToken = await this.getValidAccessToken(conn as CalendarConnectionRecord);

    // Fetch appointment with patient name and consultation type color
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: event.appointmentId },
      include: {
        patient: { select: { name: true } },
        consultationType: { select: { color: true } },
      },
    });
    if (!appointment) return;

    // HDS: first name only in Google Calendar title
    const firstName = (appointment.patient.name ?? '').split(' ')[0] ?? 'Patient';
    const summary = `Consultation - ${firstName}`;

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
    const description = `${frontendUrl}/dashboard/calendar`;

    // Resolve Google color from consultation type hex color
    const hexColor = appointment.consultationType?.color ?? null;
    const colorId = hexColor ? (GOOGLE_COLOR_MAP[hexColor] ?? DEFAULT_GOOGLE_COLOR) : DEFAULT_GOOGLE_COLOR;

    const startIso = appointment.scheduledAt.toISOString();
    const endDate = new Date(appointment.scheduledAt.getTime() + appointment.duration * 60 * 1000);
    const endIso = endDate.toISOString();

    if (action === 'create') {
      const googleEventId = await this.googleProvider.createEvent(
        accessToken,
        conn.calendarId,
        { summary, start: startIso, end: endIso, description, colorId },
      );

      await this.prisma.appointment.update({
        where: { id: event.appointmentId },
        data: { googleEventId },
      });

      this.logger.debug(`Created Google event ${googleEventId} for appointment ${event.appointmentId}`);
      return;
    }

    const googleEventId = appointment.googleEventId;
    if (!googleEventId) return;

    if (action === 'update') {
      await this.googleProvider.updateEvent(
        accessToken,
        conn.calendarId,
        googleEventId,
        { summary, start: startIso, end: endIso, description, colorId },
      );
      this.logger.debug(`Updated Google event ${googleEventId} for appointment ${event.appointmentId}`);
      return;
    }

    if (action === 'delete') {
      await this.googleProvider.deleteEvent(accessToken, conn.calendarId, googleEventId);

      await this.prisma.appointment.update({
        where: { id: event.appointmentId },
        data: { googleEventId: null },
      });

      this.logger.debug(`Deleted Google event ${googleEventId} for appointment ${event.appointmentId}`);
    }
  }

  // =========================================================================
  // Inbound sync — Google → PsyLib
  // =========================================================================

  /**
   * Performs an incremental sync (or falls back to a full 90-day sync when
   * the syncToken is invalid / expired).
   */
  async performIncrementalSync(psychologistId: string): Promise<void> {
    const conn = await this.prisma.calendarConnection.findUnique({
      where: { psychologistId },
    });
    if (!conn || !conn.isActive) return;

    const accessToken = await this.getValidAccessToken(conn as CalendarConnectionRecord);

    let result: { events: import('googleapis').calendar_v3.Schema$Event[]; nextSyncToken: string | null };

    if (conn.syncToken) {
      // Incremental sync using the stored syncToken
      result = await this.googleProvider.listEvents(accessToken, conn.calendarId, {
        syncToken: conn.syncToken,
      });

      // If the syncToken was invalid (Google returns empty events + null nextSyncToken), do full sync
      if (conn.syncToken && result.nextSyncToken === null) {
        this.logger.warn(
          `SyncToken invalid/expired for connection ${conn.id}, falling back to full sync`,
        );
        result = await this.performFullSync(accessToken, conn.calendarId);
      }
    } else {
      // No syncToken yet — initial full sync (90 days window)
      result = await this.performFullSync(accessToken, conn.calendarId);
    }

    await this.processGoogleEvents(psychologistId, conn.id, result.events);

    // Persist the new syncToken and update lastSyncAt
    await this.prisma.calendarConnection.update({
      where: { id: conn.id },
      data: {
        syncToken: result.nextSyncToken ?? conn.syncToken,
        lastSyncAt: new Date(),
      },
    });

    this.logger.debug(
      `Incremental sync complete for psychologist ${psychologistId}: ${result.events.length} events processed`,
    );
  }

  /** Full sync over a 90-day window (past 30d + future 60d). */
  private async performFullSync(
    accessToken: string,
    calendarId: string,
  ): Promise<{ events: import('googleapis').calendar_v3.Schema$Event[]; nextSyncToken: string | null }> {
    const now = new Date();
    const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

    return this.googleProvider.listEvents(accessToken, calendarId, { timeMin, timeMax });
  }

  /**
   * Upserts external Google Calendar events into ExternalCalendarEvent table.
   * Skips events that were created by PsyLib (they have a googleEventId on an appointment).
   * Handles deletions (status === 'cancelled').
   */
  async processGoogleEvents(
    psychologistId: string,
    connectionId: string,
    events: import('googleapis').calendar_v3.Schema$Event[],
  ): Promise<void> {
    if (!events.length) return;

    // Load googleEventIds from PsyLib-created appointments to avoid duplicates
    const psyLibEventIds = new Set<string>(
      (
        await this.prisma.appointment.findMany({
          where: { psychologistId, googleEventId: { not: null } },
          select: { googleEventId: true },
        })
      )
        .map((a) => a.googleEventId)
        .filter((id): id is string => id !== null),
    );

    for (const googleEvent of events) {
      const externalId = googleEvent.id;
      if (!externalId) continue;

      // Skip events that PsyLib created — they are already in appointments
      if (psyLibEventIds.has(externalId)) continue;

      // Deletion
      if (googleEvent.status === 'cancelled') {
        await this.prisma.externalCalendarEvent.deleteMany({
          where: { calendarConnectionId: connectionId, externalId },
        });
        continue;
      }

      // Resolve start/end — handle all-day (date) vs timed (dateTime) events
      const isAllDay = Boolean(googleEvent.start?.date && !googleEvent.start?.dateTime);
      const startRaw = googleEvent.start?.dateTime ?? googleEvent.start?.date;
      const endRaw = googleEvent.end?.dateTime ?? googleEvent.end?.date;

      if (!startRaw || !endRaw) continue;

      const startAt = new Date(startRaw);
      const endAt = new Date(endRaw);

      await this.prisma.externalCalendarEvent.upsert({
        where: { calendarConnectionId_externalId: { calendarConnectionId: connectionId, externalId } },
        create: {
          psychologistId,
          calendarConnectionId: connectionId,
          externalId,
          title: googleEvent.summary ?? null,
          startAt,
          endAt,
          isAllDay,
          status: googleEvent.status ?? 'confirmed',
          lastUpdatedAt: googleEvent.updated ? new Date(googleEvent.updated) : null,
        },
        update: {
          title: googleEvent.summary ?? null,
          startAt,
          endAt,
          isAllDay,
          status: googleEvent.status ?? 'confirmed',
          lastUpdatedAt: googleEvent.updated ? new Date(googleEvent.updated) : null,
        },
      });
    }
  }

  // =========================================================================
  // Watch management
  // =========================================================================

  /**
   * Sets up a Google Calendar push notification channel for a psychologist.
   */
  async setupWatch(psychologistId: string): Promise<void> {
    const conn = await this.prisma.calendarConnection.findUnique({
      where: { psychologistId },
    });
    if (!conn || !conn.isActive) return;

    const accessToken = await this.getValidAccessToken(conn as CalendarConnectionRecord);

    const channelId = randomUUID();
    const watchToken = randomUUID();
    const webhookUrl = `${this.config.get<string>('API_URL') ?? ''}/calendar-sync/webhook`;

    const result = await this.googleProvider.createWatch(
      accessToken,
      conn.calendarId,
      channelId,
      webhookUrl,
      watchToken,
    );

    const expiration = result.expiration ? new Date(parseInt(result.expiration, 10)) : null;

    await this.prisma.calendarConnection.update({
      where: { id: conn.id },
      data: {
        watchChannelId: channelId,
        watchResourceId: result.resourceId,
        watchToken,
        watchExpiration: expiration,
      },
    });

    this.logger.log(`Watch channel ${channelId} set up for psychologist ${psychologistId}`);
  }

  /**
   * Validates the incoming webhook from Google and enqueues an incremental sync.
   * Uses a 5-second job deduplication bucket to avoid redundant syncs.
   */
  async handleWebhook(
    channelId: string,
    resourceId: string,
    channelToken: string,
  ): Promise<void> {
    const conn = await this.prisma.calendarConnection.findFirst({
      where: { watchChannelId: channelId, watchResourceId: resourceId },
    });

    if (!conn) {
      this.logger.warn(`Unknown webhook channel: ${channelId}`);
      return;
    }

    // Validate token to prevent spoofed webhooks
    if (conn.watchToken !== channelToken) {
      this.logger.warn(`Invalid watch token for channel ${channelId}`);
      return;
    }

    // Deduplicate via BullMQ jobId: bucket into 5-second windows
    const bucket = Math.floor(Date.now() / 5000);
    const jobId = `webhook-sync-${conn.psychologistId}-${bucket}`;

    await this.syncQueue.add(
      'incremental-sync',
      { psychologistId: conn.psychologistId },
      {
        jobId,
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 5 },
      },
    );

    this.logger.debug(
      `Webhook received for psychologist ${conn.psychologistId}, enqueued incremental sync (jobId: ${jobId})`,
    );
  }

  /**
   * Finds connections whose watch is expiring within 24 hours and renews them.
   * Called by the scheduler/cron job.
   */
  async renewExpiringWatches(): Promise<void> {
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const expiringConnections = await this.prisma.calendarConnection.findMany({
      where: {
        isActive: true,
        watchExpiration: { lte: in24h },
        watchChannelId: { not: null },
      },
    });

    for (const conn of expiringConnections) {
      try {
        // Stop old watch
        if (conn.watchChannelId && conn.watchResourceId) {
          const accessToken = await this.getValidAccessToken(conn as CalendarConnectionRecord);
          await this.googleProvider.stopWatch(accessToken, conn.watchChannelId, conn.watchResourceId);
        }

        // Create new watch
        await this.setupWatch(conn.psychologistId);
        this.logger.log(`Watch renewed for psychologist ${conn.psychologistId}`);
      } catch (err) {
        this.logger.error(
          `Failed to renew watch for psychologist ${conn.psychologistId}: ${(err as Error).message}`,
        );
      }
    }
  }

  // =========================================================================
  // Helper
  // =========================================================================

  /**
   * Returns the list of psychologistIds that have an active calendar connection.
   * Used by the polling job to determine which accounts to sync.
   */
  async getActiveConnectionIds(): Promise<string[]> {
    const connections = await this.prisma.calendarConnection.findMany({
      where: { isActive: true },
      select: { psychologistId: true },
    });
    return connections.map((c) => c.psychologistId);
  }
}
