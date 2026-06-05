/**
 * Découpage/réassemblage d'octets pour le transfert P2P via LiveKit DataChannel.
 * Les octets sont encodés en base64 (transport JSON texte) et découpés en
 * morceaux d'octets bruts (la taille s'applique AUX OCTETS, pas au base64).
 */

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function bytesToChunks(bytes: Uint8Array, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    chunks.push(bytesToBase64(bytes.subarray(offset, offset + chunkSize)));
  }
  return chunks;
}

export function chunksToBlob(chunks: string[], mimeType: string): Blob {
  const parts = chunks.map((c) => base64ToBytes(c));
  return new Blob(parts as BlobPart[], { type: mimeType });
}
