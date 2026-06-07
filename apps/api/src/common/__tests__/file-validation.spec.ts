import { describe, it, expect } from 'vitest';
import {
  detectMimeFromMagicBytes,
  assertAllowedBinaryContent,
} from '../file-validation';

const PDF = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d]);
const ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14]); // DOCX/ODT
const EXE = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03]); // MZ (Windows PE)
const TOO_SHORT = Buffer.from([0x25, 0x50]);

describe('detectMimeFromMagicBytes', () => {
  it('recognises PDF / JPEG / PNG', () => {
    expect(detectMimeFromMagicBytes(PDF)).toBe('application/pdf');
    expect(detectMimeFromMagicBytes(JPEG)).toBe('image/jpeg');
    expect(detectMimeFromMagicBytes(PNG)).toBe('image/png');
  });

  it('returns null for ZIP-based containers (DOCX/ODT)', () => {
    expect(detectMimeFromMagicBytes(ZIP)).toBeNull();
  });

  it('returns octet-stream for unknown/suspicious signatures', () => {
    expect(detectMimeFromMagicBytes(EXE)).toBe('application/octet-stream');
  });

  it('returns null when the buffer is too short to sniff', () => {
    expect(detectMimeFromMagicBytes(TOO_SHORT)).toBeNull();
  });
});

describe('assertAllowedBinaryContent', () => {
  const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];

  it('passes for allowed content', () => {
    expect(() => assertAllowedBinaryContent(PDF, ALLOWED)).not.toThrow();
    expect(() => assertAllowedBinaryContent(JPEG, ALLOWED)).not.toThrow();
    expect(() => assertAllowedBinaryContent(PNG, ALLOWED)).not.toThrow();
  });

  it('rejects an executable disguised as a PDF', () => {
    expect(() => assertAllowedBinaryContent(EXE, ALLOWED)).toThrow();
  });

  it('rejects ZIP-based content when only PDF/JPEG/PNG are allowed', () => {
    expect(() => assertAllowedBinaryContent(ZIP, ALLOWED)).toThrow();
  });

  it('rejects content whose real type is not in the allow-list', () => {
    expect(() => assertAllowedBinaryContent(PNG, ['application/pdf'])).toThrow();
  });
});
