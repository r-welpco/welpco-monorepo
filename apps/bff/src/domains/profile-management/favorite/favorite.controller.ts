import {
  Controller,
  Get,
  Post,
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
import { FavoriteService } from './favorite.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoriteResponseDto } from './dto/favorite-response.dto';
import { CurrentUser, JwtAuthGuard } from '../../../common/auth';

@ApiTags('Favorites')
@Controller('profiles/customer/:customerId/favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Get()
  @ApiOperation({ summary: 'List favorite Welpers' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Items per page (default: 20, max: 100)' })
  @ApiResponse({
    status: 200,
    description: 'Favorite Welpers retrieved successfully',
    type: [FavoriteResponseDto],
  })
  async getFavorites(
    @Param('customerId') customerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20;
    return this.favoriteService.findByCustomerId(customerId, pageNum, limitNum);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add favorite Welper' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({
    status: 201,
    description: 'Favorite Welper added successfully',
    type: FavoriteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @ApiResponse({ status: 409, description: 'Already in favorites' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async addFavorite(
    @Param('customerId') customerId: string,
    @Body() createDto: CreateFavoriteDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.favoriteService.create(customerId, createDto, user.userId);
  }

  @Delete(':welperId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove favorite Welper' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiParam({ name: 'welperId', description: 'Welper ID' })
  @ApiResponse({
    status: 204,
    description: 'Favorite Welper removed successfully',
  })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async removeFavorite(
    @Param('customerId') customerId: string,
    @Param('welperId') welperId: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.favoriteService.remove(customerId, welperId, user.userId);
  }
}

