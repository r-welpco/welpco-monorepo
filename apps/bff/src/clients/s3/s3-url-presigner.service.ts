import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  resolveS3Bucket,
  resolveS3ClientConfig,
  resolveS3Region,
} from './s3-config.util';

/**
 * Wave 2 (BFF): centralised on-demand presigner for evidence files (booking
 * receipts + dispute uploads). URLs are short-lived (default 15 min) and never
 * persisted — we sign at response-build time so a stolen DTO body can't be
 * re-played past the TTL.
 *
 * Configuration (env):
 *   - `S3_BUCKET_EVIDENCE` (preferred) or `AWS_S3_BUCKET` (fallback to the
 *     existing upload bucket — the legacy uploads service points at one bucket
 *     today, and Wave 2 reuses it until ops splits the evidence bucket).
 *   - `S3_REGION` (preferred) or `AWS_S3_REGION` (fallback).
 *   - `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` for explicit creds in dev;
 *     omit both in production to fall back on the SDK's IRSA / instance-role
 *     credential chain.
 *   - `S3_PRESIGN_TTL_SECONDS` (default 900 = 15 min).
 *
 * If the bucket/region isn't configured the service stays in a degraded mode
 * and returns `null` from `presignGet` instead of throwing — that lets local
 * dev (no AWS creds) and tests run without failing every receipt/dispute read.
 * Callers should treat `null` as "no signed URL available; show file metadata
 * only".
 */
@Injectable()
export class S3UrlPresignerService implements OnModuleInit {
  private readonly logger = new Logger(S3UrlPresignerService.name);
  private client: S3Client | null = null;
  private bucket: string | null = null;
  private region: string | null = null;
  private ttlSeconds = 900;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const bucket = resolveS3Bucket(this.configService);
    const region = resolveS3Region(this.configService);
    const ttlRaw = this.configService.get<string>('S3_PRESIGN_TTL_SECONDS');
    const parsedTtl = ttlRaw ? Number.parseInt(ttlRaw, 10) : NaN;
    if (Number.isFinite(parsedTtl) && parsedTtl > 0) {
      this.ttlSeconds = parsedTtl;
    }

    if (!bucket || !region) {
      this.logger.warn(
        'S3UrlPresignerService not configured (missing S3_BUCKET_EVIDENCE/AWS_S3_BUCKET or S3_REGION/AWS_S3_REGION). presignGet() will return null until configured.',
      );
      return;
    }

    this.bucket = bucket;
    this.region = region;

    // Client config (creds + optional MinIO/local endpoint + path-style) is
    // shared with the uploads service + public-URL builder via s3-config.util.
    this.client = new S3Client(
      resolveS3ClientConfig(this.configService, region),
    );
  }

  /** TTL applied to presigned GET URLs, in seconds. Exposed for tests + telemetry. */
  getTtlSeconds(): number {
    return this.ttlSeconds;
  }

  isConfigured(): boolean {
    return this.client !== null && this.bucket !== null;
  }

  /**
   * Returns a short-lived presigned GET URL for the given object key, or `null`
   * when the presigner isn't configured or signing fails. Errors are swallowed
   * (with a warn log) so a transient AWS hiccup doesn't take down the whole
   * receipt/dispute response.
   */
  async presignGet(key: string): Promise<string | null> {
    if (!this.client || !this.bucket) {
      return null;
    }
    if (!key || typeof key !== 'string') {
      return null;
    }
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      return await getSignedUrl(this.client, command, {
        expiresIn: this.ttlSeconds,
      });
    } catch (e) {
      this.logger.warn(
        `Failed to presign GET for key "${key}": ${(e as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Helper for batch-signing arrays of keys. Returns a parallel array of URLs
   * (preserving order). `null` entries indicate the corresponding key couldn't
   * be signed (or wasn't a string).
   */
  async presignGetMany(keys: ReadonlyArray<string>): Promise<Array<string | null>> {
    return Promise.all(keys.map((k) => this.presignGet(k)));
  }

  /**
   * DISPUTES-001 (Day 16): short-lived presigned PUT URL for direct
   * browser-to-S3 evidence uploads. The TTL matches the GET TTL (default 15
   * min); the caller (dispute presign endpoint) is responsible for namespacing
   * the key (`disputes/<userId>/<uuid>.<ext>`) and validating the
   * content-type + size BEFORE signing — this method does not enforce policy.
   *
   * Returns `null` when the presigner is misconfigured (matches `presignGet`
   * degraded behaviour) so the API can return a clean 503 instead of crashing.
   */
  async presignPut(
    key: string,
    contentType: string,
  ): Promise<string | null> {
    if (!this.client || !this.bucket) {
      return null;
    }
    if (!key || typeof key !== 'string') {
      return null;
    }
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });
      return await getSignedUrl(this.client, command, {
        expiresIn: this.ttlSeconds,
      });
    } catch (e) {
      this.logger.warn(
        `Failed to presign PUT for key "${key}": ${(e as Error).message}`,
      );
      return null;
    }
  }
}
