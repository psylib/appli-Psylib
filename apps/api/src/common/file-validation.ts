/**
 * Centralised file-content validation via magic bytes.
 *
 * Client-declared MIME types are trivially spoofable. Before persisting any
 * uploaded file we sniff its real signature and reject mismatches. Shared by the
 * documents and expenses modules so the HDS upload policy stays consistent.
 */

/** MIME types whose signature we can positively identify from magic bytes. */
export type DetectedMime =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'application/octet-stream' // recognised-but-unsupported / unknown binary
  | null; // ZIP-based (DOCX/ODT) — indistinguishable from a bare ZIP header

/**
 * Detect a file's MIME type from its leading magic bytes.
 *
 * Returns:
 *  - a concrete MIME string for PDF / JPEG / PNG,
 *  - `null` for ZIP-based containers (DOCX/ODT share `PK\x03\x04` — caller must
 *    fall back to the declared type for those),
 *  - `'application/octet-stream'` for anything else (treat as suspicious).
 */
export function detectMimeFromMagicBytes(buffer: Buffer): DetectedMime {
  if (buffer.length < 4) return null;
  // PDF: %PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'application/pdf';
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  // ZIP-based (DOCX, ODT): PK\x03\x04 — cannot distinguish from raw ZIP header.
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return null;
  }
  // Unknown / unsupported signature — could be malicious.
  return 'application/octet-stream';
}

/**
 * Assert that an uploaded buffer's real content matches one of the allowed
 * non-ZIP MIME types (PDF/JPEG/PNG). Throws an Error with `message` on mismatch.
 *
 * Use for modules that only accept PDF/JPEG/PNG (e.g. expense receipts). For
 * modules that also accept DOCX/ODT, handle the `null` (ZIP) case explicitly.
 */
export function assertAllowedBinaryContent(
  buffer: Buffer,
  allowedMimeTypes: readonly string[],
  message = 'Le contenu du fichier ne correspond pas au type déclaré.',
): void {
  const detected = detectMimeFromMagicBytes(buffer);
  // ZIP-based or unrecognised content is not allowed for PDF/JPEG/PNG-only uploads.
  if (detected === null || detected === 'application/octet-stream') {
    throw new Error(message);
  }
  if (!allowedMimeTypes.includes(detected)) {
    throw new Error(message);
  }
}
