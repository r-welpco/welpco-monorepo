import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadsService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.getOrThrow<string>('AWS_S3_REGION');
    this.bucket = this.configService.getOrThrow<string>('AWS_S3_BUCKET');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async generatePresignedUrl(
    userId: string,
    fileName: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileKey = `profiles/${userId}/${randomUUID()}_${sanitized}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });
    const publicUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey}`;

    return { uploadUrl, fileKey, publicUrl };
  }
}
