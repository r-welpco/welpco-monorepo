import { Injectable } from '@nestjs/common';
import { UsersService as DomainUsersService } from '../../domains/user-management/users/users.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly domainUsersService: DomainUsersService,
  ) {}

  async findById(userId: string) {
    return this.domainUsersService.findById(userId);
  }
}
