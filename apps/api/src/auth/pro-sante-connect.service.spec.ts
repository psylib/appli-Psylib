import { describe, it, expect } from 'vitest';
import { ProSanteConnectService } from './pro-sante-connect.service';

describe('ProSanteConnectService (helpers purs)', () => {
  describe('extractRpps', () => {
    it('retire le préfixe 8 (SubjectNameID = 8 + RPPS)', () => {
      expect(ProSanteConnectService.extractRpps('810100092010')).toBe(
        '10100092010',
      );
    });

    it('accepte un RPPS nu de 11 chiffres', () => {
      expect(ProSanteConnectService.extractRpps('10100092010')).toBe(
        '10100092010',
      );
    });

    it('ignore les séparateurs non numériques', () => {
      expect(ProSanteConnectService.extractRpps('8 10100092010')).toBe(
        '10100092010',
      );
    });

    it('null si vide ou longueur inattendue', () => {
      expect(ProSanteConnectService.extractRpps(undefined)).toBeNull();
      expect(ProSanteConnectService.extractRpps('123')).toBeNull();
    });
  });

  describe('isPsychologist', () => {
    it('reconnaît le code 93 (psychologue) format code^OID', () => {
      expect(
        ProSanteConnectService.isPsychologist('93^1.2.250.1.213.1.1.5.5'),
      ).toBe(true);
    });

    it('reconnaît dans un tableau de rôles', () => {
      expect(
        ProSanteConnectService.isPsychologist([
          '10^1.2.250.1.213.1.1.5.5',
          '93^1.2.250.1.213.1.1.5.5',
        ]),
      ).toBe(true);
    });

    it('false pour un médecin (code 10)', () => {
      expect(
        ProSanteConnectService.isPsychologist('10^1.2.250.1.213.1.1.5.5'),
      ).toBe(false);
    });

    it('false si absent', () => {
      expect(ProSanteConnectService.isPsychologist(undefined)).toBe(false);
    });
  });

  describe('decodeJwtPayload', () => {
    it('décode le payload base64url d’un JWT', () => {
      const payload = { SubjectNameID: '810100092010', SubjectRole: '93^x' };
      const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const jwt = `header.${b64}.sig`;
      const decoded = ProSanteConnectService.decodeJwtPayload(jwt);
      expect(decoded.SubjectNameID).toBe('810100092010');
    });

    it('lève une erreur si le JWT est malformé', () => {
      expect(() => ProSanteConnectService.decodeJwtPayload('abc')).toThrow();
    });
  });
});
