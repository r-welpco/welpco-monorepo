import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
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
} from '@nestjs/swagger';
import { ServiceQuestionsService } from './service-questions.service';
import { AssignQuestionDto } from './dto/assign-question.dto';
import { ServiceQuestionResponseDto } from './dto/service-question-response.dto';
import { JwtAuthGuard, RolesGuard, Roles } from '../../../common/auth';

@ApiTags('Service Questions')
@Controller('service-questions')
export class ServiceQuestionsController {
  constructor(
    private readonly serviceQuestionsService: ServiceQuestionsService,
  ) {}

  @Get('service/:serviceCategoryId')
  @ApiOperation({ summary: 'Get questions for a service category' })
  @ApiParam({ name: 'serviceCategoryId', description: 'Service category ID' })
  @ApiResponse({
    status: 200,
    description: 'Service questions retrieved successfully',
    type: [ServiceQuestionResponseDto],
  })
  async findByServiceCategory(@Param('serviceCategoryId') serviceCategoryId: string) {
    return this.serviceQuestionsService.findByServiceCategory(serviceCategoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service question by ID' })
  @ApiParam({ name: 'id', description: 'Service question ID' })
  @ApiResponse({
    status: 200,
    description: 'Service question retrieved successfully',
    type: ServiceQuestionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service question not found' })
  async findOne(@Param('id') id: string) {
    return this.serviceQuestionsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a question to a service category' })
  @ApiResponse({
    status: 201,
    description: 'Question assigned successfully',
    type: ServiceQuestionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async assign(@Body() assignDto: AssignQuestionDto) {
    return this.serviceQuestionsService.assign(assignDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update service question' })
  @ApiParam({ name: 'id', description: 'Service question ID' })
  @ApiResponse({
    status: 200,
    description: 'Service question updated successfully',
    type: ServiceQuestionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Service question not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: Partial<AssignQuestionDto>,
  ) {
    return this.serviceQuestionsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove question from service category' })
  @ApiParam({ name: 'id', description: 'Service question ID' })
  @ApiResponse({ status: 204, description: 'Service question removed successfully' })
  @ApiResponse({ status: 404, description: 'Service question not found' })
  async remove(@Param('id') id: string) {
    await this.serviceQuestionsService.remove(id);
  }
}
