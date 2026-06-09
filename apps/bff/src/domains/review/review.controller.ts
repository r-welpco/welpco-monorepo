import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, SignupCompletedGuard } from '../../common/auth';
import { CurrentUser, CurrentUserData } from '../../common/auth/decorators/current-user.decorator';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';

@ApiTags('Reviews')
@Controller()
@UseGuards(JwtAuthGuard, SignupCompletedGuard)
@ApiBearerAuth('JWT-auth')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('bookings/:bookingId/review')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a review for a completed booking' })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiResponse({ status: 201, description: 'Review created' })
  @ApiResponse({ status: 400, description: 'Booking not completed or validation error' })
  @ApiResponse({ status: 403, description: 'Not a participant of this booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 409, description: 'Already reviewed this booking' })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.create(
      bookingId,
      user.userId,
      user.effectiveRole,
      dto,
    );
  }

  @Patch('bookings/:bookingId/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update the current user\'s review for this booking' })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Review updated' })
  @ApiResponse({ status: 400, description: 'Booking not in a reviewable state' })
  @ApiResponse({ status: 403, description: 'Not a participant of this booking' })
  @ApiResponse({ status: 404, description: 'Booking or review not found' })
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.update(
      bookingId,
      user.userId,
      user.effectiveRole,
      dto,
    );
  }

  @Get('bookings/:bookingId/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user\'s review for this booking' })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Review if submitted, or null if not yet submitted' })
  async getByBooking(
    @CurrentUser() user: CurrentUserData,
    @Param('bookingId') bookingId: string,
  ): Promise<{ review: ReviewResponseDto | null }> {
    const review = await this.reviewService.getByBooking(bookingId, user.userId);
    return { review };
  }

  @Get('welpers/:welperId/reviews')
  @ApiOperation({ summary: 'List reviews for a welper (public)' })
  @ApiParam({ name: 'welperId', description: 'Welper user ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated reviews' })
  async getReviewsForWelper(
    @Param('welperId') welperId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.reviewService.getReviewsForWelper(welperId, page, limit);
  }
}
