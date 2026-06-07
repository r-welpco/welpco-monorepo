import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { ServiceOffering } from '../profile-management/entities/service-offering.entity';
import { ServiceCategory } from '../content-management/entities/service-category.entity';
import { ProfileCompletionStatus } from '../profile-management/entities/profile-completion-status.enum';
import { ProfileVisibility } from '../profile-management/entities/profile-visibility.enum';
import { WelperProfileService, buildServiceAreaInfo } from '../profile-management/welper-profile/welper-profile.service';
import { WelperProfileAggregatesService } from '../profile-management/welper-profile/welper-profile-aggregates.service';
import { ServiceOfferingService } from '../profile-management/service-offering/service-offering.service';
import { CategoriesService } from '../content-management/categories/categories.service';
import { GEOCODE_SERVICE } from '../geocode/geocode.interface';
import type { IGeocodeService } from '../geocode/geocode.interface';
import type { SearchServicesQueryDto } from './dto/search-services-query.dto';
import type { SearchResultItemDto, SearchServicesResponseDto } from './dto/search-result-item.dto';
import type { PublicWelperProfileDto, PublicServiceOfferingDto } from './dto/public-welper-profile.dto';
import { DiscoveryCategoriesCacheService } from '../../common/discovery-categories-cache/discovery-categories-cache.service';
import { BackgroundCheckService } from '../safety-verification/background-check.service';
import { AvailabilityService } from '../profile-management/availability/availability.service';
import { emptyWeeklyAvailabilitySummary } from '../profile-management/availability/dto/weekly-availability-summary.dto';
import type { WeeklyAvailabilitySummaryDto } from '../profile-management/availability/dto/weekly-availability-summary.dto';
import { formatWelperDisplayNameForCustomer } from '../../common/display-name.util';
import { customerHourlyChargeFromWelperRate } from '../booking/booking-pricing';

const BIO_SNIPPET_LENGTH = 120;

/** Build a short location string; prefers profile countryCode/provinceCode, fallback to service_area JSON. */
function locationSummary(profile: {
  countryCode?: string | null;
  provinceCode?: string | null;
  serviceArea?: unknown;
 }): string {
  if (profile.countryCode) {
    const prov = profile.provinceCode ? `, ${profile.provinceCode}` : '';
    return `${profile.countryCode}${prov}`;
  }
  if (profile.serviceArea && typeof profile.serviceArea === 'object') {
    const o = profile.serviceArea as Record<string, unknown>;
    if (typeof o.country === 'string' && o.country) {
      const prov = typeof o.province === 'string' && o.province ? `, ${o.province}` : '';
      return `${o.country}${prov}`;
    }
  }
  return '—';
}

