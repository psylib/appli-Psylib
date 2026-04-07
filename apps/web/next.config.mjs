// @ts-check
import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */

// URLs de production (depuis les variables d'environnement)
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const livekitWsUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL || '';

const nextConfig = {
  // Output standalone pour Docker — désactivé sur Vercel (Vercel gère nativement)
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,

  // Strict mode React
  reactStrictMode: true,

  // Headers de sécurité HTTP — Obligatoire HDS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // HSTS — Force HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Clickjacking protection
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // MIME sniffing protection
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://client.crisp.chat", // unsafe-eval requis Next.js
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://client.crisp.chat",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              // connect-src dynamique : dev (localhost) + prod (vraies URLs)
              `connect-src 'self' ${apiUrl} ${wsUrl} ${keycloakUrl} ${livekitWsUrl} https://eu.posthog.com https://o4511050353475584.ingest.de.sentry.io https://client.crisp.chat wss://client.relay.crisp.chat`,
              "frame-src 'self' https://game.crisp.chat",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          // Permissions Policy — désactive fonctionnalités non utilisées
          {
            key: 'Permissions-Policy',
            value: [
              'camera=(self)',
              'microphone=(self)',
              'geolocation=()',
              'payment=(self)',
              'usb=()',
            ].join(', '),
          },
          // XSS Protection (legacy browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Images — domaines autorisés
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.psylib.eu',
      },
    ],
  },

  // Packages transpilés du monorepo
  transpilePackages: ['@psyscale/shared-types'],

  // Compression
  compress: true,

  // Optimisations expérimentales
  experimental: {
    optimizePackageImports: ['lucide-react', 'posthog-js'],
  },

  // Redirects SEO
  async redirects() {
    return [
      {
        source: '/register',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/inscription',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/pricing',
        destination: '/tarifs',
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: 'psylib',
  project: 'psylib-web',
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
