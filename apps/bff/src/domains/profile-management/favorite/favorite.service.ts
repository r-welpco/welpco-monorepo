import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteWelper } from '../entities/favorite-welper.entity';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { WelperProfile } from '../entities/welper-profile.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { EventPublisherService } from '../events/event-publisher.service';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(FavoriteWelper)
    private favoriteRepository: Repository<FavoriteWelper>,
    @InjectRepository(CustomerProfile)
    private customerProfileRepository: Repository<CustomerProfile>,
    @InjectRepository(WelperProfile)
    private welperProfileRepository: Repository<WelperProfile>,
    private eventPublisher: EventPublisherService,
  ) {}

  async findByCustomerId(
    customerId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: FavoriteWelper[]; total: number; page: number; limit: number; totalPages: number }> {
    if (customerId !== userId) {
      throw new ForbiddenException('You can only view your own favorites');
    }
    const [data, total] = await this.favoriteRepository.findAndCount({
      where: { customerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(
    customerId: string,
    createDto: CreateFavoriteDto,
    userId: string,
  ): Promise<FavoriteWelper> {
    // Verify ownership
    if (customerId !== userId) {
      throw new ForbiddenException('You can only manage your own favorites');
    }

    // Verify customer profile exists
    const customerProfile = await this.customerProfileRepository.findOne({
      where: { customerId },
    });

    if (!customerProfile) {
      throw new NotFoundException('Customer profile not found');
    }

    // Verify welper profile exists
    const welperProfile = await this.welperProfileRepository.findOne({
      where: { welperId: createDto.welperId },
    });

    if (!welperProfile) {
      throw new NotFoundException('Welper profile not found');
    }

    // Check if already favorited
    const existing = await this.favoriteRepository.findOne({
      where: { customerId, welperId: createDto.welperId },
    });

    if (existing) {
      throw new ConflictException('Welper is already in favorites');
    }

    const favorite = this.favoriteRepository.create({
      customerId,
      welperId: createDto.welperId,
      notes: createDto.notes,
    });

    const saved = await this.favoriteRepository.save(favorite);

    // Publish event
    await this.eventPublisher.publishFavoriteWelperAdded({
      customerId,
      welperId: createDto.welperId,
      timestamp: new Date().toISOString(),
    });

    return saved;
  }

  async remove(
    customerId: string,
    welperId: string,
    userId: string,
  ): Promise<void> {
    // Verify ownership
    if (customerId !== userId) {
      throw new ForbiddenException('You can only remove your own favorites');
    }

    const favorite = await this.favoriteRepository.findOne({
      where: { customerId, welperId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepository.remove(favorite);
  }

  /**
   * Remove by favorite row ID (for frontend that sends favoriteId).
   */
  async removeByFavoriteId(
    customerId: string,
    favoriteId: string,
    userId: string,
  ): Promise<void> {
    if (customerId !== userId) {
      throw new ForbiddenException('You can only remove your own favorites');
    }

    const favorite = await this.favoriteRepository.findOne({
      where: { id: favoriteId, customerId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepository.remove(favorite);
  }

  /**
   * Remove by favorite row id (UUID) or by welperId, without using exceptions for control flow.
   */
  async removeByIdOrWelperId(customerId: string, id: string, userId: string): Promise<void> {
    if (customerId !== userId) {
      throw new ForbiddenException('You can only remove your own favorites');
    }

    const byRow = await this.favoriteRepository.findOne({
      where: { id, customerId },
    });
    if (byRow) {
      await this.favoriteRepository.remove(byRow);
      return;
    }

    const byWelper = await this.favoriteRepository.findOne({
      where: { customerId, welperId: id },
    });
    if (byWelper) {
      await this.favoriteRepository.remove(byWelper);
      return;
    }

    throw new NotFoundException('Favorite not found');
  }
}
