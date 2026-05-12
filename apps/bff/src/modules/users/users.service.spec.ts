import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersService as DomainUsersService } from '../../domains/user-management/users/users.service';

describe('UsersService', () => {
  let service: UsersService;
  let domainUsersService: jest.Mocked<Pick<DomainUsersService, 'findById'>>;

  beforeEach(async () => {
    const mockDomainUsersService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DomainUsersService, useValue: mockDomainUsersService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    domainUsersService = module.get(DomainUsersService);
  });

  describe('findById', () => {
    it('should delegate to domain UsersService.findById', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        accountType: 'Customer',
      };

      domainUsersService.findById.mockResolvedValue(mockUser as any);

      const result = await service.findById('user-1');

      expect(domainUsersService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });

    it('should propagate errors from domainUsersService', async () => {
      domainUsersService.findById.mockRejectedValue(
        new HttpException('Unauthorized', 401),
      );

      await expect(service.findById('missing')).rejects.toThrow(HttpException);
    });
  });
});
