import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { UserAccount, AccountType, AccountStatus } from '../entities/user-account.entity';
import {
  VerificationStatus,
  BackgroundCheckStatus,
} from '../entities/verification-status.entity';
import { Dispute } from '../../dispute/entities/dispute.entity';
import { SupportTicket } from '../../dispute/entities/support-ticket.entity';
import { BookingRequest, BookingRequestStatus } from '../../booking/entities/booking-request.entity';
import { BookingPayment } from '../../payment/entities/booking-payment.entity';
import { ServiceCategory } from '../../content-management/entities/service-category.entity';
import { ServiceOffering } from '../../profile-management/entities/service-offering.entity';

export interface WelpersPerSubcategoryRow {
  subcategoryId: string;
  subcategoryName: string;
  welperCount: number;
  displayOrder: number;
}

export interface WelpersPerCategoryRow {
  categoryId: string;
  categoryName: string;
  welperCount: number;
  displayOrder: number;
  subcategories: WelpersPerSubcategoryRow[];
}

export interface AdminDashboardSnapshot {
  generatedAt: string;
  users: {
    totalUsers: number;
    activeUsers: number;
    pendingUsers: number;
    suspendedUsers: number;
    deactivatedUsers: number;
    customers: number;
    welpers: number;
    guardians: number;
    welpersPending: number;
    welpersSignupIncomplete: number;
    welpersBgInProgress: number;
    welpersBgFailed: number;
  };
  welpersPerCategory: WelpersPerCategoryRow[];
  disputes: {
    open: number;
    inReview: number;
    escalated: number;
    resolved: number;
  };
  supportTickets: {
    open: number;
    inProgress: number;
    closed: number;
  };
  bookings: {
    createdLast24h: number;
    currentlyDisputed: number;
  };
  payments: {
    capturedCentsLast7d: number;
    currency: string;
  };
}

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userRepository: Repository<UserAccount>,
    @InjectRepository(Dispute)
    private readonly disputeRepository: Repository<Dispute>,
    @InjectRepository(SupportTicket)
    private readonly supportTicketRepository: Repository<SupportTicket>,
    @InjectRepository(BookingRequest)
    private readonly bookingRepository: Repository<BookingRequest>,
    @InjectRepository(BookingPayment)
    private readonly bookingPaymentRepository: Repository<BookingPayment>,
    @InjectRepository(VerificationStatus)
    private readonly verificationRepository: Repository<VerificationStatus>,
    @InjectRepository(ServiceCategory)
    private readonly serviceCategoryRepository: Repository<ServiceCategory>,
    @InjectRepository(ServiceOffering)
    private readonly serviceOfferingRepository: Repository<ServiceOffering>,
  ) {}

  async getSnapshot(): Promise<AdminDashboardSnapshot> {
    const now = Date.now();
    const since24h = new Date(now - 24 * 60 * 60 * 1000);
    const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      deactivatedUsers,
      customers,
      welpers,
      guardians,
      welpersPending,
      welpersSignupIncomplete,
      welpersBgInProgress,
      welpersBgFailed,
      disputesOpen,
      disputesInReview,
      disputesEscalated,
      disputesResolved,
      ticketsOpen,
      ticketsInProgress,
      ticketsClosed,
      bookingsCreated24h,
      bookingsDisputed,
      paymentAgg,
      welpersPerCategory,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { status: AccountStatus.ACTIVE } }),
      this.userRepository.count({ where: { status: AccountStatus.PENDING } }),
      this.userRepository.count({ where: { status: AccountStatus.SUSPENDED } }),
      this.userRepository.count({ where: { status: AccountStatus.DEACTIVATED } }),
      this.userRepository.count({ where: { accountType: AccountType.CUSTOMER } }),
      this.userRepository.count({ where: { accountType: AccountType.WELPER } }),
      this.userRepository.count({ where: { accountType: AccountType.GUARDIAN } }),
      this.userRepository.count({
        where: { accountType: AccountType.WELPER, status: AccountStatus.PENDING },
      }),
      this.userRepository.count({
        where: {
          accountType: AccountType.WELPER,
          signupCompleted: false,
        },
      }),
      this.verificationRepository
        .createQueryBuilder('vs')
        .innerJoin(UserAccount, 'u', 'u.id = vs.user_id')
        .where('u.account_type = :welper', { welper: AccountType.WELPER })
        .andWhere('vs.background_check_status = :inProgress', {
          inProgress: BackgroundCheckStatus.IN_PROGRESS,
        })
        .getCount(),
      this.verificationRepository
        .createQueryBuilder('vs')
        .innerJoin(UserAccount, 'u', 'u.id = vs.user_id')
        .where('u.account_type = :welper', { welper: AccountType.WELPER })
        .andWhere('vs.background_check_status = :failed', {
          failed: BackgroundCheckStatus.FAILED,
        })
        .getCount(),
      this.disputeRepository.count({ where: { status: 'open' } }),
      this.disputeRepository.count({ where: { status: 'in_review' } }),
      this.disputeRepository.count({ where: { status: 'escalated' } }),
      this.disputeRepository.count({ where: { status: 'resolved' } }),
      this.supportTicketRepository.count({ where: { status: 'open' } }),
      this.supportTicketRepository.count({ where: { status: 'in_progress' } }),
      this.supportTicketRepository.count({ where: { status: 'closed' } }),
      this.bookingRepository.count({
        where: { createdAt: MoreThanOrEqual(since24h) },
      }),
      this.bookingRepository.count({
        where: { status: BookingRequestStatus.DISPUTED },
      }),
      this.bookingPaymentRepository
        .createQueryBuilder('bp')
        .select('COALESCE(SUM(bp.amount_cents), 0)', 'total')
        .addSelect('MAX(bp.currency)', 'currency')
        .where('bp.captured_at IS NOT NULL')
        .andWhere('bp.captured_at >= :since', { since: since7d })
        .getRawOne<{ total: string; currency: string | null }>(),
      this.getWelpersPerCategory(),
    ]);

    const totalCents = paymentAgg?.total != null ? parseInt(String(paymentAgg.total), 10) : 0;
    const currency = (paymentAgg?.currency ?? 'cad').toLowerCase();

    return {
      generatedAt: new Date(now).toISOString(),
      users: {
        totalUsers,
        activeUsers,
        pendingUsers,
        suspendedUsers,
        deactivatedUsers,
        customers,
        welpers,
        guardians,
        welpersPending,
        welpersSignupIncomplete,
        welpersBgInProgress,
        welpersBgFailed,
      },
      disputes: {
        open: disputesOpen,
        inReview: disputesInReview,
        escalated: disputesEscalated,
        resolved: disputesResolved,
      },
      supportTickets: {
        open: ticketsOpen,
        inProgress: ticketsInProgress,
        closed: ticketsClosed,
      },
      bookings: {
        createdLast24h: bookingsCreated24h,
        currentlyDisputed: bookingsDisputed,
      },
      payments: {
        capturedCentsLast7d: Number.isFinite(totalCents) ? totalCents : 0,
        currency,
      },
      welpersPerCategory,
    };
  }

  /**
   * Distinct welpers with at least one active offering, rolled up to level-1 service categories.
   */
  private async getWelpersPerCategory(): Promise<WelpersPerCategoryRow[]> {
    const [countRows, subCountRows, level1Categories, level2Categories] = await Promise.all([
      this.serviceOfferingRepository
        .createQueryBuilder('so')
        .innerJoin(UserAccount, 'u', 'u.id = so.welper_id')
        .innerJoin(ServiceCategory, 'sc', 'sc.id = so.service_category_id')
        .leftJoin(ServiceCategory, 'parent', 'parent.id = sc.parent_id')
        .where('u.account_type = :welper', { welper: AccountType.WELPER })
        .andWhere('so.active = :active', { active: true })
        .select('COALESCE(parent.id, sc.id)', 'categoryId')
        .addSelect('COALESCE(parent.name, sc.name)', 'categoryName')
        .addSelect('COUNT(DISTINCT so.welper_id)', 'welperCount')
        .groupBy('COALESCE(parent.id, sc.id)')
        .addGroupBy('COALESCE(parent.name, sc.name)')
        .getRawMany<{ categoryId: string; categoryName: string; welperCount: string }>(),
      this.serviceOfferingRepository
        .createQueryBuilder('so')
        .innerJoin(UserAccount, 'u', 'u.id = so.welper_id')
        .innerJoin(ServiceCategory, 'sc', 'sc.id = so.service_category_id')
        .innerJoin(
          ServiceCategory,
          'sub',
          `sub.level = :subLevel AND (
            sub.id = sc.id
            OR sub.id::text IN (
              SELECT jsonb_array_elements_text(COALESCE(so.subcategory_ids, '[]'::jsonb))
            )
          )`,
          { subLevel: 2 },
        )
        .where('u.account_type = :welper', { welper: AccountType.WELPER })
        .andWhere('so.active = :active', { active: true })
        .select('sub.parent_id', 'parentCategoryId')
        .addSelect('sub.id', 'subcategoryId')
        .addSelect('sub.name', 'subcategoryName')
        .addSelect('sub.display_order', 'displayOrder')
        .addSelect('COUNT(DISTINCT so.welper_id)', 'welperCount')
        .groupBy('sub.parent_id')
        .addGroupBy('sub.id')
        .addGroupBy('sub.name')
        .addGroupBy('sub.display_order')
        .getRawMany<{
          parentCategoryId: string;
          subcategoryId: string;
          subcategoryName: string;
          displayOrder: string;
          welperCount: string;
        }>(),
      this.serviceCategoryRepository.find({
        where: { level: 1, isActive: true },
        order: { displayOrder: 'ASC', name: 'ASC' },
        select: ['id', 'name', 'displayOrder'],
      }),
      this.serviceCategoryRepository.find({
        where: { level: 2, isActive: true },
        order: { displayOrder: 'ASC', name: 'ASC' },
        select: ['id', 'name', 'parentId', 'displayOrder'],
      }),
    ]);

    const countByCategoryId = new Map<string, number>();
    for (const row of countRows) {
      const count = parseInt(String(row.welperCount), 10);
      countByCategoryId.set(row.categoryId, Number.isFinite(count) ? count : 0);
    }

    const subCountBySubcategoryId = new Map<string, number>();
    for (const row of subCountRows) {
      const count = parseInt(String(row.welperCount), 10);
      subCountBySubcategoryId.set(row.subcategoryId, Number.isFinite(count) ? count : 0);
    }

    const subcategoriesByParentId = new Map<string, WelpersPerSubcategoryRow[]>();
    for (const sub of level2Categories) {
      if (!sub.parentId) continue;
      const rows = subcategoriesByParentId.get(sub.parentId) ?? [];
      rows.push({
        subcategoryId: sub.id,
        subcategoryName: sub.name,
        welperCount: subCountBySubcategoryId.get(sub.id) ?? 0,
        displayOrder: sub.displayOrder,
      });
      subcategoriesByParentId.set(sub.parentId, rows);
    }

    for (const subs of subcategoriesByParentId.values()) {
      subs.sort((a, b) => {
        if (b.welperCount !== a.welperCount) return b.welperCount - a.welperCount;
        return a.displayOrder - b.displayOrder;
      });
    }

    const knownIds = new Set(level1Categories.map((c) => c.id));
    const rows: WelpersPerCategoryRow[] = level1Categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      welperCount: countByCategoryId.get(cat.id) ?? 0,
      displayOrder: cat.displayOrder,
      subcategories: subcategoriesByParentId.get(cat.id) ?? [],
    }));

    for (const row of countRows) {
      if (!knownIds.has(row.categoryId)) {
        rows.push({
          categoryId: row.categoryId,
          categoryName: row.categoryName,
          welperCount: parseInt(String(row.welperCount), 10) || 0,
          displayOrder: 9999,
          subcategories: [],
        });
      }
    }

    return rows.sort((a, b) => {
      if (b.welperCount !== a.welperCount) return b.welperCount - a.welperCount;
      return a.displayOrder - b.displayOrder;
    });
  }
}
