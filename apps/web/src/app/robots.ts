import type { MetadataRoute } from 'next';

const PRIVATE_PATHS = ['/dashboard', '/patient-portal', '/api/', '/onboarding', '/login'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      // AI crawlers — explicitly allowed on public pages
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: 'Bytespider',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: 'https://psylib.eu/sitemap.xml',
  };
}
