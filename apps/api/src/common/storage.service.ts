import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Abstraction over file storage. Uses S3-compatible storage when configured
 * (AWS S3, OVH Object Storage, MinIO, etc.), falls back to local disk for development.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client | null;
  private readonly bucket: string;
  private readonly localBase = '/uploads/documents';

  constructor(private readonly config: ConfigService) {
    const bucket = this.config.get<string>('S3_DOCUMENTS_BUCKET');
    const region = this.config.get<string>('S3_REGION') ?? 'eu-west-3';

    if (bucket) {
      const endpoint = this.config.get<string>('S3_ENDPOINT');
      this.s3 = new S3Client({
        region,
        endpoint,
        forcePathStyle: !!endpoint, // Required for OVH / S3-compatible providers
        credentials: {
          accessKeyId: this.config.getOrThrow<string>('S3_ACCESS_KEY_ID'),
          secretAccessKey: this.config.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
        },
      });
      this.bucket = bucket;
      this.logger.log(`StorageService initialized with S3 bucket: ${bucket} (${region})${endpoint ? ` endpoint: ${endpoint}` : ''}`);
    } else {
      this.s3 = null;
      this.bucket = '';
      this.logger.warn('StorageService: S3 not configured, using local disk storage');
    }
  }

  get isS3(): boolean {
    return this.s3 !== null;
  }

  /**
   * Upload a file. Returns the storage key (S3 key or local path).
   */
  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    if (this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          ...(this.config.get<string>('S3_ENDPOINT') ? {} : { ServerSideEncryption: 'aws:kms' as const }),
        }),
      );
      return key;
    }

    // Local fallback
    const filePath = path.join(this.localBase, key);
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(this.localBase))) {
      throw new Error('Invalid storage path');
    }
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * Get a file's content as a Buffer.
   */
  async download(key: string): Promise<Buffer> {
    if (this.s3) {
      const response = await this.s3.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      const stream = response.Body;
      if (!stream) throw new Error('Empty S3 response');
      return Buffer.from(await stream.transformToByteArray());
    }

    return fs.readFile(key);
  }

  /**
   * Generate a pre-signed download URL (S3 only, 15min expiry).
   * Returns null for local storage.
   */
  async getSignedUrl(key: string, expiresIn = 900): Promise<string | null> {
    if (!this.s3) return null;
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
  }

  /**
   * Delete a file from storage.
   */
  async delete(key: string): Promise<void> {
    if (this.s3) {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return;
    }

    try {
      await fs.unlink(key);
    } catch {
      this.logger.warn(`File not found for deletion: ${key}`);
    }
  }
}
