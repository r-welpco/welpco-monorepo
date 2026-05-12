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
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionResponseDto } from './dto/question-response.dto';
import { JwtAuthGuard, RolesGuard, Roles } from '../../../common/auth';

@ApiTags('Questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all questions' })
  @ApiResponse({
    status: 200,
    description: 'Questions retrieved successfully',
    type: [QuestionResponseDto],
  })
  async findAll() {
    return this.questionsService.findAll();
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get questions by type' })
  @ApiParam({ name: 'type', description: 'Question type' })
  @ApiResponse({
    status: 200,
    description: 'Questions retrieved successfully',
    type: [QuestionResponseDto],
  })
  async findByType(@Param('type') type: string) {
    return this.questionsService.findByType(type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get question by ID' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiResponse({
    status: 200,
    description: 'Question retrieved successfully',
    type: QuestionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new question' })
  @ApiResponse({
    status: 201,
    description: 'Question created successfully',
    type: QuestionResponseDto,
  })
  async create(@Body() createDto: CreateQuestionDto) {
    return this.questionsService.create(createDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update question' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiResponse({
    status: 200,
    description: 'Question updated successfully',
    type: QuestionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete question' })
  @ApiParam({ name: 'id', description: 'Question ID' })
  @ApiResponse({ status: 204, description: 'Question deleted successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async remove(@Param('id') id: string) {
    await this.questionsService.remove(id);
  }
}
