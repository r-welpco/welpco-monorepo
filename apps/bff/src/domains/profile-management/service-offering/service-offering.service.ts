import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOffering } from '../entities/service-offering.entity';
import { WelperProfile } from '../entities/welper-profile.entity';
import { CreateServiceOfferingDto } from './dto/create-service-offering.dto';
import { UpdateServiceOfferingDto } from './dto/update-service-offering.dto';
import { EventPublisherService } from '../events/event-publisher.service';

@Injectable()
export class ServiceOfferingService {
  constructor(
    @InjectRepository(ServiceOffering)
    private serviceOfferingRepository: Repository<ServiceOffering>,
    @InjectRepository(WelperProfile)
    private welperProfileRepository: Repository<WelperProfile>,
    private eventPublisher: EventPublisherService,
  ) {}

  async findByWelperId(
    welperId: string,
    page: number = 1,
    limit: number = 20,
    active?: boolean,
  ): Promise<{ data: ServiceOffering[]; total: number; page: number; limit: number; totalPages: number }> {
    const where: any = { welperId };
    if (active !== undefined) {
      where.active = active;
    }

    const [data, total] = await this.serviceOfferingRepository.findAndCount({
      where,
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

  async findById(serviceId: string): Promise<ServiceOffering> {
    const offering = await this.serviceOfferingRepository.findOne({
      where: { id: serviceId },
    });

    if (!offering) {
      throw new NotFoundException('Service offering not found');
    }

    return offering;
  }

  async create(
    welperId: string,
    createDto: CreateServiceOfferingDto,
    userId: string,
  ): Promise<ServiceOffering> {
    // Verify ownership
    if (welperId !== userId) {
      throw new ForbiddenException('You can only add services to your own profile');
    }

    // Verify welper profile exists
    const profile = await this.welperProfileRepository.findOne({
      where: { welperId },
    });

    if (!profile) {
      throw new NotFoundException('Welper profile not found');
    }

    // Create offering - ensure active is explicitly set
    const offering = this.serviceOfferingRepository.create({
      serviceCategoryId: createDto.serviceCategoryId,
      serviceDescription: createDto.serviceDescription,
      hourlyRate: createDto.hourlyRate,
      experienceYears: createDto.experienceYears ?? 1,
      serviceArea: createDto.serviceArea,
      subcategoryIds: createDto.subcategoryIds ?? [],
      welperId,
      active: createDto.active !== undefined ? createDto.active : true,
    });

    const saved = await this.serviceOfferingRepository.save(offering);

    // Publish event
    await this.eventPublisher.publishServiceOfferingAdded({
      serviceOfferingId: saved.id,
      welperId: saved.welperId,
      serviceCategoryId: saved.serviceCategoryId,
      timestamp: new Date().toISOString(),
    });

    return saved;
  }

  async update(
    welperId: string,
    serviceId: string,
    updateDto: UpdateServiceOfferingDto,
    userId: string,
  ): Promise<ServiceOffering> {
    // Verify ownership
    if (welperId !== userId) {
      throw new ForbiddenException('You can only update your own services');
    }

    const offering = await this.findById(serviceId);

    if (offering.welperId !== welperId) {
      throw new ForbiddenException('Service offering does not belong to this welper');
    }

    // Update fields
    if (updateDto.serviceCategoryId !== undefined) {
      offering.serviceCategoryId = updateDto.serviceCategoryId;
    }
    if (updateDto.serviceDescription !== undefined) {
      offering.serviceDescription = updateDto.serviceDescription;
    }
    if (updateDto.hourlyRate !== undefined) {
      offering.hourlyRate = updateDto.hourlyRate;
    }
    if (updateDto.experienceYears !== undefined) {
      offering.experienceYears = updateDto.experienceYears;
    }
    if (updateDto.serviceArea !== undefined) {
      offering.serviceArea = updateDto.serviceArea;
    }
    if (updateDto.subcategoryIds !== undefined) {
      offering.subcategoryIds = updateDto.subcategoryIds;
    }
    if (updateDto.active !== undefined) {
      offering.active = updateDto.active;
    }

    return this.serviceOfferingRepository.save(offering);
  }

  async delete(
    welperId: string,
    serviceId: string,
    userId: string,
  ): Promise<void> {
    // Verify ownership
    if (welperId !== userId) {
      throw new ForbiddenException('You can only delete your own services');
    }

    const offering = await this.findById(serviceId);

    if (offering.welperId !== welperId) {
      throw new ForbiddenException('Service offering does not belong to this welper');
    }

    await this.serviceOfferingRepository.remove(offering);
  }
}

