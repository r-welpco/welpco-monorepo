import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Inject, forwardRef } from '@nestjs/common';
import {
  JobApplication,
  JobApplicationStatus,
  JobPosting,
  JobPostingStatus,
  JOB_POSTING_EXPIRY_DAYS,
  JOB_POSTING_MAX_APPLICATIONS,
} from './entities';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';
import {
  BookingHandoffContextDto,
  JobApplicationResponseDto,
  JobPostingListItemDto,
  JobPostingResponseDto,
  PaginatedJobApplicationsDto,
  PaginatedJobPostingsDto,
} from './dto/job-posting-response.dto';
import {
  AdminJobPostingListQueryDto,
  JobPostingBrowseQueryDto,
  JobPostingMineQueryDto,
} from './dto/job-posting-query.dto';
import { maybeRefreshJobStatus } from './job-status.helper';
import {
  offeringMatchesSubcategory,
  resolveApplyBlockReason,
  resolveMatchingOfferings,
} from './job-eligibility.helper';
import { isJobOpenForApplications, validateJobPostingTransition } from './job-posting-state-machine';
import { BookingService } from '../booking/booking.service';
import {
  CustomerProfileService,
  type CustomerDisplayInfo,
} from '../profile-management/customer-profile/customer-profile.service';
import { ProfileCompletionStatus } from '../profile-management/entities/profile-completion-status.enum';
import { ServiceOfferingService } from '../profile-management/service-offering/service-offering.service';
import { WelperProfileService } from '../profile-management/welper-profile/welper-profile.service';
import { BackgroundCheckService } from '../safety-verification/background-check.service';
import { CategoriesService } from '../content-management/categories/categories.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationCategory } from '../notification/entities';
import { GEOCODE_SERVICE } from '../geocode/geocode.interface';
import type { IGeocodeService } from '../geocode/geocode.interface';
import { formatWelperDisplayNameForCustomer } from '../../common/display-name.util';
import type { Address } from '../../common/types';
import { BookingRequest } from '../booking/entities/booking-request.entity';
import { UsersService } from '../user-management/users/users.service';
import { getFrontendBaseUrl } from '../notification/notification-locale.helper';

@Injectable()
export class JobPostingService {
  private readonly logger = new Logger(JobPostingService.name);

  constructor(
    @InjectRepository(JobPosting)
    private readonly jobRepo: Repository<JobPosting>,
    @InjectRepository(JobApplication)
    private readonly applicationRepo: Repository<JobApplication>,
    @InjectRepository(BookingRequest)
    private readonly bookingRepo: Repository<BookingRequest>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService,
    private readonly customerProfileService: CustomerProfileService,
    private readonly serviceOfferingService: ServiceOfferingService,
    private readonly welperProfileService: WelperProfileService,
    private readonly backgroundCheckService: BackgroundCheckService,
    private readonly categoriesService: CategoriesService,
    private readonly notificationService: NotificationService,
    private readonly usersService: UsersService,
    @Inject(GEOCODE_SERVICE)
    private readonly geocodeService: IGeocodeService,
  ) {}

  // ─── Customer: create ─────────────────────────────────────────────────

