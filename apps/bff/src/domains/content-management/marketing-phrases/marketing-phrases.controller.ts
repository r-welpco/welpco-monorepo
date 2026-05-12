import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MarketingPhrasesService } from './marketing-phrases.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../../../common/auth';
import { PhraseType } from '../entities/marketing-phrase.entity';

@ApiTags('Marketing Phrases')
@Controller('marketing-phrases')
export class MarketingPhrasesController {
  constructor(private readonly service: MarketingPhrasesService) {}

  @Get()
  @ApiOperation({ summary: 'List marketing phrases' })
  async findAll(@Query('phraseType') phraseType?: PhraseType) {
    return this.service.findAll(phraseType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get marketing phrase by ID' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create marketing phrase' })
  async create(@Body() body: { phraseText: string; phraseType: PhraseType; usageContext?: string; isActive?: boolean }) {
    return this.service.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update marketing phrase' })
  async update(@Param('id') id: string, @Body() body: Partial<{ phraseText: string; phraseType: PhraseType; usageContext: string; isActive: boolean }>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete marketing phrase' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }
}
