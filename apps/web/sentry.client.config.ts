import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.0,
  // Ne jamais capturer les données patients
  beforeBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
    // Supprimer les breadcrumbs contenant des URLs de données sensibles
    const sensitivePatterns = [
      '/patients', '/sessions', '/journal-entries',
      '/mood-tracking', '/messages', '/exercises',
      '/ai/', '/invoices', '/video/', '/documents',
    ];
    if (sensitivePatterns.some((p) => breadcrumb.data?.url?.includes(p))) {
      return null;
    }
    return breadcrumb;
  },
  integrations: [
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
  ],
});
