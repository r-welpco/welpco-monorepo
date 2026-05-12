import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FaqItemsService } from './faq-items.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../../../common/auth';
import { FAQCategory } from '../entities/faq-item.entity';

@ApiTags('FAQ Items')
@Controller('faq-items')
export class FaqItemsController {
  constructor(private readonly service: FaqItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List FAQ items' })
  async findAll(@Query('category') category?: FAQCategory) {
    return this.service.findAll(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get FAQ item by ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create FAQ item' })
  async create(@Body() body: { category: FAQCategory; question: string; answer: string; displayOrder?: number; isActive?: boolean }) {
    return this.service.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update FAQ item' })
  async update(@Param('id') id: string, @Body() body: Partial<{ category: FAQCategory; question: string; answer: string; displayOrder: number; isActive: boolean }>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete FAQ item' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}
