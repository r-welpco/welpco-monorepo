import {
  Controller,
  Get,
  Post,
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
  ApiBody,
} from '@nestjs/swagger';
import { GuardianService } from './guardian.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { CurrentUser, JwtAuthGuard } from '../../../common/auth';

@ApiTags('Guardian')
@Controller('guardian')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GuardianController {
  constructor(private readonly guardianService: GuardianService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create guardian account for minor' })
  @ApiBody({ type: CreateGuardianDto })
  @ApiResponse({
    status: 201,
    description: 'Guardian account created successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async createGuardianAccount(
    @CurrentUser() user: { userId: string },
    @Body() createDto: CreateGuardianDto,
  ) {
    return this.guardianService.createGuardianAccount(
      user.userId,
      createDto,
    );
  }

  @Get('relationships')
  @ApiOperation({ summary: 'Get guardian relationships' })
  @ApiResponse({
    status: 200,
    description: 'Guardian relationships retrieved successfully',
  })
  async getGuardianRelationships(@CurrentUser() user: { userId: string }) {
    return this.guardianService.getGuardianRelationships(user.userId);
  }
}

