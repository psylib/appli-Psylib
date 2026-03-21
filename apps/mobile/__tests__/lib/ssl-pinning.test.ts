/**
 * SSL Pinning tests — pin configuration validation
 */
import { SSL_PINS } from '@/lib/ssl-pinning';

describe('SSL Pinning', () => {
  describe('SSL_PINS configuration', () => {
    it('has pins for api.psylib.eu', () => {
      expect(SSL_PINS['api.psylib.eu']).toBeDefined();
      expect(SSL_PINS['api.psylib.eu'].publicKeyHashes).toHaveLength(2);
      expect(SSL_PINS['api.psylib.eu'].includeSubdomains).toBe(false);
    });

    it('has pins for auth.psylib.eu', () => {
      expect(SSL_PINS['auth.psylib.eu']).toBeDefined();
      expect(SSL_PINS['auth.psylib.eu'].publicKeyHashes).toHaveLength(2);
      expect(SSL_PINS['auth.psylib.eu'].includeSubdomains).toBe(false);
    });

    it('has at least 2 pins per domain (iOS TrustKit requirement)', () => {
      for (const [, config] of Object.entries(SSL_PINS)) {
        expect(config.publicKeyHashes.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('all pins are valid base64-encoded SHA-256 hashes (44 chars)', () => {
      for (const [, config] of Object.entries(SSL_PINS)) {
        for (const hash of config.publicKeyHashes) {
          expect(hash).toMatch(/^[A-Za-z0-9+/]{43}=$/);
        }
      }
    });

    it('does not contain placeholder pins', () => {
      for (const [, config] of Object.entries(SSL_PINS)) {
        for (const hash of config.publicKeyHashes) {
          expect(hash).not.toMatch(/^[B]+=/);
          expect(hash).not.toMatch(/^[C]+=/);
        }
      }
    });

    it('includes ISRG Root X1 backup pin for each domain', () => {
      const isrgRootX1 = 'C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=';
      for (const [, config] of Object.entries(SSL_PINS)) {
        expect(config.publicKeyHashes).toContain(isrgRootX1);
      }
    });
  });
});
