import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
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
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import {
  NotificationListQueryDto,
  NotificationListResponseDto,
  NotificationResponseDto,
  UnreadCountResponseDto,
  NotificationPreferenceDto,
  UpdatePreferencesDto,
} from './dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List notifications (paginated)' })
  @ApiResponse({ status: 200, description: 'Notifications list', type: NotificationListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(
    @CurrentUser() user: CurrentUserData,
    @Query() query: NotificationListQueryDto,
  ) {
    return this.notificationsService.getNotifications(user.userId, {
      isRead: query.isRead,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count', type: UnreadCountResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@CurrentUser() user: CurrentUserData) {
    return this.notificationsService.getUnreadCount(user.userId);
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification updated', type: NotificationResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(user.userId, id);
  }

  @Post('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(@CurrentUser() user: CurrentUserData) {
    await this.notificationsService.markAllAsRead(user.userId);
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences list', type: [NotificationPreferenceDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPreferences(@CurrentUser() user: CurrentUserData) {
    return this.notificationsService.getPreferences(user.userId);
  }

  @Put('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Updated preferences', type: [NotificationPreferenceDto] })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePreferences(
    @CurrentUser() user: CurrentUserData,
    @Body() body: UpdatePreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(user.userId, body);
  }
}
