import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WelperProfile } from '../entities/welper-profile.entity';
import { ProfileCompletionStatus } from '../entities/profile-completion-status.enum';
import { ProfileVisibility } from '../entities/profile-visibility.enum';
import { CreateWelperProfileDto } from './dto/create-welper-profile.dto';
import { UpdateWelperProfileDto } from './dto/update-welper-profile.dto';
import { EventPublisherService } from '../events/event-publisher.service';
import { ServiceOffering } from '../entities/service-offering.entity';
import type { ServiceArea, ServiceAreaInfo } from '../../../common/types';
import { GEOCODE_SERVICE } from '../../geocode/geocode.interface';
import type { IGeocodeService } from '../../geocode/geocode.interface';
import {
  WelperProfileAggregatesService,
  WelperTrustAggregates,
} from './welper-profile-aggregates.service';

function latLngFromServiceArea(serviceArea: ServiceArea | null | undefined): { latitude: number; longitude: number } | null {
  if (!serviceArea || serviceArea.type !== 'Point' || !Array.isArray(serviceArea.coordinates) || serviceArea.coordinates.length < 2) {
    return null;
  }
  const [longitude, latitude] = serviceArea.coordinates;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

/** Extract postal code and country from centerAddress (dashboard service area format) for geocoding. */
function postalAndCountryFromCenterAddress(centerAddress: Record<string, unknown> | null | undefined): { postalCode: string; countryCode?: string } | null {
  if (!centerAddress || typeof centerAddress !== 'object') return null;
  const zip = (centerAddress.zipCode ?? centerAddress.zipPostalCode ?? '') as string;
  const trimmed = zip?.toString().trim();
  if (!trimmed) return null;
  const country = (centerAddress.country ?? '') as string;
  return { postalCode: trimmed, countryCode: country?.toString().trim() || undefined };
}

/**
 * Wave 1: shape the structured ServiceAreaInfo (city/province/country/postalCodes)
 * the public hero needs. Returns null when we don't have enough data — callers
 * are expected to render a graceful zero-state in that case.
 */
export function buildServiceAreaInfo(profile: {
  serviceAreaCity: string | null;
  serviceAreaPostalCodes: string[] | null;
  countryCode: string | null;
  provinceCode: string | null;
}): ServiceAreaInfo | null {
  const city = (profile.serviceAreaCity ?? '').trim();
  const province = (profile.provinceCode ?? '').trim();
  const country = (profile.countryCode ?? '').trim();
  // Bible §22.6: don't fabricate location strings. Require at minimum a country
  // code so the hero never claims "—, —" or similar nonsense.
  if (!country) return null;
  const postalCodes = Array.isArray(profile.serviceAreaPostalCodes)
    ? profile.serviceAreaPostalCodes.filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    : [];
  return {
    city,
    province,
    country,
    postalCodes,
  };
}

@Injectable()
export class WelperProfileService {
  private readonly logger = new Logger(WelperProfileService.name);

  constructor(
    @InjectRepository(WelperProfile)
    private welperProfileRepository: Repository<WelperProfile>,
    @InjectRepository(ServiceOffering)
    private serviceOfferingRepository: Repository<ServiceOffering>,
    private eventPublisher: EventPublisherService,
    @Inject(GEOCODE_SERVICE) private readonly geocodeService: IGeocodeService,
    private readonly aggregatesService: WelperProfileAggregatesService,
  ) {}

  async findByWelperId(welperId: string): Promise<WelperProfile> {
    const profile = await this.welperProfileRepository.findOne({
      where: { welperId },
    });

    if (!profile) {
      throw new NotFoundException('Welper profile not found');
    }

    return profile;
  }

  /**
   * Returns the welper profile entity merged with the Wave 1 trust signals
   * (verified, averageRating, reviewCount, responseTimeMinutes, serviceAreaInfo).
   *
   * Both the internal `GET /api/profiles/me` and the public `GET /api/search/welpers/:id`
   * endpoints use this so the two responses stay aligned. Per Wave 1 we compute
   * aggregates on demand — read perf is acceptable today; if hot, denormalize later.
   */
  async findHydratedByWelperId(
    welperId: string,
  ): Promise<WelperProfile & { serviceAreaInfo: ServiceAreaInfo | null } & WelperTrustAggregates> {
    const profile = await this.findByWelperId(welperId);
    return this.hydrate(profile);
  }

  async hydrate(
    profile: WelperProfile,
  ): Promise<WelperProfile & { serviceAreaInfo: ServiceAreaInfo | null } & WelperTrustAggregates> {
    const aggregates = await this.aggregatesService.getAggregates(profile.welperId);
    const serviceAreaInfo = buildServiceAreaInfo(profile);
    return Object.assign(profile, { ...aggregates, serviceAreaInfo });
  }

  async create(createDto: CreateWelperProfileDto): Promise<WelperProfile> {
    // Check if profile already exists
    const existing = await this.welperProfileRepository.findOne({
      where: { welperId: createDto.welperId },
    });

    if (existing) {
      throw new ForbiddenException('Welper profile already exists');
    }

    const profile = this.welperProfileRepository.create({
      ...createDto,
      profileVisibility: createDto.profileVisibility || ProfileVisibility.PUBLIC,
    });
    profile.profileCompletionStatus = ProfileCompletionStatus.INCOMPLETE; // Will be recalculated
    const point = latLngFromServiceArea(createDto.serviceArea ?? null);
    if (point) {
      profile.latitude = point.latitude;
      profile.longitude = point.longitude;
    }
    if (createDto.countryCode !== undefined) profile.countryCode = createDto.countryCode ?? null;
    if (createDto.provinceCode !== undefined) profile.provinceCode = createDto.provinceCode ?? null;
    if (createDto.serviceAreaCity !== undefined) profile.serviceAreaCity = createDto.serviceAreaCity ?? null;
    if (createDto.serviceAreaPostalCodes !== undefined) {
      profile.serviceAreaPostalCodes = createDto.serviceAreaPostalCodes ?? null;
    }

    const saved = await this.welperProfileRepository.save(profile);

    // Publish event
    await this.eventPublisher.publishProfileCreated({
      profileId: saved.id,
      welperId: saved.welperId,
      profileType: 'welper',
      timestamp: new Date().toISOString(),
    });

    return saved;
  }

  async update(
    welperId: string,
    updateDto: UpdateWelperProfileDto,
    userId: string, // Authenticated user ID
  ): Promise<WelperProfile> {
    // Verify ownership
    if (welperId !== userId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const profile = await this.findByWelperId(welperId);

    // Update fields
    if (updateDto.firstName !== undefined) {
      profile.firstName = updateDto.firstName;
    }
    if (updateDto.lastName !== undefined) {
      profile.lastName = updateDto.lastName;
    }
    if (updateDto.phoneNumber !== undefined) {
      profile.phoneNumber = updateDto.phoneNumber;
    }
    if (updateDto.bio !== undefined) {
      profile.bio = updateDto.bio;
    }
    if (updateDto.profilePhotoUrl !== undefined) {
      profile.profilePhotoUrl = updateDto.profilePhotoUrl;
    }
    if (updateDto.serviceArea !== undefined) {
      profile.serviceArea = updateDto.serviceArea;
      let point = latLngFromServiceArea(updateDto.serviceArea as ServiceArea);
      // Dashboard sends { type, centerAddress, radiusKm } without coordinates; geocode from address so search has lat/lng
      if (!point && updateDto.serviceArea && typeof updateDto.serviceArea === 'object') {
        const sa = updateDto.serviceArea as unknown as Record<string, unknown>;
        const addr = postalAndCountryFromCenterAddress(sa.centerAddress as Record<string, unknown>);
        if (addr) {
          try {
            const geocode = await this.geocodeService.forward(addr.postalCode, addr.countryCode);
            if (geocode.latitude != null && geocode.longitude != null) {
              point = { latitude: geocode.latitude, longitude: geocode.longitude };
            }
          } catch (err) {
            this.logger.warn(
              `Could not geocode service area for welper ${welperId}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }
      }
      if (point) {
        profile.latitude = point.latitude;
        profile.longitude = point.longitude;
      } else {
        profile.latitude = null;
        profile.longitude = null;
      }
    }
    if (updateDto.countryCode !== undefined) profile.countryCode = updateDto.countryCode ?? null;
    if (updateDto.provinceCode !== undefined) profile.provinceCode = updateDto.provinceCode ?? null;

    // Wave 1 structured service-area shape — accepted in addition to the legacy
    // GeoJSON `serviceArea` so we can retire the legacy shape gradually.
    if (updateDto.serviceAreaCity !== undefined) {
      profile.serviceAreaCity = updateDto.serviceAreaCity ?? null;
    }
    if (updateDto.serviceAreaPostalCodes !== undefined) {
      profile.serviceAreaPostalCodes = updateDto.serviceAreaPostalCodes ?? null;
    }

    if (updateDto.profileVisibility !== undefined) {
      profile.profileVisibility = updateDto.profileVisibility;
    }

    // Recalculate completion status
    profile.profileCompletionStatus = await this.calculateCompletionStatus(
      profile,
    );

    const updated = await this.welperProfileRepository.save(profile);

    // Publish event
    await this.eventPublisher.publishProfileUpdated({
      profileId: updated.id,
      welperId: updated.welperId,
      profileType: 'welper',
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  private async calculateCompletionStatus(
    profile: WelperProfile,
  ): Promise<ProfileCompletionStatus> {
    // Welper profile is complete if: firstName, lastName, phoneNumber, bio, profilePhotoUrl, serviceArea, and at least one active service offering
    const hasRequiredFields =
      profile.firstName &&
      profile.lastName &&
      profile.phoneNumber &&
      profile.bio &&
      profile.profilePhotoUrl &&
      profile.serviceArea;

    // Query service offerings separately since we removed the relation
    const serviceOfferings = await this.serviceOfferingRepository.find({
      where: { welperId: profile.welperId },
    });

    const hasServiceOfferings =
      serviceOfferings &&
      serviceOfferings.length > 0 &&
      serviceOfferings.some((so) => so.active);

    if (hasRequiredFields && hasServiceOfferings) {
      return ProfileCompletionStatus.COMPLETE;
    }

    return ProfileCompletionStatus.INCOMPLETE;
  }

  async markOnboardingComplete(
    welperId: string,
    userId: string,
  ): Promise<WelperProfile> {
    // Verify ownership
    if (welperId !== userId) {
      throw new ForbiddenException(
        'You can only mark your own onboarding as complete',
      );
    }

    const profile = await this.findByWelperId(welperId);
    profile.onboardingCompleted = true;
    // Recalculate completion status so search and visibility reflect current profile state
    profile.profileCompletionStatus = await this.calculateCompletionStatus(
      profile,
    );
    return this.welperProfileRepository.save(profile);
  }
}
