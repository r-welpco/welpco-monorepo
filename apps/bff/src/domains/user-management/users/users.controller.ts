import {
  Controller,
  Get,
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
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { CurrentUser, JwtAuthGuard, RolesGuard, Roles } from '../../../common/auth';
import { EmailVerifiedGuard } from '../../../common/guards/email-verified.guard';
import { AccountType, AccountStatus } from '../entities/user-account.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  async getCurrentUser(@CurrentUser() user: { userId: string }) {
    return this.usersService.findById(user.userId);
  }

  @Put('me')
  @UseGuards(EmailVerifiedGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user account' })
  @ApiResponse({
    status: 200,
    description: 'User account updated successfully',
    type: UserResponseDto,
  })
  async updateCurrentUser(
    @CurrentUser() user: { userId: string },
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.usersService.updateAccount(user.userId, updateDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate current account' })
  @ApiResponse({
    status: 200,
    description: 'Account deactivated successfully',
  })
  async deactivateCurrentUser(@CurrentUser() user: { userId: string }) {
    await this.usersService.deleteAccount(user.userId);
    return { message: 'Account deactivated successfully' };
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(AccountType.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(AccountType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user status (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
    type: UserResponseDto,
  })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: AccountStatus },
  ) {
    return this.usersService.updateStatus(id, body.status);
  }
}

