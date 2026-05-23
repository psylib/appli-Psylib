import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  // Jamais de données patients dans les erreurs
  beforeSend(event: Sentry.ErrorEvent) {
    if (event.request) {
      delete event.request.data;
      delete event.request.query_string;
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
    }
    return event;
  },
});