@Injectable()
export class ServiceDiscoveryService {
  constructor(
    @InjectRepository(WelperProfile)
    private readonly welperProfileRepo: Repository<WelperProfile>,
    @InjectRepository(ServiceOffering)
    private readonly serviceOfferingRepo: Repository<ServiceOffering>,
    private readonly welperProfileService: WelperProfileService,
    private readonly aggregatesService: WelperProfileAggregatesService,
    private readonly serviceOfferingService: ServiceOfferingService,
    private readonly categoriesService: CategoriesService,
    private readonly discoveryCategoriesCache: DiscoveryCategoriesCacheService,
    @Inject(GEOCODE_SERVICE) private readonly geocodeService: IGeocodeService,
    private readonly backgroundCheckService: BackgroundCheckService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  private async getCachedCategories(): Promise<ServiceCategory[]> {
    const hit = this.discoveryCategoriesCache.get();
    if (hit) {
      return hit;
    }
    const categories = await this.categoriesService.findAll(false);
    this.discoveryCategoriesCache.set(categories);
    return categories;
  }

  private buildSearchResultItems(
    pageIds: string[],
    profileByWelperId: Map<string, Pick<WelperProfile, 'firstName' | 'lastName' | 'bio' | 'profilePhotoUrl' | 'serviceArea' | 'countryCode' | 'provinceCode' | 'rating' | 'reviewCount'>>,
    offeringsByWelperId: Map<string, Array<Pick<ServiceOffering, 'welperId' | 'hourlyRate' | 'serviceCategoryId'>>>,
    categoryMap: Map<string, string>,
    backgroundCheckPassedByWelperId: Map<string, boolean>,
    weeklyAvailabilityByWelperId: Map<string, WeeklyAvailabilitySummaryDto>,
  ): SearchResultItemDto[] {
    return pageIds.map((welperId) => {
      const profile = profileByWelperId.get(welperId);
      const offerings = offeringsByWelperId.get(welperId) ?? [];
      const name = profile
        ? formatWelperDisplayNameForCustomer(profile.firstName, profile.lastName)
        : 'Welper';
      const categoryNames = [...new Set(offerings.map((o) => categoryMap.get(o.serviceCategoryId) ?? '').filter(Boolean))].sort();
      const title = categoryNames[0] ?? 'Welper';
      const rates = offerings.map((o) =>
        customerHourlyChargeFromWelperRate(Number(o.hourlyRate)),
      );
      const hourlyRate = rates.length ? Math.min(...rates) : 0;
      const location = profile ? locationSummary(profile) : '—';
      let bioSnippet: string | null = null;
      if (profile?.bio) {
        bioSnippet = profile.bio.length > BIO_SNIPPET_LENGTH
          ? profile.bio.slice(0, BIO_SNIPPET_LENGTH) + '…'
          : profile.bio;
      }
      const rating = profile?.rating != null ? Number(profile.rating) : 0;
      const reviewCount = profile?.reviewCount != null ? Number(profile.reviewCount) : 0;
      return {
        welperId,
        name,
        title,
        location,
        hourlyRate,
        categories: categoryNames,
        profilePhotoUrl: profile?.profilePhotoUrl ?? null,
        bioSnippet,
        rating,
        reviewCount,
        verified: backgroundCheckPassedByWelperId.get(welperId) === true,
        weeklyAvailability:
          weeklyAvailabilityByWelperId.get(welperId) ??
          emptyWeeklyAvailabilitySummary(),
      };
    });
  }

  /**
   * Resolve categoryId to a list of category IDs for filtering offerings.
   * - Include the requested category so offerings linked to it match.
   * - If the category is a parent (has children), include all child IDs so offerings under any subcategory match.
   * - If the category is a subcategory (has a parent), include the parent ID so offerings linked to the parent
   *   (e.g. legacy or "Care" instead of "Babysitter") still match when the user selects the subcategory.
   */
  private async resolveCategoryIds(categoryId: string): Promise<string[]> {
    try {
      const category = await this.categoriesService.findOne(categoryId);
      const ids: string[] = [category.id];
      if (category.parentId) {
        ids.push(category.parentId);
      }
      const children = await this.categoriesService.findByParentId(categoryId);
      for (const c of children) {
        ids.push(c.id);
      }
      return [...new Set(ids)];
    } catch {
      return [categoryId];
    }
  }

  async searchServices(dto: SearchServicesQueryDto): Promise<SearchServicesResponseDto> {
    let latitude = dto.latitude;
    let longitude = dto.longitude;

    // Resolve postalCode to lat/lng when no coordinates provided (customer only needs to enter postal code)
    const postalCode = dto.postalCode?.trim();
    if (postalCode && (latitude == null || longitude == null)) {
      try {
        const forward = await this.geocodeService.forward(postalCode, dto.countryCode?.trim());
        if (forward.latitude != null && forward.longitude != null) {
          latitude = forward.latitude;
          longitude = forward.longitude;
        } else {
          throw new BadRequestException('Could not find postal code');
        }
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException('Could not find postal code');
      }
    }

    const page = dto.page ?? 1;
    const limit = Math.min(100, Math.max(1, dto.limit ?? 20));
    const categoryId = dto.categoryId?.trim();
    const q = dto.q?.trim();
    const sort = dto.sort ?? 'relevance';
    // Location filter: we have a search point (from postal code or lat/lng). Match = welpers whose service area contains this point (welper center + welper radius).
    const hasSearchPoint =
      typeof latitude === 'number' &&
      typeof longitude === 'number';
    const minPrice = dto.minPrice;
    const maxPrice = dto.maxPrice;
    const minRating = dto.minRating;

    const categoryIds = categoryId ? await this.resolveCategoryIds(categoryId) : [];
    if (categoryId && categoryIds.length === 0) {
      return { items: [], total: 0, page, limit };
    }

    const qPattern = q ? `%${q}%` : null;
    const minRateSubquery =
      categoryIds.length > 0
        ? '(SELECT so.welper_id, MIN(so.hourly_rate) as min_rate FROM service_offerings so WHERE so.active = true AND so.service_category_id IN (:...categoryIds) GROUP BY so.welper_id)'
        : '(SELECT so.welper_id, MIN(so.hourly_rate) as min_rate FROM service_offerings so WHERE so.active = true GROUP BY so.welper_id)';

    const qb = this.welperProfileRepo
      .createQueryBuilder('p')
      .leftJoin(
        minRateSubquery,
        'min_so',
        'min_so.welper_id = p.welper_id',
      )
      .where('p.profile_completion_status = :status', { status: ProfileCompletionStatus.COMPLETE })
      .andWhere('p.profile_visibility = :visibility', { visibility: ProfileVisibility.PUBLIC })
      .andWhere(
        `EXISTS (
          SELECT 1 FROM service_offerings so_active
          WHERE so_active.welper_id = p.welper_id
          AND so_active.active = true
        )`,
      );

    if (categoryIds.length > 0) {
      qb.andWhere(
        'p.welper_id IN (SELECT so2.welper_id FROM service_offerings so2 WHERE so2.service_category_id IN (:...categoryIds) AND so2.active = true)',
        { categoryIds },
      );
    }

    // TODO: Create GIN indexes for text search (add to migrations):
    // CREATE INDEX idx_welper_profiles_name_trgm ON welper_profiles USING gin (first_name gin_trgm_ops, last_name gin_trgm_ops);
    // CREATE INDEX idx_welper_profiles_bio_trgm ON welper_profiles USING gin (bio gin_trgm_ops);
    // CREATE INDEX idx_service_offerings_desc_trgm ON service_offerings USING gin (service_description gin_trgm_ops);
    // pg_trgm GIN indexes support ILIKE queries, so once created the queries below will use index scans.
    if (qPattern) {
      qb.andWhere(
        '(p.first_name ILIKE :qPattern OR p.last_name ILIKE :qPattern OR p.bio ILIKE :qPattern OR EXISTS (SELECT 1 FROM service_offerings so3 WHERE so3.welper_id = p.welper_id AND so3.active = true AND so3.service_description ILIKE :qPattern))',
        { qPattern },
      );
    }

    // Match welpers whose service area contains the search point (welper center + welper radius from service_area).
    // Requires non-null latitude/longitude on the profile (synced from service area / geocode).
    // Client query param radiusKm (DTO) is ignored; matching uses each welper's own radius (default 25 km).
    if (hasSearchPoint) {
      qb.andWhere(
        `p.latitude IS NOT NULL AND p.longitude IS NOT NULL AND earth_distance(ll_to_earth(p.latitude::float8, p.longitude::float8), ll_to_earth(:searchLat::float8, :searchLng::float8)) <= (
          CASE
            WHEN (p.service_area->>'radiusKm') ~ '^[0-9]+\.?[0-9]*$' AND (p.service_area->>'radiusKm')::float > 0
              THEN (p.service_area->>'radiusKm')::float * 1000
            WHEN (p.service_area->>'radiusMiles') ~ '^[0-9]+\.?[0-9]*$' AND (p.service_area->>'radiusMiles')::float > 0
              THEN (p.service_area->>'radiusMiles')::float * 1.60934 * 1000
            ELSE 25000
          END
        )`,
        { searchLat: latitude!, searchLng: longitude! },
      );
    }

    if (minRating != null && typeof minRating === 'number') {
      qb.andWhere('(p.rating IS NOT NULL AND p.rating >= :minRating)', { minRating });
    }

    if (minPrice != null && typeof minPrice === 'number') {
      qb.andWhere('(min_so.min_rate IS NOT NULL AND min_so.min_rate >= :minPrice)', { minPrice });
    }
    if (maxPrice != null && typeof maxPrice === 'number') {
      qb.andWhere('(min_so.min_rate IS NOT NULL AND min_so.min_rate <= :maxPrice)', { maxPrice });
    }

    // Order
    if (sort === 'price') {
      qb.orderBy('min_so.min_rate', 'ASC', 'NULLS LAST');
    } else if (sort === 'distance' && hasSearchPoint && typeof latitude === 'number' && typeof longitude === 'number') {
      qb.orderBy(
        'earth_distance(ll_to_earth(p.latitude::float8, p.longitude::float8), ll_to_earth(:orderLat::float8, :orderLng::float8))',
        'ASC',
        'NULLS LAST',
      );
      qb.setParameter('orderLat', latitude);
      qb.setParameter('orderLng', longitude);
    } else {
      qb.orderBy('p.created_at', 'DESC');
    }

    const total = await qb.getCount();

    qb
      .select('p.welper_id', 'welper_id')
      .skip((page - 1) * limit)
      .take(limit);

    const rows = await qb.getRawMany<{ welper_id: string }>();
    const pageIds = rows.map((r) => r.welper_id);

    if (pageIds.length === 0) {
      return { items: [], total, page, limit };
    }

    const allCategories = await this.getCachedCategories();
    const categoryMap = new Map(allCategories.map((c) => [c.id, c.name]));

    const [profilesPage, offeringsPage] = await Promise.all([
      this.welperProfileRepo.find({
        where: { welperId: In(pageIds) },
        select: ['welperId', 'firstName', 'lastName', 'bio', 'profilePhotoUrl', 'serviceArea', 'countryCode', 'provinceCode', 'rating', 'reviewCount'],
      }),
      this.serviceOfferingRepo.find({
        where: { welperId: In(pageIds), active: true },
        select: ['welperId', 'hourlyRate', 'serviceCategoryId'],
      }),
    ]);

    const profileByWelperId = new Map(profilesPage.map((p) => [p.welperId, p]));
    const offeringsByWelperId = new Map<string, typeof offeringsPage>();
    for (const o of offeringsPage) {
      const list = offeringsByWelperId.get(o.welperId) ?? [];
      list.push(o);
      offeringsByWelperId.set(o.welperId, list);
    }

    const backgroundCheckPassedByWelperId =
      await this.backgroundCheckService.getBackgroundCheckPassedByUserIds(pageIds);

    const weeklyAvailabilityByWelperId =
      await this.availabilityService.getWeeklySummariesForWelpers(pageIds);

    const items = this.buildSearchResultItems(
      pageIds,
      profileByWelperId,
      offeringsByWelperId,
      categoryMap,
      backgroundCheckPassedByWelperId,
      weeklyAvailabilityByWelperId,
    );
    return { items, total, page, limit };
  }

  /**
   * Wave 2 (BFF): the canonical category catalog used by the marketing site
   * to deep-link into search via `?categoryId=…`. Public (no JWT guard).
   *
   * Response shape: ordered by `displayOrder` ASC then `name` ASC. Each item
   * carries `id`, `name`, `description`, `parentId`, `displayOrder`. The legacy
   * call sites that ignore `displayOrder` keep working — it's an additive field.
   */
  async getCategories(
    includeCounts = false,
  ): Promise<
    Array<{
      id: string;
      name: string;
      description: string | null;
      parentId: string | null;
      displayOrder: number;
      servicesCount?: number;
    }>
  > {
    const categories = await this.getCachedCategories(); // only active categories; includeCounts reserved for Phase 2
    return categories
      .slice()
      .sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
        return a.name.localeCompare(b.name);
      })
      .map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        parentId: c.parentId,
        displayOrder: c.displayOrder,
        // TODO: servicesCount will be added in Phase 2 when count queries are implemented
      }));
  }

  async getPublicWelperProfile(welperId: string): Promise<PublicWelperProfileDto> {
    const [profile, { data: offerings }] = await Promise.all([
      this.welperProfileService.findByWelperId(welperId),
      this.serviceOfferingService.findByWelperId(welperId, 1, 100, true),
    ]);

    if (profile.profileVisibility !== ProfileVisibility.PUBLIC || profile.profileCompletionStatus !== ProfileCompletionStatus.COMPLETE) {
      throw new NotFoundException('Welper profile not found');
    }

    const allCategories = await this.getCachedCategories();
    const categoryById = new Map(allCategories.map((c) => [c.id, c]));

    const serviceOfferings: PublicServiceOfferingDto[] = offerings.map((o) => {
      const category = categoryById.get(o.serviceCategoryId);
      const subcategories = (Array.isArray(o.subcategoryIds) ? o.subcategoryIds : [])
        .map((id) => {
          const subcategory = categoryById.get(id);
          return subcategory ? { id: subcategory.id, name: subcategory.name } : null;
        })
        .filter((subcategory): subcategory is { id: string; name: string } => subcategory !== null);
      return {
        id: o.id,
        serviceCategoryId: o.serviceCategoryId,
        subcategoryIds: subcategories.map((subcategory) => subcategory.id),
        subcategories,
        categoryName: category?.name ?? '',
        ...(category?.parent?.name && { parentCategoryName: category.parent.name }),
        serviceDescription: o.serviceDescription,
        hourlyRate: customerHourlyChargeFromWelperRate(Number(o.hourlyRate)),
        experienceYears: o.experienceYears,
      };
    });

    // Wave 1 trust signals: computed on demand (no denormalized cache yet —
    // see follow-up in AUDIT-LOG.md if read perf becomes a concern).
    const aggregates = await this.aggregatesService.getAggregates(welperId);
    const serviceAreaInfo = buildServiceAreaInfo(profile);
    const verified = await this.backgroundCheckService.hasPassedBackgroundCheck(welperId);
    const weeklyAvailabilityMap =
      await this.availabilityService.getWeeklySummariesForWelpers([welperId]);
    const weeklyAvailability =
      weeklyAvailabilityMap.get(welperId) ?? emptyWeeklyAvailabilitySummary();

    return {
      id: profile.id,
      welperId: profile.welperId,
      displayName: formatWelperDisplayNameForCustomer(profile.firstName, profile.lastName),
      firstName: profile.firstName,
      lastName: null,
      bio: profile.bio,
      profilePhotoUrl: profile.profilePhotoUrl,
      serviceArea: profile.serviceArea,
      serviceAreaInfo,
      verified,
      averageRating: aggregates.averageRating,
      reviewCount: aggregates.reviewCount,
      responseTimeMinutes: aggregates.responseTimeMinutes,
      serviceOfferings,
      weeklyAvailability,
    };
  }
}
