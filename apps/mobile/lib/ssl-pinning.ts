/**
 * SSL Certificate Pinning — PsyLib Mobile
 *
 * Pins the SPKI SHA-256 hashes for api.psylib.eu and auth.psylib.eu
 * to prevent MITM attacks on health data in transit.
 *
 * Uses react-native-ssl-public-key-pinning which hooks into
 * OkHttp CertificatePinner (Android) and TrustKit (iOS).
 *
 * IMPORTANT: TrustKit (iOS) requires at least 2 pins per domain.
 * Include both the leaf certificate pin AND a backup pin (e.g. the
 * intermediate CA or a backup leaf from Let's Encrypt / your CA).
 *
 * To extract pins from your certificates, run:
 *   openssl s_client -connect api.psylib.eu:443 -servername api.psylib.eu </dev/null 2>/dev/null \
 *     | openssl x509 -pubkey -noout \
 *     | openssl pkey -pubin -outform der \
 *     | openssl dgst -sha256 -binary \
 *     | openssl enc -base64
 *
 * Or use SSL Labs: https://www.ssllabs.com/ssltest/analyze.html?d=api.psylib.eu
 * and copy the SHA256 pins from "Certification Paths" section.
 */
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Pin configuration
// ---------------------------------------------------------------------------

/**
 * SHA-256 SPKI hashes (base64-encoded) for PsyLib domains.
 *
 * IMPORTANT: Replace these placeholder values with the actual pins
 * extracted from your production certificates before releasing.
 *
 * You need at least 2 pins per domain (iOS TrustKit requirement):
 *   1. The leaf certificate pin (current cert)
 *   2. A backup pin (e.g. Let's Encrypt intermediate R3/R4, or next cert)
 *
 * Common Let's Encrypt intermediate (ISRG Root X1) pin for backup:
 *   C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=
 */
export const SSL_PINS: Record<string, { includeSubdomains: boolean; publicKeyHashes: string[] }> = {
  'api.psylib.eu': {
    includeSubdomains: false,
    publicKeyHashes: [
      // Leaf certificate SPKI SHA-256 pin (extracted 2026-03-20)
      '+BUKMJa9srYoD8xf0LC5ktFcMWPetqFRlyf/N5thr04=',
      // Backup pin: ISRG Root X1 (Let's Encrypt root)
      'C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=',
    ],
  },
  'auth.psylib.eu': {
    includeSubdomains: false,
    publicKeyHashes: [
      // Leaf certificate SPKI SHA-256 pin (extracted 2026-03-20)
      'Ms7ccN+C+r0lNEpJ/q93OLP7p7GkUx911aWygahZ/4Y=',
      // Backup pin: ISRG Root X1 (Let's Encrypt root)
      'C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=',
    ],
  },
};

// ---------------------------------------------------------------------------
// Pinning state
// ---------------------------------------------------------------------------

let pinningInitialized = false;
let pinningError: Error | null = null;

/**
 * Whether SSL pinning has been successfully initialized.
 */
export function isSslPinningActive(): boolean {
  return pinningInitialized;
}

/**
 * Returns the initialization error if pinning setup failed, or null.
 */
export function getSslPinningError(): Error | null {
  return pinningError;
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize SSL certificate pinning.
 * Must be called as early as possible in the app lifecycle (root layout).
 *
 * On web or in Expo Go this is a no-op since the native module is
 * unavailable — SSL pinning only works in dev-client / production builds.
 *
 * After initialization, all `fetch()` calls to pinned domains will
 * automatically validate the server certificate against the configured
 * SPKI hashes. A pin mismatch will cause the request to fail with a
 * network error, preventing data from being sent to rogue servers.
 */
export async function initSslPinning(): Promise<void> {
  // Skip on web — no native module available
  if (Platform.OS === 'web') {
    if (__DEV__) {
      console.log('[SSL Pinning] Skipped on web platform');
    }
    return;
  }

  // Skip if already initialized
  if (pinningInitialized) {
    return;
  }

  try {
    // Dynamic import so the module is only loaded on native platforms.
    // This avoids crashes in Expo Go where the native module is absent.
    const {
      initializeSslPinning,
      addSslPinningErrorListener,
    } = await import('react-native-ssl-public-key-pinning');

    await initializeSslPinning(SSL_PINS);

    // Listen for pinning failures at runtime (useful for diagnostics)
    addSslPinningErrorListener((error) => {
      console.error(
        `[SSL Pinning] Certificate pin mismatch for ${error.serverHostname}`,
        error,
      );
      // In production, this would indicate a potential MITM attack
      // or that the certificates have been rotated without updating pins.
    });

    pinningInitialized = true;
    pinningError = null;

    if (__DEV__) {
      console.log('[SSL Pinning] Initialized successfully for domains:', Object.keys(SSL_PINS).join(', '));
    }
  } catch (error) {
    pinningError = error instanceof Error ? error : new Error(String(error));

    // In dev, the native module may not be available (Expo Go).
    // Log a warning but don't crash the app.
    if (__DEV__) {
      console.warn(
        '[SSL Pinning] Could not initialize — native module unavailable (expected in Expo Go):',
        pinningError.message,
      );
    } else {
      // In production builds, pinning should always work.
      // Log the error for crash reporting (Sentry, etc.).
      console.error('[SSL Pinning] CRITICAL: Failed to initialize in production build:', pinningError.message);
    }
  }
}
