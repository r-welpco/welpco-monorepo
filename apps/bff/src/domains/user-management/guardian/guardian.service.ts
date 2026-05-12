import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuardianAccount, RelationshipType } from '../entities/guardian-account.entity';
import { UserAccount } from '../entities/user-account.entity';
import { CreateGuardianDto } from './dto/create-guardian.dto';

@Injectable()
export class GuardianService {
  constructor(
    @InjectRepository(GuardianAccount)
    private guardianRepository: Repository<GuardianAccount>,
    @InjectRepository(UserAccount)
    private userRepository: Repository<UserAccount>,
  ) {}

  async createGuardianAccount(
    guardianUserId: string,
    createDto: CreateGuardianDto,
  ): Promise<GuardianAccount> {
    const { minorUserId, relationshipType } = createDto;

    // Prevent self-referral
    if (guardianUserId === minorUserId) {
      throw new BadRequestException('A user cannot be their own guardian');
    }

    // Verify guardian user exists
    const guardian = await this.userRepository.findOne({
      where: { id: guardianUserId },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian user not found');
    }

    // Verify minor user exists
    const minor = await this.userRepository.findOne({
      where: { id: minorUserId },
    });

    if (!minor) {
      throw new NotFoundException('Minor user not found');
    }

    // Check if relationship already exists
    const existingRelationship = await this.guardianRepository.findOne({
      where: {
        guardianUserId,
        minorUserId,
      },
    });

    if (existingRelationship) {
      return existingRelationship;
    }

    // Create guardian account relationship
    const guardianAccount = this.guardianRepository.create({
      guardianUserId,
      minorUserId,
      relationshipType,
    });

    return this.guardianRepository.save(guardianAccount);
  }

  async getGuardianRelationships(
    userId: string,
  ): Promise<GuardianAccount[]> {
    return this.guardianRepository.find({
      where: [{ guardianUserId: userId }, { minorUserId: userId }],
      relations: ['guardianUser', 'minorUser'],
    });
  }

  async validateGuardianAccess(
    guardianUserId: string,
    minorUserId: string,
  ): Promise<boolean> {
    const relationship = await this.guardianRepository.findOne({
      where: {
        guardianUserId,
        minorUserId,
      },
    });

    return !!relationship;
  }
}

