import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, Auth, calendar_v3 } from 'googleapis';
import { GOOGLE_SCOPES } from './calendar-sync.constants';

type OAuth2Client = Auth.OAuth2Client;

interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  email: string;
}

interface RefreshedToken {
  accessToken: string;
  expiresAt: Date;
}

interface ListEventsOptions {
  syncToken?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}

interface ListEventsResult {
  events: calendar_v3.Schema$Event[];
  nextSyncToken: string | null;
}

interface WatchResult {
  resourceId: string;
  expiration: string;
}

@Injectable()
export class GoogleCalendarProvider {
  private readonly logger = new Logger(GoogleCalendarProvider.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(private readonly config: ConfigService) {
    this.clientId = this.config.get<string>('GOOGLE_CLIENT_ID', '');
    this.clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET', '');
    this.redirectUri = this.config.get<string>('GOOGLE_REDIRECT_URI', '');
  }

  private createOAuth2Client(accessToken?: string): OAuth2Client {
    const client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );
    if (accessToken) {
      client.setCredentials({ access_token: accessToken });
    }
    return client;
  }

  getAuthUrl(state: string): string {
    const client = this.createOAuth2Client();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GOOGLE_SCOPES,
      state,
    });
  }

  async exchangeCode(code: string): Promise<TokenInfo> {
    const client = this.createOAuth2Client();
    const { tokens } = await client.getToken(code);

    const accessToken = tokens.access_token ?? '';
    const refreshToken = tokens.refresh_token ?? '';
    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    // Fetch user email via oauth2.userinfo (best-effort: l'email est cosmétique,
    // la sync fonctionne avec calendarId="primary" même sans email).
    client.setCredentials(tokens);
    let email = '';
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: client });
      const userInfo = await oauth2.userinfo.get();
      email = userInfo.data.email ?? '';
    } catch (err) {
      this.logger.warn(`Could not fetch Google account email (non-blocking): ${(err as Error).message}`);
    }

    return { accessToken, refreshToken, expiresAt, email };
  }

  async refreshAccessToken(refreshToken: string): Promise<RefreshedToken> {
    const client = this.createOAuth2Client();
    client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await client.refreshAccessToken();

    const accessToken = credentials.access_token ?? '';
    const expiresAt = credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    return { accessToken, expiresAt };
  }

  async revokeToken(token: string): Promise<void> {
    try {
      const client = this.createOAuth2Client();
      await client.revokeToken(token);
    } catch (err) {
      this.logger.warn(`Failed to revoke token (may already be revoked): ${(err as Error).message}`);
    }
  }

  async createEvent(
    accessToken: string,
    calendarId: string,
    event: {
      summary: string;
      start: string;
      end: string;
      description?: string;
      colorId?: string;
    },
  ): Promise<string> {
    const auth = this.createOAuth2Client(accessToken);
    const calendar = google.calendar({ version: 'v3', auth });

    const resource: calendar_v3.Schema$Event = {
      summary: event.summary,
      description: event.description,
      colorId: event.colorId,
      start: { dateTime: event.start },
      end: { dateTime: event.end },
      reminders: { useDefault: false, overrides: [] },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: resource,
    });

    return response.data.id ?? '';
  }

  async updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    event: {
      summary?: string;
      start?: string;
      end?: string;
      description?: string;
      colorId?: string;
    },
  ): Promise<void> {
    const auth = this.createOAuth2Client(accessToken);
    const calendar = google.calendar({ version: 'v3', auth });

    const resource: calendar_v3.Schema$Event = {};
    if (event.summary !== undefined) resource.summary = event.summary;
    if (event.description !== undefined) resource.description = event.description;
    if (event.colorId !== undefined) resource.colorId = event.colorId;
    if (event.start !== undefined) resource.start = { dateTime: event.start };
    if (event.end !== undefined) resource.end = { dateTime: event.end };

    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: resource,
    });
  }

  async deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
  ): Promise<void> {
    const auth = this.createOAuth2Client(accessToken);
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      await calendar.events.delete({ calendarId, eventId });
    } catch (err) {
      const status = (err as { code?: number; status?: number }).code
        ?? (err as { code?: number; status?: number }).status;
      if (status === 404 || status === 410) {
        // Already deleted — ignore
        return;
      }
      throw err;
    }
  }

  async listEvents(
    accessToken: string,
    calendarId: string,
    opts: ListEventsOptions,
  ): Promise<ListEventsResult> {
    const auth = this.createOAuth2Client(accessToken);
    const calendar = google.calendar({ version: 'v3', auth });

    const events: calendar_v3.Schema$Event[] = [];
    let pageToken: string | undefined;

    try {
      do {
        const response = await calendar.events.list({
          calendarId,
          syncToken: opts.syncToken,
          timeMin: opts.timeMin,
          timeMax: opts.timeMax,
          maxResults: opts.maxResults ?? 250,
          pageToken,
          singleEvents: true,
          orderBy: opts.syncToken ? undefined : 'startTime',
        });

        const items = response.data.items ?? [];
        events.push(...items);
        pageToken = response.data.nextPageToken ?? undefined;

        if (!pageToken) {
          return {
            events,
            nextSyncToken: response.data.nextSyncToken ?? null,
          };
        }
      } while (pageToken);
    } catch (err) {
      const status = (err as { code?: number; status?: number }).code
        ?? (err as { code?: number; status?: number }).status;
      if (status === 410) {
        // Sync token expired — signal full sync needed
        return { events: [], nextSyncToken: null };
      }
      throw err;
    }

    return { events, nextSyncToken: null };
  }

  async createWatch(
    accessToken: string,
    calendarId: string,
    channelId: string,
    webhookUrl: string,
    token: string,
  ): Promise<WatchResult> {
    const auth = this.createOAuth2Client(accessToken);
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.watch({
      calendarId,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        token,
      },
    });

    return {
      resourceId: response.data.resourceId ?? '',
      expiration: response.data.expiration ?? '',
    };
  }

  async stopWatch(
    accessToken: string,
    channelId: string,
    resourceId: string,
  ): Promise<void> {
    try {
      const auth = this.createOAuth2Client(accessToken);
      const calendar = google.calendar({ version: 'v3', auth });

      await calendar.channels.stop({
        requestBody: {
          id: channelId,
          resourceId,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to stop watch channel ${channelId} (may already be expired): ${(err as Error).message}`);
    }
  }
}
