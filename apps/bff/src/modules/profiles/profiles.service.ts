import { ForbiddenException, Injectable } from '@nestjs/common';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { CreateServiceOfferingDto } from '../../domains/profile-management/service-offering/dto/create-service-offering.dto';
import { UpdateServiceOfferingDto } from '../../domains/profile-management/service-offering/dto/update-service-offering.dto';
import { CustomerProfileService } from '../../domains/profile-management/customer-profile/customer-profile.service';
import { WelperProfileService } from '../../domains/profile-management/welper-profile/welper-profile.service';
import { ServiceOfferingService } from '../../domains/profile-management/service-offering/service-offering.service';
import { FavoriteService } from '../../domains/profile-management/favorite/favorite.service';
import { AvailabilityService } from '../../domains/profile-management/availability/availability.service';
import { UsersService } from '../../domains/user-management/users/users.service';
import { SignupOrchestratorService } from '../../domains/user-management/auth/signup-orchestrator.service';
import {
  customerWelperRoleForAuthUser,
  roleFromAccountType,
} from '../../common/auth/effective-role.util';
import { DayOfWeek } from '../../domains/profile-management/entities/day-of-week.enum';
import { RecurringPattern } from '../../domains/profile-management/entities/recurring-pattern.enum';
import { ProfileVisibility } from '../../domains/profile-management/entities/profile-visibility.enum';
import {
  BACKEND_TO_DAY_NUM,
  DAY_NUM_TO_BACKEND,
  RECURRING_BACK_TO_FRONT,
  RECURRING_FRONT_TO_BACK,
} from './profiles-availability.mapper';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly customerProfileService: CustomerProfileService,
    private readonly welperProfileService: WelperProfileService,
    private readonly serviceOfferingService: ServiceOfferingService,
    private readonly favoriteService: FavoriteService,
    private readonly availabilityService: AvailabilityService,
    private readonly usersService: UsersService,
    private readonly signupOrchestrator: SignupOrchestratorService,
  ) {}

  async getSetupChecklist(userId: string, accountType: string) {
    const role = await this.resolveUserRole(userId, accountType);
    if (role === 'welper') {
      return this.signupOrchestrator.getWelperSetupChecklist(userId);
    }
    return this.signupOrchestrator.getCustomerSetupChecklist(userId);
  }

  async getWelperSetupChecklist(userId: string) {
    return this.signupOrchestrator.getWelperSetupChecklist(userId);
  }

  private async resolveUserRole(
    userId: string,
    accountTypeFallback: string,
  ): Promise<'customer' | 'welper'> {
    const user = await this.usersService.findById(userId);
    return customerWelperRoleForAuthUser({
      effectiveRole: roleFromAccountType(user.accountType),
      accountType: accountTypeFallback,
    });
  }

  async getMyProfile(userId: string, accountType: string) {
    const role = await this.resolveUserRole(userId, accountType);
    if (role === 'customer') {
      const profile = await this.customerProfileService.findByCustomerId(userId);
      const user = await this.usersService.findById(userId);
      return Object.assign(profile, {
        hasDefaultPaymentMethod: !!user.stripeDefaultPaymentMethodId,
      });
    }
    // Hydrated includes Wave 1 trust signals: verified, averageRating,
    // reviewCount, responseTimeMinutes, serviceAreaInfo. Surfacing them on
    // /me lets the welper dashboard mirror what customers see on the public profile.
    return this.welperProfileService.findHydratedByWelperId(userId);
  }

  async updateMyProfile(userId: string, accountType: string, data: UpdateMyProfileDto) {
    const role = await this.resolveUserRole(userId, accountType);
    const filteredData = this.filterProfileUpdateData(data, role);
    if (role === 'customer') {
      const updated = await this.customerProfileService.update(userId, filteredData, userId);
      await this.signupOrchestrator.getCustomerSetupChecklist(userId);
      return updated;
    }
    const updated = await this.welperProfileService.update(userId, filteredData, userId);
    await this.signupOrchestrator.getWelperSetupChecklist(userId);
    // Return the same hydrated shape /me returns so the welper dashboard's
    // optimistic post-save state stays consistent with subsequent reads.
    return this.welperProfileService.hydrate(updated);
  }

  /**
   * Filter profile update data to only include fields valid for the given role.
   * Uses an allowlist pattern -- only copies known fields.
   */
  private filterProfileUpdateData(
    data: UpdateMyProfileDto,
    role: 'customer' | 'welper',
  ): Record<string, unknown> {
    const filtered: Record<string, unknown> = {};

    if (role === 'welper') {
      // Wave 1: serviceAreaCity + serviceAreaPostalCodes joined the allowlist
      // so the welper-edit form can save the structured location shape the
      // public hero now consumes. `verified` deliberately stays out — it's
      // an ops-controlled trust signal, not a self-edit field.
      const allowedFields = [
        'firstName',
        'lastName',
        'phoneNumber',
        'bio',
        'profilePhotoUrl',
        'serviceArea',
        'profileVisibility',
        'countryCode',
        'provinceCode',
        'serviceAreaCity',
        'serviceAreaPostalCodes',
      ];
      for (const field of allowedFields) {
        if (data[field] !== undefined) filtered[field] = data[field];
      }
      // profileVisibility is passed through as-is (must be Public or Private to match DB enum, validated by DTO)
      if (filtered.profileVisibility !== undefined) {
        filtered.profileVisibility = filtered.profileVisibility as ProfileVisibility;
      }
    } else {
      const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'address', 'profilePhotoUrl'];
      for (const field of allowedFields) {
        if (data[field] !== undefined) filtered[field] = data[field];
      }
    }

    return filtered;
  }

  async completeOnboarding(userId: string, accountType: string) {
    const role = await this.resolveUserRole(userId, accountType);
    if (role === 'customer') {
      return this.customerProfileService.markOnboardingComplete(userId, userId);
    }
    return this.welperProfileService.markOnboardingComplete(userId, userId);
  }

  async getMyServicePreferences(userId: string, accountType: string) {
    if ((await this.resolveUserRole(userId, accountType)) !== 'customer') {
      throw new ForbiddenException('Service preferences are only available for customers');
    }
    return this.customerProfileService.getServicePreferencesForCustomer(userId);
  }

  async updateMyServicePreferences(
    userId: string,
    accountType: string,
    data: {
      preferredCategories?: string[];
      minPrice?: number;
      maxPrice?: number;
      preferredServiceArea?: Record<string, unknown>;
      notifyNewWelpers?: boolean;
      notifyPriceChanges?: boolean;
      notifyAvailability?: boolean;
    },
  ) {
    if ((await this.resolveUserRole(userId, accountType)) !== 'customer') {
      throw new ForbiddenException('Service preferences are only available for customers');
    }
    return this.customerProfileService.updateServicePreferences(userId, userId, data);
  }

  async getServiceOfferings(welperId: string) {
    return this.serviceOfferingService.findByWelperId(welperId);
  }

  async createServiceOffering(welperId: string, data: CreateServiceOfferingDto) {
    return this.serviceOfferingService.create(welperId, data, welperId);
  }

  async updateServiceOffering(welperId: string, serviceId: string, data: UpdateServiceOfferingDto) {
    return this.serviceOfferingService.update(welperId, serviceId, data, welperId);
  }

  async deleteServiceOffering(welperId: string, serviceId: string) {
    return this.serviceOfferingService.delete(welperId, serviceId, welperId);
  }

  async getFavoriteWelpers(userId: string, page = 1, limit = 50) {
    return this.favoriteService.findByCustomerId(userId, userId, page, limit);
  }

  async addFavoriteWelper(userId: string, welperId: string) {
    return this.favoriteService.create(userId, { welperId }, userId);
  }

  async removeFavoriteByIdOrWelperId(userId: string, id: string): Promise<void> {
    await this.favoriteService.removeByIdOrWelperId(userId, id, userId);
  }

  async getAvailability(
    userId: string,
    options?: { page?: number; limit?: number; dayOfWeek?: string; available?: boolean },
  ) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 100;
    const result = await this.availabilityService.findByWelperId(
      userId, page, limit, options?.dayOfWeek, options?.available,
    );
    return this.mapAvailabilityToFrontend(userId, result.data);
  }

  async updateAvailability(userId: string, body: any) {
    const dtos = this.mapFrontendScheduleToUpdateDtos(body);
    const saved = await this.availabilityService.update(userId, dtos, userId);
    return this.mapAvailabilityToFrontend(userId, saved);
  }

  async getAvailabilityExceptions(userId: string, calendarId?: string) {
    const exceptions = await this.availabilityService.findExceptionsByWelperId(userId, calendarId);
    return exceptions.map((e) => this.mapExceptionToFrontend(e));
  }

  async addAvailabilityException(userId: string, body: { calendarId: string; date: string; available: boolean; reason?: string }) {
    const created = await this.availabilityService.createException(userId, body);
    return this.mapExceptionToFrontend(created);
  }

  async removeAvailabilityException(userId: string, exceptionId: string): Promise<void> {
    await this.availabilityService.deleteException(userId, exceptionId);
  }

  private mapExceptionToFrontend(e: any): any {
    return {
      id: e.id,
      calendarId: e.calendarId,
      date: e.date ? new Date(e.date) : new Date(),
      endDate: e.endDate ? new Date(e.endDate) : undefined,
      available: e.available,
      reason: e.reason ?? undefined,
      createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
    };
  }

  private mapAvailabilityToFrontend(welperId: string, calendars: any[]): any {
    if (!calendars.length) {
      return {
        id: welperId,
        welperId,
        timeSlots: [],
        recurringPattern: 'weekly',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    const first = calendars[0];
    const recurringPattern =
      RECURRING_BACK_TO_FRONT[first.recurringPattern as RecurringPattern] ?? 'weekly';
    const timeSlots = calendars.map((c) => ({
      dayOfWeek: BACKEND_TO_DAY_NUM[c.dayOfWeek] ?? 1,
      startTime: typeof c.startTime === 'string' && c.startTime.length > 5 ? c.startTime.slice(0, 5) : c.startTime,
      endTime: typeof c.endTime === 'string' && c.endTime.length > 5 ? c.endTime.slice(0, 5) : c.endTime,
    }));
    const latest = calendars[calendars.length - 1];
    return {
      id: first.id ?? welperId,
      welperId,
      timeSlots,
      recurringPattern,
      effectiveStartDate: first.effectiveDateStart ? new Date(first.effectiveDateStart) : undefined,
      effectiveEndDate: first.effectiveDateEnd ? new Date(first.effectiveDateEnd) : undefined,
      createdAt: first.createdAt ? new Date(first.createdAt) : new Date(),
      updatedAt: latest.updatedAt ? new Date(latest.updatedAt) : new Date(),
    };
  }

  private mapFrontendScheduleToUpdateDtos(body: any): any[] {
    const timeSlots = body?.timeSlots ?? [];
    const recurringPattern =
      RECURRING_FRONT_TO_BACK[body?.recurringPattern?.toLowerCase?.()] ?? RecurringPattern.WEEKLY;
    const effectiveDateStart = body?.effectiveStartDate
      ? new Date(body.effectiveStartDate).toISOString().slice(0, 10)
      : undefined;
    const effectiveDateEnd = body?.effectiveEndDate
      ? new Date(body.effectiveEndDate).toISOString().slice(0, 10)
      : undefined;
    return timeSlots.map((slot: any) => ({
      dayOfWeek: DAY_NUM_TO_BACKEND[slot.dayOfWeek] ?? DayOfWeek.MONDAY,
      startTime: slot.startTime ?? '09:00',
      endTime: slot.endTime ?? '17:00',
      recurringPattern,
      available: true,
      effectiveDateStart,
      effectiveDateEnd,
    }));
  }
}
