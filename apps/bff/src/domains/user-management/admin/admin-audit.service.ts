import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAuditLog } from './admin-audit-log.entity';

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(
    @InjectRepository(AdminAuditLog)
    private readonly repo: Repository<AdminAuditLog>,
  ) {}

  async record(actorUserId: string, action: string, metadata?: Record<string, unknown>): Promise<void> {
    try {
      await this.repo.save(
        this.repo.create({
          actorUserId,
          action,
          metadata: metadata ?? null,
        }),
      );
    } catch (e) {
      this.logger.warn(`Audit log failed (${action}): ${(e as Error).message}`);
    }
  }

  async findPage(
    page = 1,
    limit = 50,
  ): Promise<{
    data: Array<{
      id: string;
      actorUserId: string;
      action: string;
      metadata: Record<string, unknown> | null;
      createdAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const take = Math.min(Math.max(limit, 1), 100);
    const [rows, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * take,
      take,
    });
    const totalPages = Math.ceil(total / take) || 1;
    return {
      data: rows.map((r) => ({
        id: r.id,
        actorUserId: r.actorUserId,
        action: r.action,
        metadata: r.metadata,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: safePage,
      limit: take,
      totalPages,
    };
  }
}
