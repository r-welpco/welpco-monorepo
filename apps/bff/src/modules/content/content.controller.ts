import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ContentService } from './content.service';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive categories',
  })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.contentService.getCategories(include);
  }

  @Get('categories/parent/:parentId')
  @ApiOperation({ summary: 'Get categories by parent ID' })
  @ApiParam({
    name: 'parentId',
    description: 'Parent category ID (use "null" for root categories)',
  })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategoriesByParent(@Param('parentId') parentId: string) {
    const parentIdValue = parentId === 'null' ? null : parentId;
    return this.contentService.getCategoriesByParent(parentIdValue);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategory(@Param('id') id: string) {
    return this.contentService.getCategory(id);
  }

  @Get('questions')
  @ApiOperation({ summary: 'Get all questions' })
  @ApiResponse({ status: 200, description: 'Questions retrieved successfully' })
  async getQuestions() {
    return this.contentService.getQuestions();
  }

  @Get('questions/:id')
  @ApiOperation({ summary: 'Get question by ID' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async getQuestion(@Param('id') id: string) {
    return this.contentService.getQuestion(id);
  }

  @Get('service-questions/:serviceCategoryId')
  @ApiOperation({ summary: 'Get questions for a service category' })
  @ApiParam({ name: 'serviceCategoryId', description: 'Service category ID' })
  @ApiResponse({
    status: 200,
    description: 'Service questions retrieved successfully',
  })
  async getServiceQuestions(@Param('serviceCategoryId') serviceCategoryId: string) {
    return this.contentService.getServiceQuestions(serviceCategoryId);
  }

  @Get('static-content')
  @ApiOperation({ summary: 'Get all static content' })
  @ApiQuery({
    name: 'includeUnpublished',
    required: false,
    type: Boolean,
    description: 'Include unpublished content',
  })
  @ApiResponse({ status: 200, description: 'Static content retrieved successfully' })
  async getStaticContent(@Query('includeUnpublished') includeUnpublished?: string) {
    const include = includeUnpublished === 'true';
    return this.contentService.getStaticContent(include);
  }

  @Get('static-content/type/:contentType')
  @ApiOperation({ summary: 'Get static content by type' })
  @ApiParam({ name: 'contentType', description: 'Content type' })
  @ApiQuery({
    name: 'includeUnpublished',
    required: false,
    type: Boolean,
    description: 'Include unpublished content',
  })
  @ApiResponse({ status: 200, description: 'Static content retrieved successfully' })
  async getStaticContentByType(
    @Param('contentType') contentType: string,
    @Query('includeUnpublished') includeUnpublished?: string,
  ) {
    const include = includeUnpublished === 'true';
    return this.contentService.getStaticContentByType(contentType, include);
  }

  @Get('holidays')
  @ApiOperation({ summary: 'List holidays by country and optional province (reference data)' })
  @ApiQuery({ name: 'countryCode', required: true, type: String, description: 'ISO 3166-1 alpha-2 (e.g. CA)' })
  @ApiQuery({ name: 'provinceCode', required: false, type: String, description: 'Province/state code (e.g. ON)' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'Start date YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'End date YYYY-MM-DD' })
  @ApiResponse({ status: 200, description: 'Holidays retrieved successfully' })
  async getHolidays(
    @Query('countryCode') countryCode: string,
    @Query('provinceCode') provinceCode?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.contentService.getHolidays({
      countryCode,
      provinceCode: provinceCode ?? null,
      from,
      to,
    });
  }
}
