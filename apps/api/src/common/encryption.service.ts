import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * EncryptionService — Chiffrement AES-256-GCM avec versioning de clé
 *
 * Obligatoire HDS : chiffrement applicatif des champs sensibles
 * Champs concernés : notes, summary_ai, messages.content, journal_entries.content
 *
 * Format actuel (v1) : v1:base64(iv):base64(authTag):base64(encryptedData)
 * Format legacy       : base64(iv):base64(authTag):base64(encryptedData)  [3 parties]
 *
 * La version est préfixée pour permettre :
 * - Rotation de clé sans casser les données existantes
 * - Migration progressive (re-chiffrement au prochain accès)
 * - Support multi-versions en lecture
 *
 * Algorithme : AES-256-GCM (authenticated encryption)
 * Clé courante : ENCRYPTION_KEY (32 bytes hex)
 * Clés legacy : ENCRYPTION_KEY_V{n} pour les rotations passées
 */

const CURRENT_VERSION = 'v1';

@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly logger = new Logger(EncryptionService.name);

  // Clé courante (v1)
  private encryptionKey!: Buffer;

  // Clés legacy pour déchiffrement des données migrées
  private readonly legacyKeys = new Map<string, Buffer>();

  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 12; // 96 bits — recommandé pour GCM
  private readonly AUTH_TAG_LENGTH = 16; // 128 bits
  private readonly SEP = ':';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // ── Clé courante ─────────────────────────────────────────────────────────
    const keyHex = this.configService.get<string>('ENCRYPTION_KEY');

    if (!keyHex || keyHex === '<32-bytes-hex-random>') {
      throw new Error(
        '[EncryptionService] ENCRYPTION_KEY manquante. ' +
          'Générer avec: openssl rand -hex 32',
      );
    }

    const keyBuffer = Buffer.from(keyHex, 'hex');
    if (keyBuffer.length !== 32) {
      throw new Error(
        `[EncryptionService] ENCRYPTION_KEY doit être 32 bytes hex (64 chars). ` +
          `Reçu: ${keyBuffer.length} bytes.`,
      );
    }

    this.encryptionKey = keyBuffer;

    // ── Clés legacy (optionnelles — pour rotation) ────────────────────────
    // Convention : ENCRYPTION_KEY_V0 pour la clé pré-versioning, etc.
    for (const version of ['v0']) {
      const legacyHex = this.configService.get<string>(`ENCRYPTION_KEY_${version.toUpperCase()}`);
      if (legacyHex) {
        const legacyBuf = Buffer.from(legacyHex, 'hex');
        if (legacyBuf.length === 32) {
          this.legacyKeys.set(version, legacyBuf);
          this.logger.log(`EncryptionService: clé legacy ${version} chargée`);
        }
      }
    }

    this.logger.log(`EncryptionService initialized (AES-256-GCM, version ${CURRENT_VERSION})`);
  }

  // ─── Chiffrement ──────────────────────────────────────────────────────────

  /**
   * Chiffre une chaîne en clair
   * @returns Format: v1:base64(iv):base64(authTag):base64(encryptedData)
   */
  encrypt(plaintext: string): string {
    if (!plaintext) return plaintext;

    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.encryptionKey, iv, {
      authTagLength: this.AUTH_TAG_LENGTH,
    });

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      CURRENT_VERSION,
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(this.SEP);
  }

  /**
   * Chiffre une valeur nullable (helper pour Prisma)
   */
  encryptNullable(plaintext: string | null | undefined): string | null {
    if (plaintext === null || plaintext === undefined) return null;
    return this.encrypt(plaintext);
  }

  // ─── Déchiffrement ────────────────────────────────────────────────────────

  /**
   * Déchiffre une chaîne chiffrée — supporte le format versionné (v1:...) et legacy (3 parties)
   */
  decrypt(ciphertext: string): string {
    if (!ciphertext) return ciphertext;

    const parts = ciphertext.split(this.SEP);

    // Format versionné : v1:iv:authTag:data (4 parties)
    if (parts.length === 4 && parts[0]?.startsWith('v')) {
      const version = parts[0];
      const keyForVersion = version === CURRENT_VERSION
        ? this.encryptionKey
        : this.legacyKeys.get(version);

      if (!keyForVersion) {
        throw new Error(
          `[EncryptionService] Clé de chiffrement introuvable pour version "${version}". ` +
            `Configurer ENCRYPTION_KEY_${version.toUpperCase()} dans l'env.`,
        );
      }

      return this.decryptWithKey(parts[1]!, parts[2]!, parts[3]!, keyForVersion);
    }

    // Format legacy (3 parties sans version) — déchiffre avec la clé courante
    if (parts.length === 3) {
      return this.decryptWithKey(parts[0]!, parts[1]!, parts[2]!, this.encryptionKey);
    }

    throw new Error('[EncryptionService] Format de chiffrement invalide');
  }

  /**
   * Déchiffre une valeur nullable (helper pour Prisma)
   */
  decryptNullable(ciphertext: string | null): string | null {
    if (ciphertext === null) return null;
    return this.decrypt(ciphertext);
  }

  // ─── Rotation de clé ─────────────────────────────────────────────────────

  /**
   * Re-chiffre une valeur avec la clé courante si elle est dans un format ancien.
   * À appeler lors de la lecture pour une migration progressive.
   *
   * Usage :
   *   const decrypted = this.encryption.decrypt(stored);
   *   const reEncrypted = this.encryption.reEncryptIfNeeded(stored);
   *   // Sauvegarder reEncrypted en DB si différent de stored
   */
  reEncryptIfNeeded(ciphertext: string): { value: string; migrated: boolean } {
    if (!ciphertext) return { value: ciphertext, migrated: false };

    const isCurrentVersion = ciphertext.startsWith(`${CURRENT_VERSION}${this.SEP}`);
    if (isCurrentVersion) return { value: ciphertext, migrated: false };

    // Déchiffrer avec l'ancien format/clé, puis re-chiffrer avec la clé courante
    const plaintext = this.decrypt(ciphertext);
    const newCiphertext = this.encrypt(plaintext);
    return { value: newCiphertext, migrated: true };
  }

  // ─── Utilitaires ─────────────────────────────────────────────────────────

  /**
   * Vérifie si une valeur est au format chiffré (versionné ou legacy)
   */
  isEncrypted(value: string): boolean {
    if (!value) return false;
    const parts = value.split(this.SEP);

    // Format versionné (v1:iv:authTag:data)
    if (parts.length === 4 && parts[0]?.startsWith('v')) {
      try {
        const iv = Buffer.from(parts[1] ?? '', 'base64');
        const authTag = Buffer.from(parts[2] ?? '', 'base64');
        return iv.length === this.IV_LENGTH && authTag.length === this.AUTH_TAG_LENGTH;
      } catch {
        return false;
      }
    }

    // Format legacy (iv:authTag:data)
    if (parts.length === 3) {
      try {
        const iv = Buffer.from(parts[0] ?? '', 'base64');
        const authTag = Buffer.from(parts[1] ?? '', 'base64');
        return iv.length === this.IV_LENGTH && authTag.length === this.AUTH_TAG_LENGTH;
      } catch {
        return false;
      }
    }

    return false;
  }

  // ─── Privé ────────────────────────────────────────────────────────────────

  private decryptWithKey(
    ivBase64: string,
    authTagBase64: string,
    encryptedBase64: string,
    key: Buffer,
  ): string {
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const encrypted = Buffer.from(encryptedBase64, 'base64');

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv, {
      authTagLength: this.AUTH_TAG_LENGTH,
    });

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
