import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3UrlPresignerService } from './s3-url-presigner.service';

/**
 * Wave 2 (BFF): exposes the S3 presigner globally so booking + dispute
 * domains (and any future domain that ships S3-backed file references) can
 * inject it without re-importing this module.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [S3UrlPresignerService],
  exports: [S3UrlPresignerService],
})
export class S3Module {}
