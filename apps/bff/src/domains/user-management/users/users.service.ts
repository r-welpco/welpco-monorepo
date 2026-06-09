import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccount, AccountStatus } from '../entities/user-account.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { EventPublisherService } from '../events/event-publisher.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserAccount)
    private userRepository: Repository<UserAccount>,
    private eventPublisher: EventPublisherService,
  ) {}

  async findById(userId: string): Promise<UserAccount> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async updateAccount(
    userId: string,
    updateDto: UpdateUserDto,
  ): Promise<UserAccount> {
    const user = await this.findById(userId);

    if (updateDto.email && updateDto.email !== user.email) {
      // Check if new email is already taken
      const existingUser = await this.findByEmail(updateDto.email);
      if (existingUser && existingUser.id !== userId) {
        throw new ForbiddenException('Email already in use');
      }
      user.email = updateDto.email;
      user.emailVerified = false; // Require re-verification
    }

    return this.userRepository.save(user);
  }

  async updateStatus(
    userId: string,
    newStatus: AccountStatus,
  ): Promise<UserAccount> {
    const user = await this.findById(userId);
    const oldStatus = user.status;

    user.status = newStatus;
    if (newStatus !== oldStatus) {
      user.authVersion = (user.authVersion ?? 0) + 1;
    }
    const updatedUser = await this.userRepository.save(user);

    // Publish event
    await this.eventPublisher.publishAccountStatusChanged({
      userId: updatedUser.id,
      oldStatus,
      newStatus,
      timestamp: new Date().toISOString(),
    });

    return updatedUser;
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.findById(userId);
    const oldStatus = user.status;
    user.status = AccountStatus.DEACTIVATED;
    user.authVersion = (user.authVersion ?? 0) + 1;
    await this.userRepository.save(user);

    // Publish event
    await this.eventPublisher.publishAccountStatusChanged({
      userId: user.id,
      oldStatus,
      newStatus: AccountStatus.DEACTIVATED,
      timestamp: new Date().toISOString(),
    });
  }
}
