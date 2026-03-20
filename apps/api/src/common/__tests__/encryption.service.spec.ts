import { describe, it, expect, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../encryption.service';

const TEST_KEY = 'a'.repeat(64); // 32 bytes hex valide pour les tests

function createService(): EncryptionService {
  const service = new EncryptionService({
    get: (key: string) => (key === 'ENCRYPTION_KEY' ? TEST_KEY : undefined),
    getOrThrow: (key: string) => {
      if (key === 'ENCRYPTION_KEY') return TEST_KEY;
      throw new Error(`Config ${key} not found`);
    },
  } as unknown as ConfigService);
  service.onModuleInit();
  return service;
}

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    service = createService();
  });

  describe('encrypt / decrypt roundtrip', () => {
    it('devrait chiffrer et déchiffrer le même texte', () => {
      const plaintext = 'Notes sensibles du patient — confidentielles';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('devrait produire des valeurs chiffrées différentes pour le même texte (IV aléatoire)', () => {
      const plaintext = 'Même texte deux fois';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);
      expect(encrypted1).not.toBe(encrypted2);
      // Les deux déchiffrements donnent le même résultat
      expect(service.decrypt(encrypted1)).toBe(plaintext);
      expect(service.decrypt(encrypted2)).toBe(plaintext);
    });

    it('devrait chiffrer un texte long (notes de séance)', () => {
      const longText = 'A'.repeat(10000);
      expect(service.decrypt(service.encrypt(longText))).toBe(longText);
    });

    it('devrait chiffrer des caractères spéciaux et accents', () => {
      const text = 'Séance avec Mme. Dupont — état émotionnel: anxiété élevée (8/10) 🧠';
      expect(service.decrypt(service.encrypt(text))).toBe(text);
    });

    it('devrait retourner string vide pour string vide', () => {
      expect(service.encrypt('')).toBe('');
      expect(service.decrypt('')).toBe('');
    });
  });

  describe('format du ciphertext', () => {
    it('devrait être au format v1:iv:authTag:encrypted (4 parties séparées par :)', () => {
      const encrypted = service.encrypt('test');
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(4);
      expect(parts[0]).toBe('v1');
    });

    it('devrait détecter un texte chiffré via isEncrypted()', () => {
      const encrypted = service.encrypt('test sensible');
      expect(service.isEncrypted(encrypted)).toBe(true);
      expect(service.isEncrypted('texte non chiffré')).toBe(false);
    });
  });

  describe('helpers nullable', () => {
    it('encryptNullable devrait retourner null si null', () => {
      expect(service.encryptNullable(null)).toBe(null);
      expect(service.encryptNullable(undefined)).toBe(null);
    });

    it('decryptNullable devrait retourner null si null', () => {
      expect(service.decryptNullable(null)).toBe(null);
    });

    it('devrait chiffrer/déchiffrer via helpers nullable', () => {
      const text = 'Contenu confidentiel';
      const encrypted = service.encryptNullable(text);
      expect(encrypted).not.toBeNull();
      expect(service.decryptNullable(encrypted)).toBe(text);
    });
  });

  describe('sécurité', () => {
    it('devrait lever une erreur si le ciphertext est altéré (auth tag invalide)', () => {
      const encrypted = service.encrypt('données sensibles');
      const parts = encrypted.split(':');
      // Altère le message chiffré (format v1:iv:authTag:data)
      const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:AAAA`;
      expect(() => service.decrypt(tampered)).toThrow();
    });

    it('devrait lever une erreur si le format est invalide', () => {
      expect(() => service.decrypt('format:invalide')).toThrow(
        '[EncryptionService] Format de chiffrement invalide',
      );
    });
  });
});
