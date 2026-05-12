import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth';
import { CurrentUser, CurrentUserData } from '../../common/auth/decorators/current-user.decorator';
import { SupportTicketService } from './support-ticket.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

@ApiTags('Support Tickets')
@Controller('support-tickets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SupportTicketController {
  constructor(private readonly supportTicketService: SupportTicketService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a support ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateSupportTicketDto,
  ) {
    return this.supportTicketService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List current user\'s support tickets' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated tickets' })
  async list(
    @CurrentUser() user: CurrentUserData,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.supportTicketService.findMine(user.userId, page, limit);
  }
}
