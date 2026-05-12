import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { PresignedUrlRequestDto } from './dto/presigned-url-request.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/auth/decorators/current-user.decorator';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presigned-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a presigned S3 upload URL' })
  async getPresignedUrl(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: PresignedUrlRequestDto,
  ) {
    return this.uploadsService.generatePresignedUrl(
      user.userId,
      dto.fileName,
      dto.contentType,
    );
  }
}
