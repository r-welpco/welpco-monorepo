import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StaticContentService } from './static-content.service';
import { CreateStaticContentDto } from './dto/create-static-content.dto';
import { UpdateStaticContentDto } from './dto/update-static-content.dto';
import { StaticContentResponseDto } from './dto/static-content-response.dto';
import { ContentType } from '../entities/static-content.entity';
import { JwtAuthGuard, RolesGuard, Roles } from '../../../common/auth';

@ApiTags('Static Content')
@Controller('static-content')
export class StaticContentController {
  constructor(private readonly staticContentService: StaticContentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all static content' })
  @ApiQuery({
    name: 'includeUnpublished',
    required: false,
    type: Boolean,
    description: 'Include unpublished content',
  })
  @ApiResponse({
    status: 200,
    description: 'Static content retrieved successfully',
    type: [StaticContentResponseDto],
  })
  async findAll(@Query('includeUnpublished') includeUnpublished?: string) {
    const include = includeUnpublished === 'true';
    return this.staticContentService.findAll(include);
  }

  @Get('type/:contentType')
  @ApiOperation({ summary: 'Get static content by type' })
  @ApiParam({
    name: 'contentType',
    description: 'Content type',
    enum: ContentType,
  })
  @ApiQuery({
    name: 'includeUnpublished',
    required: false,
    type: Boolean,
    description: 'Include unpublished content',
  })
  @ApiResponse({
    status: 200,
    description: 'Static content retrieved successfully',
    type: StaticContentResponseDto,
  })
  async findByType(
    @Param('contentType') contentType: ContentType,
    @Query('includeUnpublished') includeUnpublished?: string,
  ) {
    const include = includeUnpublished === 'true';
    return this.staticContentService.findByType(contentType, include);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get static content by ID' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({
    status: 200,
    description: 'Static content retrieved successfully',
    type: StaticContentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Static content not found' })
  async findOne(@Param('id') id: string) {
    return this.staticContentService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new static content' })
  @ApiResponse({
    status: 201,
    description: 'Static content created successfully',
    type: StaticContentResponseDto,
  })
  async create(@Body() createDto: CreateStaticContentDto) {
    return this.staticContentService.create(createDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update static content' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({
    status: 200,
    description: 'Static content updated successfully',
    type: StaticContentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Static content not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateStaticContentDto,
  ) {
    return this.staticContentService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete static content' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({ status: 204, description: 'Static content deleted successfully' })
  @ApiResponse({ status: 404, description: 'Static content not found' })
  async remove(@Param('id') id: string) {
    await this.staticContentService.remove(id);
  }
}
