// @ts-check
import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */

// URLs de production (depuis les variables d'environnement)
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const livekitWsUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL || '';

// Socket.io upgrade http(s):// → ws(s):// automatiquement, mais la CSP traite les
// schémes ws/wss distinctement de http/https. On dérive donc la forme ws(s):// de
// l'URL API/WS pour que `connect-src` autorise réellement la connexion temps réel.
const wsUrlSecure = wsUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');

const isProd = process.env.NODE_ENV === 'production';

// script-src :
// - dev  : 'unsafe-eval' requis par le HMR/React Refresh de Next.js
// - prod : 'wasm-unsafe-eval' uniquement → autorise la compilation WebAssembly
//   (LiveKit krisp noise filter + background blur en dépendent) tout en bloquant
//   eval()/new Function() JS. Durcissement HDS (audit 2026-06-05, finding CSP medium).
// 'unsafe-inline' conservé : la suppression nécessite une migration vers des nonces
//   (next/script Crisp inject dynamiquement → exigerait 'strict-dynamic') à valider
//   en navigateur sur Crisp/PostHog/Sentry avant cutover.
// eu-assets.i.posthog.com : héberge les assets statiques PostHog (config.js,
//   array.js, recorder…) sur le cloud EU — distinct de l'ingestion eu.i.posthog.com.
const scriptSrc = isProd
  ? "script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline' https://client.crisp.chat https://eu-assets.i.posthog.com"
  : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://client.crisp.chat https://eu-assets.i.posthog.com";

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
              scriptSrc,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://client.crisp.chat",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              // connect-src dynamique : dev (localhost) + prod (vraies URLs)
              `connect-src 'self' ${apiUrl} ${wsUrl} ${wsUrlSecure} ${keycloakUrl} ${livekitWsUrl} https://eu.posthog.com https://eu.i.posthog.com https://eu-assets.i.posthog.com https://o4511050353475584.ingest.de.sentry.io https://client.crisp.chat wss://client.relay.crisp.chat`,
              "media-src 'self' blob: mediastream:",
              "worker-src 'self' blob:",
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
          // NB : header X-XSS-Protection retiré — déprécié et potentiellement
          // dangereux (XS-Leaks sur anciens navigateurs). La CSP couvre le XSS.
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
    instrumentationHook: true,
    optimizePackageImports: ['lucide-react', 'posthog-js'],
  },

  // Redirects SEO
  async redirects() {
    return [
      {
        source: '/inscription',
        destination: '/register',
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
