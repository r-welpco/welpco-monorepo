import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from './entities/support-ticket.entity';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { SupportTicketResponseDto } from './dto/support-ticket-response.dto';
import { UpdateSupportTicketAdminDto } from './dto/update-support-ticket-admin.dto';
import { UserAccount, AccountType } from '../user-management/entities/user-account.entity';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class SupportTicketService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
  ) {}

  private toDto(t: SupportTicket): SupportTicketResponseDto {
    return {
      id: t.id,
      userId: t.userId,
      subject: t.subject,
      category: t.category,
      description: t.description ?? undefined,
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      assignedToUserId: t.assignedToUserId ?? null,
      internalNote: t.internalNote ?? null,
    };
  }

  async create(userId: string, dto: CreateSupportTicketDto): Promise<SupportTicketResponseDto> {
    const ticket = this.ticketRepo.create({
      userId,
      subject: dto.subject,
      category: dto.category ?? 'other',
      description: dto.description ?? null,
      priority: dto.priority ?? 'medium',
      status: 'open',
      assignedToUserId: null,
      internalNote: null,
    });
    const saved = await this.ticketRepo.save(ticket);
    return this.toDto(saved);
  }

  async findMine(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    data: SupportTicketResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const [tickets, total] = await this.ticketRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      data: tickets.map((t) => this.toDto(t)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findAllForAdmin(
    page = 1,
    limit = 20,
    status?: string,
  ): Promise<{
    data: SupportTicketResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const take = Math.min(Math.max(limit, 1), 100);
    const qb = this.ticketRepo
      .createQueryBuilder('t')
      .orderBy('t.created_at', 'DESC')
      .skip((page - 1) * take)
      .take(take);
    if (status?.trim()) {
      qb.andWhere('t.status = :status', { status: status.trim() });
    }
    const [tickets, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / take) || 1;
    return {
      data: tickets.map((t) => this.toDto(t)),
      total,
      page,
      limit: take,
      totalPages,
    };
  }

  async findByIdForAdmin(id: string): Promise<SupportTicketResponseDto> {
    const ticket = await this.ticketRepo.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }
    return this.toDto(ticket);
  }

  async updateForAdmin(
    id: string,
    dto: UpdateSupportTicketAdminDto,
  ): Promise<{ ticket: SupportTicketResponseDto; changes: Record<string, unknown> }> {
    const ticket = await this.ticketRepo.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    const changes: Record<string, unknown> = {};

    if (dto.status !== undefined) {
      ticket.status = dto.status;
      changes.status = dto.status;
    }

    if (dto.priority !== undefined) {
      ticket.priority = dto.priority;
      changes.priority = dto.priority;
    }

    if (dto.internalNote !== undefined) {
      const note = dto.internalNote === null ? null : String(dto.internalNote).slice(0, 4000);
      ticket.internalNote = note;
      changes.internalNote = note === null ? null : '[updated]';
    }

    if (dto.assignedToUserId !== undefined) {
      const raw = dto.assignedToUserId;
      if (raw === null || raw === '') {
        ticket.assignedToUserId = null;
        changes.assignedToUserId = null;
      } else {
        if (!UUID_RE.test(raw)) {
          throw new BadRequestException('assignedToUserId must be a valid UUID');
        }
        const adminUser = await this.userRepo.findOne({ where: { id: raw } });
        if (!adminUser || adminUser.accountType !== AccountType.ADMIN) {
          throw new BadRequestException('Assignee must be an Admin user account');
        }
        ticket.assignedToUserId = raw;
        changes.assignedToUserId = raw;
      }
    }

    const saved = await this.ticketRepo.save(ticket);
    return { ticket: this.toDto(saved), changes };
  }
}
