import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.0,
  // Ne jamais capturer les données patients
  beforeBreadcrumb(breadcrumb) {
    // Supprimer les breadcrumbs contenant des URLs de données sensibles
    if (
      breadcrumb.data?.url?.includes('/patients') ||
      breadcrumb.data?.url?.includes('/sessions')
    ) {
      return null;
    }
    return breadcrumb;
  },
  integrations: [
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
  ],
});
