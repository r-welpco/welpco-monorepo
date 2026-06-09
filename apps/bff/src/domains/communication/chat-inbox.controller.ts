import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  JwtAuthGuard,
  CurrentUser,
  SignupCompletedGuard,
} from '../../common/auth';
import { CommunicationService } from './communication.service';
import { ChatInboxItemDto } from './dto/chat-inbox-item.dto';

interface AuthUser {
  userId: string;
  email: string;
  accountType: string;
  effectiveRole: string;
}

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard, SignupCompletedGuard)
@ApiBearerAuth('JWT-auth')
export class ChatInboxController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Get('inbox')
  @ApiOperation({ summary: 'Chat inbox: participant bookings with last message preview' })
  @ApiResponse({ status: 200, type: [ChatInboxItemDto] })
  async listInbox(@CurrentUser() user: AuthUser): Promise<ChatInboxItemDto[]> {
    return this.communicationService.listChatInbox(
      user.userId,
      user.effectiveRole,
    );
  }
}