  async create(customerId: string, dto: CreateJobPostingDto): Promise<JobPostingResponseDto> {
    await this.assertCustomerCanPost(customerId);
    this.assertJobScheduleIsValid(dto.scheduledDate, dto.scheduledStartTime, dto.scheduledEndTime, dto.durationMinutes);

    const title = dto.title.trim();
    const description = dto.description.trim();
    if (!title) {
      throw new BadRequestException('Job title is required');
    }
    if (!description) {
      throw new BadRequestException('Job description is required');
    }

    const subcategory = await this.categoriesService.findOne(dto.subcategoryId);
    if (subcategory.level !== 2) {
      throw new BadRequestException('Subcategory must be a level-2 category');
    }
    if (subcategory.parentId !== dto.categoryId) {
      throw new BadRequestException('Subcategory does not belong to the selected category');
    }

    const validatedAnswers = await this.bookingService.validateServiceQuestionAnswers(
      dto.subcategoryId,
      dto.answers ?? {},
    );

    const profile = await this.customerProfileService.findByCustomerId(customerId);
    const profileAddress = profile.address as Address | null;
    if (!profileAddress?.city || !profileAddress?.state) {
      throw new BadRequestException('Add a complete home address in Settings before posting a job.');
    }

    let locationLat: string | null = null;
    let locationLng: string | null = null;
    if (profileAddress.zipCode) {
      try {
        const geocode = await this.geocodeService.forward(
          profileAddress.zipCode,
          profileAddress.country ?? 'CA',
        );
        if (geocode.latitude != null && geocode.longitude != null) {
          locationLat = String(geocode.latitude);
          locationLng = String(geocode.longitude);
        }
      } catch (err) {
        this.logger.warn(
          `Geocode failed for job post by ${customerId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + JOB_POSTING_EXPIRY_DAYS);

    const locationAddress = dto.locationAddress.trim();
    if (!locationAddress) {
      throw new BadRequestException('Service address is required');
    }

    const job = this.jobRepo.create({
      customerId,
      categoryId: dto.categoryId,
      subcategoryId: dto.subcategoryId,
      serviceQuestionCategoryId: dto.subcategoryId,
      answers: validatedAnswers,
      title,
      description,
      scheduledDate: dto.scheduledDate,
      scheduledStartTime: dto.scheduledStartTime,
      scheduledEndTime: dto.scheduledEndTime,
      durationMinutes: dto.durationMinutes,
      locationAddress,
      locationLat,
      locationLng,
      locationCity: profileAddress.city.trim(),
      locationRegion: profileAddress.state.trim(),
      status: JobPostingStatus.PUBLISHED,
      applicationCount: 0,
      maxApplications: JOB_POSTING_MAX_APPLICATIONS,
      expiresAt,
      publishedAt: now,
      bookingId: null,
    });

    const saved = await this.jobRepo.save(job);
    return this.toOwnerResponse(saved);
  }

  // ─── Customer: list mine ──────────────────────────────────────────────

  async findMine(
    customerId: string,
    query: JobPostingMineQueryDto,
  ): Promise<PaginatedJobPostingsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [rows, total] = await this.jobRepo.findAndCount({
      where: { customerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const refreshed = await Promise.all(
      rows.map((job) => maybeRefreshJobStatus(job, this.jobRepo, this.bookingRepo)),
    );

    const data = await Promise.all(refreshed.map((job) => this.toListItem(job, customerId, 'customer')));
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  // ─── Customer: detail + applications ──────────────────────────────────

  async findByIdForCustomer(customerId: string, jobId: string): Promise<JobPostingResponseDto> {
    const job = await this.getJobOrThrow(jobId);
    if (job.customerId !== customerId) {
      throw new ForbiddenException('You do not own this job posting');
    }
    const refreshed = await maybeRefreshJobStatus(job, this.jobRepo, this.bookingRepo);
    return this.toOwnerResponse(refreshed);
  }

  async listApplicationsForCustomer(
    customerId: string,
    jobId: string,
  ): Promise<JobApplicationResponseDto[]> {
    const job = await this.getJobOrThrow(jobId);
    if (job.customerId !== customerId) {
      throw new ForbiddenException('You do not own this job posting');
    }
    await maybeRefreshJobStatus(job, this.jobRepo, this.bookingRepo);

    const applications = await this.applicationRepo.find({
      where: { jobPostingId: jobId },
      order: { createdAt: 'DESC' },
    });

    return Promise.all(applications.map((app) => this.toApplicationResponse(app)));
  }

  async getBookingHandoff(
    customerId: string,
    jobId: string,
    applicationId: string,
  ): Promise<BookingHandoffContextDto> {
    const job = await this.getJobOrThrow(jobId);
    if (job.customerId !== customerId) {
      throw new ForbiddenException('You do not own this job posting');
    }
    const refreshed = await maybeRefreshJobStatus(job, this.jobRepo, this.bookingRepo);

    if (refreshed.bookingId) {
      throw new BadRequestException('This job already has a linked booking');
    }
    if (!isJobOpenForApplications(refreshed.status)) {
      throw new BadRequestException('This job is no longer accepting booking requests');
    }

    const application = await this.applicationRepo.findOne({
      where: { id: applicationId, jobPostingId: jobId },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (application.status !== JobApplicationStatus.PENDING) {
      throw new BadRequestException('Application is not pending');
    }

    const offering = await this.serviceOfferingService.findById(application.offeringId);
    if (!offeringMatchesSubcategory(offering, refreshed.subcategoryId)) {
      throw new BadRequestException('Application offering no longer matches job subcategory');
    }

    return {
      jobPostingId: refreshed.id,
      jobApplicationId: application.id,
      jobTitle: refreshed.title,
      welperId: application.welperId,
      offeringId: application.offeringId,
      serviceQuestionCategoryId: refreshed.serviceQuestionCategoryId,
      answers: refreshed.answers,
      scheduledDate: refreshed.scheduledDate,
      scheduledStartTime: this.normalizeTime(refreshed.scheduledStartTime),
      scheduledEndTime: this.normalizeTime(refreshed.scheduledEndTime),
      durationMinutes: refreshed.durationMinutes,
      locationAddress: refreshed.locationAddress,
      locationCity: refreshed.locationCity,
      locationRegion: refreshed.locationRegion,
      hourlyRate: offering.hourlyRate ? Number(offering.hourlyRate) : null,
      notes: null,
    };
  }

  async cancelJob(customerId: string, jobId: string): Promise<JobPostingResponseDto> {
    const job = await this.getJobOrThrow(jobId);
    if (job.customerId !== customerId) {
      throw new ForbiddenException('You do not own this job posting');
    }
    const refreshed = await maybeRefreshJobStatus(job, this.jobRepo, this.bookingRepo);

    if (refreshed.bookingId) {
      throw new BadRequestException('Cannot cancel a job that has a linked booking');
    }
    if (
      refreshed.status === JobPostingStatus.CANCELLED ||
      refreshed.status === JobPostingStatus.COMPLETED ||
      refreshed.status === JobPostingStatus.CONVERTED_TO_BOOKING
    ) {
      throw new BadRequestException('Job cannot be cancelled in its current status');
    }

    validateJobPostingTransition(refreshed.status, JobPostingStatus.CANCELLED);
    refreshed.status = JobPostingStatus.CANCELLED;
    const saved = await this.jobRepo.save(refreshed);

    const pendingApps = await this.applicationRepo.find({
      where: { jobPostingId: jobId, status: JobApplicationStatus.PENDING },
    });
    if (pendingApps.length > 0) {
      await this.applicationRepo.update(
        { jobPostingId: jobId, status: JobApplicationStatus.PENDING },
        { status: JobApplicationStatus.REJECTED },
      );
      for (const app of pendingApps) {
        await this.notifyWelper(app.welperId, 'Job cancelled', `The job "${saved.title}" was cancelled by the customer.`, saved.id);
      }
    }

    return this.toOwnerResponse(saved);
  }

  // ─── Welper: browse ───────────────────────────────────────────────────

  async browseForWelper(
    welperId: string,
    query: JobPostingBrowseQueryDto,
  ): Promise<PaginatedJobPostingsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.jobRepo
      .createQueryBuilder('job')
      .where('job.status IN (:...statuses)', {
        statuses: [JobPostingStatus.PUBLISHED, JobPostingStatus.APPLICATIONS_OPEN],
      })
      .andWhere('job.expires_at > :now', { now: new Date() });

    if (query.categoryId) {
      qb.andWhere('job.category_id = :categoryId', { categoryId: query.categoryId });
    }
    if (query.subcategoryId) {
      qb.andWhere('job.subcategory_id = :subcategoryId', { subcategoryId: query.subcategoryId });
    }

    if (
      query.latitude != null &&
      query.longitude != null &&
      query.radiusKm != null &&
      query.radiusKm > 0
    ) {
      const radiusM = query.radiusKm * 1000;
      qb.andWhere('job.location_lat IS NOT NULL AND job.location_lng IS NOT NULL');
      qb.andWhere(
        `(6371000 * acos(cos(radians(:lat)) * cos(radians(job.location_lat::float)) * cos(radians(job.location_lng::float) - radians(:lng)) + sin(radians(:lat)) * sin(radians(job.location_lat::float)))) <= :radiusM`,
        { lat: query.latitude, lng: query.longitude, radiusM },
      );
    }

    const offeringsResult = await this.serviceOfferingService.findByWelperId(welperId, 1, 100, true);
    const matchingSubcategoryIds = new Set<string>();
    for (const offering of offeringsResult.data) {
      for (const id of offering.subcategoryIds ?? []) {
        matchingSubcategoryIds.add(id);
      }
    }

    if (query.eligibleOnly) {
      if (matchingSubcategoryIds.size === 0) {
        return { data: [], total: 0, page, limit, totalPages: 0 };
      }
      qb.andWhere('job.subcategory_id IN (:...subIds)', {
        subIds: [...matchingSubcategoryIds],
      });
    }

    qb.orderBy('job.published_at', 'DESC', 'NULLS LAST').addOrderBy('job.created_at', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [rows, total] = await qb.getManyAndCount();
    const customerDisplay = await this.customerProfileService.findDisplayInfoByCustomerIds(
      rows.map((job) => job.customerId),
    );
    const data = await Promise.all(
      rows.map((job) =>
        this.toListItem(
          job,
          welperId,
          'welper',
          offeringsResult.data,
          customerDisplay.get(job.customerId),
        ),
      ),
    );
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async findByIdForWelper(welperId: string, jobId: string): Promise<JobPostingResponseDto> {
    const job = await this.getJobOrThrow(jobId);
    const refreshed = await maybeRefreshJobStatus(job, this.jobRepo, this.bookingRepo);

    if (
      refreshed.status !== JobPostingStatus.PUBLISHED &&
      refreshed.status !== JobPostingStatus.APPLICATIONS_OPEN &&
      refreshed.status !== JobPostingStatus.EXPIRED
    ) {
      const myApp = await this.applicationRepo.findOne({
        where: { jobPostingId: jobId, welperId },
      });
      if (!myApp) {
        throw new NotFoundException('Job not found');
      }
    }

    const offeringsResult = await this.serviceOfferingService.findByWelperId(welperId, 1, 100, true);
    return this.toWelperDetailResponse(refreshed, welperId, offeringsResult.data);
  }

  async apply(
    welperId: string,
    jobId: string,
    dto: CreateJobApplicationDto,
  ): Promise<JobApplicationResponseDto> {
    const offeringsResult = await this.serviceOfferingService.findByWelperId(welperId, 1, 100, true);
    const discoverable = await this.backgroundCheckService.assertVisibleInSearch(welperId);

    const { savedApp, job } = await this.dataSource.transaction(async (manager) => {
      const jobRepo = manager.getRepository(JobPosting);
      const appRepo = manager.getRepository(JobApplication);
      let lockedJob = await jobRepo
        .createQueryBuilder('job')
        .setLock('pessimistic_write')
        .where('job.id = :jobId', { jobId })
        .getOne();
      if (!lockedJob) {
        throw new NotFoundException('Job posting not found');
      }
      lockedJob = await maybeRefreshJobStatus(lockedJob, jobRepo, this.bookingRepo);

      const existing = await appRepo.findOne({
        where: { jobPostingId: jobId, welperId },
      });
      const matching = resolveMatchingOfferings(offeringsResult.data, lockedJob.subcategoryId);
      const blockReason = resolveApplyBlockReason({
        job: lockedJob,
        discoverable,
        matchingOfferings: matching,
        existingApplication: !!existing,
      });
      if (blockReason) {
        throw new BadRequestException({ code: blockReason, message: `Cannot apply: ${blockReason}` });
      }

      const offering = matching.find((o) => o.id === dto.offeringId);
      if (!offering) {
        throw new BadRequestException('Selected offering does not match this job subcategory');
      }

      const application = appRepo.create({
        jobPostingId: jobId,
        welperId,
        offeringId: dto.offeringId,
        proposalMessage: dto.proposalMessage.trim(),
        status: JobApplicationStatus.PENDING,
        hourlyRateSnapshot: offering.hourlyRate != null ? String(offering.hourlyRate) : null,
      });
      const savedApp = await appRepo.save(application);

      if (lockedJob.status === JobPostingStatus.PUBLISHED) {
        validateJobPostingTransition(lockedJob.status, JobPostingStatus.APPLICATIONS_OPEN);
        lockedJob.status = JobPostingStatus.APPLICATIONS_OPEN;
      }
      lockedJob.applicationCount += 1;
      await jobRepo.save(lockedJob);

      return { savedApp, job: lockedJob };
    });

    await this.notifyCustomer(
      job.customerId,
      'New job application',
      `A welper applied to your job "${job.title}".`,
      job.id,
    );

    return this.toApplicationResponse(savedApp);
  }

  async withdrawApplication(
    welperId: string,
    jobId: string,
    applicationId: string,
  ): Promise<JobApplicationResponseDto> {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId, jobPostingId: jobId, welperId },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    if (application.status !== JobApplicationStatus.PENDING) {
      throw new BadRequestException('Only pending applications can be withdrawn');
    }

    application.status = JobApplicationStatus.WITHDRAWN;
    const saved = await this.applicationRepo.save(application);

    const job = await this.getJobOrThrow(jobId);
    if (job.applicationCount > 0) {
      job.applicationCount -= 1;
      await this.jobRepo.save(job);
    }

    return this.toApplicationResponse(saved);
  }

  async listMyApplications(
    welperId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedJobApplicationsDto> {
    const [rows, total] = await this.applicationRepo.findAndCount({
      where: { welperId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const data = await Promise.all(rows.map((app) => this.toApplicationResponse(app)));
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  // ─── Booking linkage (called from BookingService transaction) ───────────

  async linkBookingFromMarketplace(
    manager: EntityManager,
    params: {
      customerId: string;
      jobPostingId: string;
      jobApplicationId: string;
      bookingId: string;
      welperId: string;
      offeringId: string;
    },
  ): Promise<void> {
    const jobRepo = manager.getRepository(JobPosting);
    const appRepo = manager.getRepository(JobApplication);

    const job = await jobRepo
      .createQueryBuilder('job')
      .setLock('pessimistic_write')
      .where('job.id = :jobId', { jobId: params.jobPostingId })
      .getOne();
    if (!job) {
      throw new NotFoundException('Job posting not found');
    }
    if (job.customerId !== params.customerId) {
      throw new ForbiddenException('You do not own this job posting');
    }
    if (job.bookingId) {
      throw new BadRequestException('This job already has a linked booking');
    }
    if (!isJobOpenForApplications(job.status)) {
      throw new BadRequestException('Job is not open for booking conversion');
    }

    const application = await appRepo.findOne({
      where: { id: params.jobApplicationId, jobPostingId: params.jobPostingId },
    });
    if (!application) {
      throw new NotFoundException('Job application not found');
    }
    if (application.status !== JobApplicationStatus.PENDING) {
      throw new BadRequestException('Application is not pending');
    }
    if (application.welperId !== params.welperId) {
      throw new BadRequestException('Selected application does not belong to this welper');
    }
    if (application.offeringId !== params.offeringId) {
      throw new BadRequestException('Selected application does not match this offering');
    }

    const offering = await this.serviceOfferingService.findById(application.offeringId);
    if (!offeringMatchesSubcategory(offering, job.subcategoryId)) {
      throw new BadRequestException('Application offering no longer matches job subcategory');
    }

    application.status = JobApplicationStatus.ACCEPTED;
    await appRepo.save(application);

    await appRepo
      .createQueryBuilder()
      .update(JobApplication)
      .set({ status: JobApplicationStatus.REJECTED })
      .where('job_posting_id = :jobId', { jobId: params.jobPostingId })
      .andWhere('id != :appId', { appId: params.jobApplicationId })
      .andWhere('status = :pending', { pending: JobApplicationStatus.PENDING })
      .execute();

    validateJobPostingTransition(job.status, JobPostingStatus.CONVERTED_TO_BOOKING);
    job.status = JobPostingStatus.CONVERTED_TO_BOOKING;
    job.bookingId = params.bookingId;
    await jobRepo.save(job);
  }

  async notifyAfterBookingLinked(params: {
    jobPostingId: string;
    jobApplicationId: string;
    bookingId: string;
    customerId: string;
    welperId: string;
  }): Promise<void> {
    const job = await this.getJobOrThrow(params.jobPostingId);
    const rejectedApps = await this.applicationRepo.find({
      where: {
        jobPostingId: params.jobPostingId,
        status: JobApplicationStatus.REJECTED,
      },
    });

    await this.notifyCustomer(
      params.customerId,
      'Booking request sent',
      `Your booking request for "${job.title}" was sent to the welper.`,
      params.bookingId,
      '/dashboard/bookings',
    );
    await this.notifyWelper(
      params.welperId,
      'New booking request',
      `You received a booking request from a job you applied to: "${job.title}".`,
      params.bookingId,
      '/dashboard/bookings',
    );

    for (const app of rejectedApps) {
      if (app.id === params.jobApplicationId) continue;
      await this.notifyWelper(
        app.welperId,
        'Application not selected',
        `Another welper was selected for "${job.title}".`,
        params.jobPostingId,
      );
    }
  }

  // ─── Admin ────────────────────────────────────────────────────────────

  async adminList(query: AdminJobPostingListQueryDto): Promise<PaginatedJobPostingsDto> {
    const page = Number.isFinite(query.page) && (query.page ?? 0) > 0 ? query.page! : 1;
    const limit =
      Number.isFinite(query.limit) && (query.limit ?? 0) > 0
        ? Math.min(query.limit!, 100)
        : 20;

    const qb = this.jobRepo.createQueryBuilder('job');

    if (query.customerId) {
      qb.andWhere('job.customer_id = :customerId', { customerId: query.customerId });
    }
    if (query.categoryId) {
      qb.andWhere('job.category_id = :categoryId', { categoryId: query.categoryId });
    }
    if (query.subcategoryId) {
      qb.andWhere('job.subcategory_id = :subcategoryId', { subcategoryId: query.subcategoryId });
    }
    if (query.status) {
      qb.andWhere('job.status = :status', { status: query.status });
    }
    if (query.dateFrom) {
      qb.andWhere('job.created_at >= :dateFrom', { dateFrom: query.dateFrom });
    }
    if (query.dateTo) {
      qb.andWhere('job.created_at <= :dateTo', { dateTo: `${query.dateTo}T23:59:59.999Z` });
    }

    qb.orderBy('job.created_at', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [rows, total] = await qb.getManyAndCount();
    const refreshed = await Promise.all(
      rows.map((job) => maybeRefreshJobStatus(job, this.jobRepo, this.bookingRepo)),
    );
    const data = await Promise.all(
      refreshed.map(async (job) => {
        const item = await this.toListItem(job, job.customerId, 'customer');
        return { ...item, customerId: job.customerId, bookingId: job.bookingId };
      }),
    );

    return {
      data: data as JobPostingListItemDto[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async adminFindById(jobId: string): Promise<JobPostingResponseDto & { applications: JobApplicationResponseDto[] }> {
    const job = await this.getJobOrThrow(jobId);
    const refreshed = await maybeRefreshJobStatus(job, this.jobRepo, this.bookingRepo);
    const owner = await this.toOwnerResponse(refreshed);
    const applications = await this.applicationRepo.find({
      where: { jobPostingId: jobId },
      order: { createdAt: 'DESC' },
    });
    const applicationDtos = await Promise.all(
      applications.map(async (app) => {
        const dto = await this.toApplicationResponse(app);
        return { ...dto, welperDisplayName: dto.welperDisplayName ?? app.welperId };
      }),
    );
    return { ...owner, applications: applicationDtos };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  private async assertCustomerCanPost(customerId: string): Promise<void> {
    const user = await this.usersService.findById(customerId);
    if (!user.emailVerified) {
      throw new ForbiddenException('Verify your email before posting a job');
    }
    const profile = await this.customerProfileService.findByCustomerId(customerId);
    if (profile.profileCompletionStatus !== ProfileCompletionStatus.COMPLETE) {
      throw new ForbiddenException('Complete your profile before posting a job');
    }
  }

  private async getJobOrThrow(jobId: string): Promise<JobPosting> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job posting not found');
    }
    return job;
  }

  private normalizeTime(t: string | null | undefined): string {
    if (!t) return '';
    const s = String(t);
    return s.length >= 5 ? s.slice(0, 5) : s;
  }

  private async getCategoryLabels(
    categoryId: string,
    subcategoryId: string,
  ): Promise<{ categoryLabel: string | null; subcategoryLabel: string | null }> {
    try {
      const [category, subcategory] = await Promise.all([
        this.categoriesService.findOne(categoryId),
        this.categoriesService.findOne(subcategoryId),
      ]);
      return { categoryLabel: category.name, subcategoryLabel: subcategory.name };
    } catch {
      return { categoryLabel: null, subcategoryLabel: null };
    }
  }

  private async toListItem(
    job: JobPosting,
    viewerId: string,
    role: 'customer' | 'welper',
    welperOfferings?: Awaited<ReturnType<ServiceOfferingService['findByWelperId']>>['data'],
    customerDisplay?: CustomerDisplayInfo,
  ): Promise<JobPostingListItemDto> {
    const labels = await this.getCategoryLabels(job.categoryId, job.subcategoryId);
    const item: JobPostingListItemDto = {
      id: job.id,
      title: job.title,
      categoryId: job.categoryId,
      subcategoryId: job.subcategoryId,
      categoryLabel: labels.categoryLabel,
      subcategoryLabel: labels.subcategoryLabel,
      scheduledDate: job.scheduledDate,
      scheduledStartTime: this.normalizeTime(job.scheduledStartTime),
      scheduledEndTime: this.normalizeTime(job.scheduledEndTime),
      durationMinutes: job.durationMinutes,
      locationCity: job.locationCity,
      locationRegion: job.locationRegion,
      status: job.status,
      applicationCount: job.applicationCount,
      publishedAt: job.publishedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
    };

    if (role === 'welper') {
      const offerings =
        welperOfferings ??
        (await this.serviceOfferingService.findByWelperId(viewerId, 1, 100, true)).data;
      const matching = resolveMatchingOfferings(offerings, job.subcategoryId);
      const discoverable = await this.backgroundCheckService.assertVisibleInSearch(viewerId);
      const existing = await this.applicationRepo.findOne({
        where: { jobPostingId: job.id, welperId: viewerId },
      });
      const blockReason = resolveApplyBlockReason({
        job,
        discoverable,
        matchingOfferings: matching,
        existingApplication: !!existing,
      });
      item.canApply = blockReason === null;
      item.applyBlockReason = blockReason;
      item.myApplicationId = existing?.id ?? null;
      if (customerDisplay) {
        item.customerDisplayName = customerDisplay.displayName;
        item.customerPhotoUrl = customerDisplay.photoUrl;
      }
    }

    return item;
  }

  private async toOwnerResponse(job: JobPosting): Promise<JobPostingResponseDto> {
    const labels = await this.getCategoryLabels(job.categoryId, job.subcategoryId);
    return {
      id: job.id,
      customerId: job.customerId,
      title: job.title,
      description: job.description,
      categoryId: job.categoryId,
      subcategoryId: job.subcategoryId,
      categoryLabel: labels.categoryLabel,
      subcategoryLabel: labels.subcategoryLabel,
      serviceQuestionCategoryId: job.serviceQuestionCategoryId,
      answers: job.answers,
      scheduledDate: job.scheduledDate,
      scheduledStartTime: this.normalizeTime(job.scheduledStartTime),
      scheduledEndTime: this.normalizeTime(job.scheduledEndTime),
      durationMinutes: job.durationMinutes,
      locationAddress: job.locationAddress,
      locationCity: job.locationCity,
      locationRegion: job.locationRegion,
      status: job.status,
      applicationCount: job.applicationCount,
      publishedAt: job.publishedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      bookingId: job.bookingId,
      expiresAt: job.expiresAt.toISOString(),
    };
  }

  private async toWelperDetailResponse(
    job: JobPosting,
    welperId: string,
    offerings: Awaited<ReturnType<ServiceOfferingService['findByWelperId']>>['data'],
  ): Promise<JobPostingResponseDto> {
    const listItem = await this.toListItem(job, welperId, 'welper', offerings);
    const matching = resolveMatchingOfferings(offerings, job.subcategoryId);
    const myApplication = listItem.myApplicationId
      ? await this.applicationRepo.findOne({
          where: { id: listItem.myApplicationId, jobPostingId: job.id, welperId },
        })
      : null;
    return {
      ...listItem,
      customerId: job.customerId,
      description: job.description,
      serviceQuestionCategoryId: job.serviceQuestionCategoryId,
      answers: job.answers,
      bookingId: job.bookingId,
      expiresAt: job.expiresAt.toISOString(),
      matchingOfferings: matching.map((o) => ({
        id: o.id,
        hourlyRate: Number(o.hourlyRate),
        serviceDescription: o.serviceDescription,
      })),
      myApplication: myApplication ? await this.toApplicationResponse(myApplication) : null,
    };
  }

  private assertJobScheduleIsValid(
    scheduledDate: string,
    scheduledStartTime: string,
    scheduledEndTime: string,
    durationMinutes: number,
  ): void {
    const startMinutes = this.timeToMinutes(scheduledStartTime);
    const endMinutes = this.timeToMinutes(scheduledEndTime);
    if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) {
      throw new BadRequestException('scheduledEndTime must be after scheduledStartTime');
    }
    if (endMinutes - startMinutes !== durationMinutes) {
      throw new BadRequestException('durationMinutes must match the scheduled time window');
    }
    const today = new Date().toISOString().slice(0, 10);
    if (scheduledDate < today) {
      throw new BadRequestException('Scheduled date cannot be in the past');
    }
    if (scheduledDate === today) {
      const now = new Date();
      const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
      if (startMinutes <= nowMinutes) {
        throw new BadRequestException('Scheduled start time must be in the future');
      }
    }
  }

  private timeToMinutes(value: string): number | null {
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  private async toApplicationResponse(app: JobApplication): Promise<JobApplicationResponseDto> {
    let welperDisplayName: string | null = null;
    let welperRating: number | null = null;
    let welperVerified = false;

    try {
      const profile = await this.welperProfileService.findByWelperId(app.welperId);
      welperDisplayName = formatWelperDisplayNameForCustomer(profile.firstName, profile.lastName);
      welperRating = profile.rating != null ? Number(profile.rating) : null;
      welperVerified = profile.verified === true;
    } catch {
      welperDisplayName = 'Welper';
    }

    return {
      id: app.id,
      jobPostingId: app.jobPostingId,
      welperId: app.welperId,
      offeringId: app.offeringId,
      proposalMessage: app.proposalMessage,
      status: app.status,
      hourlyRateSnapshot: app.hourlyRateSnapshot ? Number(app.hourlyRateSnapshot) : null,
      createdAt: app.createdAt.toISOString(),
      welperDisplayName,
      welperRating,
      welperVerified,
    };
  }

  private async notifyCustomer(
    customerId: string,
    title: string,
    body: string,
    entityId: string,
    path = '/dashboard/marketplace',
  ): Promise<void> {
    const baseUrl = getFrontendBaseUrl();
    await this.notificationService.emitForUser(customerId, {
      category: NotificationCategory.JOB,
      title,
      body,
      link: `${baseUrl}${path}/${entityId}`,
      metadata: { jobPostingId: entityId },
    });
  }

  private async notifyWelper(
    welperId: string,
    title: string,
    body: string,
    entityId: string,
    path = '/dashboard/marketplace',
  ): Promise<void> {
    const baseUrl = getFrontendBaseUrl();
    await this.notificationService.emitForUser(welperId, {
      category: NotificationCategory.JOB,
      title,
      body,
      link: `${baseUrl}${path}/${entityId}`,
      metadata: { jobPostingId: entityId },
    });
  }
}
