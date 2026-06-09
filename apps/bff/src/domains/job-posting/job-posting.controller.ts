import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import {
  JwtAuthGuard,
  CurrentUser,
  Roles,
  RolesGuard,
  SignupCompletedGuard,
  customerWelperRoleForAuthUser,
} from '../../common/auth';
import { EmailVerifiedGuard } from '../../common/guards/email-verified.guard';
import { JobPostingService } from './job-posting.service';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';
import {
  JobPostingBrowseQueryDto,
  JobPostingMineQueryDto,
} from './dto/job-posting-query.dto';

interface AuthUser {
  userId: string;
  email: string;
  accountType: string;
  effectiveRole?: string;
}

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard, SignupCompletedGuard)
@ApiBearerAuth('JWT-auth')
export class JobPostingController {
  constructor(private readonly jobPostingService: JobPostingService) {}

  @Post()
  @UseGuards(RolesGuard, EmailVerifiedGuard)
  @Roles('customer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create and publish a job posting (customer)' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateJobPostingDto) {
    return this.jobPostingService.create(user.userId, dto);
  }

  @Get('mine')
  @UseGuards(RolesGuard)
  @Roles('customer')
  @ApiOperation({ summary: 'List own job postings (customer)' })
  async listMine(@CurrentUser() user: AuthUser, @Query() query: JobPostingMineQueryDto) {
    return this.jobPostingService.findMine(user.userId, query);
  }

  @Get('applications/mine')
  @UseGuards(RolesGuard)
  @Roles('welper')
  @ApiOperation({ summary: 'List welper job applications' })
  async listMyApplications(
    @CurrentUser() user: AuthUser,
    @Query() query: JobPostingMineQueryDto,
  ) {
    return this.jobPostingService.listMyApplications(
      user.userId,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('welper')
  @ApiOperation({ summary: 'Browse open job postings (welper)' })
  async browse(@CurrentUser() user: AuthUser, @Query() query: JobPostingBrowseQueryDto) {
    return this.jobPostingService.browseForWelper(user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job posting detail (role-scoped)' })
  @ApiParam({ name: 'id', description: 'Job posting ID' })
  async getById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const role = customerWelperRoleForAuthUser(user);
    if (role === 'customer') {
      return this.jobPostingService.findByIdForCustomer(user.userId, id);
    }
    if (role === 'welper') {
      return this.jobPostingService.findByIdForWelper(user.userId, id);
    }
    throw new ForbiddenException('Unsupported account type');
  }

  @Get(':id/applications')
  @UseGuards(RolesGuard)
  @Roles('customer')
  @ApiOperation({ summary: 'List applications for a job (customer owner)' })
  @ApiParam({ name: 'id', description: 'Job posting ID' })
  async listApplications(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.jobPostingService.listApplicationsForCustomer(user.userId, id);
  }

  @Get(':id/applications/:appId/booking-handoff')
  @UseGuards(RolesGuard)
  @Roles('customer')
  @ApiOperation({ summary: 'Booking form pre-fill context for selected application' })
  async bookingHandoff(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('appId') appId: string,
  ) {
    return this.jobPostingService.getBookingHandoff(user.userId, id, appId);
  }

  @Post(':id/applications')
  @UseGuards(RolesGuard, EmailVerifiedGuard)
  @Roles('welper')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Apply to a job posting (welper)' })
  async apply(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateJobApplicationDto,
  ) {
    return this.jobPostingService.apply(user.userId, id, dto);
  }

  @Post(':id/applications/:appId/withdraw')
  @UseGuards(RolesGuard)
  @Roles('welper')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw a pending application (welper)' })
  async withdraw(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('appId') appId: string,
  ) {
    return this.jobPostingService.withdrawApplication(user.userId, id, appId);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('customer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a job posting (customer)' })
  async cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.jobPostingService.cancelJob(user.userId, id);
  }
}
