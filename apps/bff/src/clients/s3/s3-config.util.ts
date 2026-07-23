import type { ConfigService } from '@nestjs/config';
import type { S3ClientConfig } from '@aws-sdk/client-s3';

/**
 * Shared S3 configuration resolution so every S3 client + public-URL builder
 * agrees on bucket/region/endpoint. Production points at AWS (no endpoint →
 * SDK default host, virtual-hosted URLs); local dev points at MinIO via
 * `S3_ENDPOINT` + `S3_FORCE_PATH_STYLE=true` (MinIO needs path-style, and
 * presigned/public URLs must use the browser-reachable host, e.g.
 * `http://localhost:9000`).
 */

export function resolveS3Bucket(config: ConfigService): string | null {
  return (
    config.get<string>('S3_BUCKET_EVIDENCE') ??
    config.get<string>('AWS_S3_BUCKET') ??
    null
  );
}

export function resolveS3Region(config: ConfigService): string | null {
  return (
    config.get<string>('S3_REGION') ??
    config.get<string>('AWS_S3_REGION') ??
    null
  );
}

/**
 * Builds the `S3Client` config. When `S3_ENDPOINT` is set (MinIO/local),
 * enables path-style addressing so both signed and public URLs resolve against
 * the custom host.
 */
export function resolveS3ClientConfig(
  config: ConfigService,
  region: string,
): S3ClientConfig {
  const accessKeyId = config.get<string>('AWS_ACCESS_KEY_ID');
  const secretAccessKey = config.get<string>('AWS_SECRET_ACCESS_KEY');
  const endpoint = config.get<string>('S3_ENDPOINT');
  const forcePathStyle =
    config.get<string>('S3_FORCE_PATH_STYLE') === 'true' || !!endpoint;

  return {
    region,
    // AWS SDK v3 (≥3.729) defaults to `WHEN_SUPPORTED`, which bakes an
    // x-amz-checksum-crc32 of an EMPTY body into presigned PUT URLs — the
    // browser then uploads the real body and MinIO/S3 reject the signature.
    // `WHEN_REQUIRED` restores classic presigned-PUT behaviour for both.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    ...(accessKeyId && secretAccessKey
      ? { credentials: { accessKeyId, secretAccessKey } }
      : {}),
    ...(endpoint ? { endpoint, forcePathStyle } : {}),
  };
}

/**
 * Unsigned public-object URL. With a custom endpoint / `S3_PUBLIC_URL` (MinIO),
 * uses path-style `{host}/{bucket}/{key}`; otherwise the AWS virtual-hosted
 * `https://{bucket}.s3.{region}.amazonaws.com/{key}`.
 */
export function buildPublicObjectUrl(
  config: ConfigService,
  bucket: string,
  region: string,
  key: string,
): string {
  const publicBase =
    config.get<string>('S3_PUBLIC_URL') ?? config.get<string>('S3_ENDPOINT');
  if (publicBase) {
    return `${publicBase.replace(/\/+$/, '')}/${bucket}/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
