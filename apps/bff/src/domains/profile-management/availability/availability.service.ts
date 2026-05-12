import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvailabilityCalendar } from '../entities/availability-calendar.entity';
import { AvailabilityException } from '../entities/availability-exception.entity';
import { WelperProfile } from '../entities/welper-profile.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { CreateAvailabilityExceptionDto } from './dto/create-availability-exception.dto';
import { EventPublisherService } from '../events/event-publisher.service';
import { DayOfWeek } from '../entities/day-of-week.enum';

const DAY_NAMES: DayOfWeek[] = [
  'Sunday' as DayOfWeek,
  'Monday' as DayOfWeek,
  'Tuesday' as DayOfWeek,
  'Wednesday' as DayOfWeek,
  'Thursday' as DayOfWeek,
  'Friday' as DayOfWeek,
  'Saturday' as DayOfWeek,
];

/** Normalize time string to HH:mm for comparison */
function toHHmm(t: string): string {
  return typeof t === 'string' && t.length >= 5 ? t.slice(0, 5) : t;
}

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(AvailabilityCalendar)
    private availabilityRepository: Repository<AvailabilityCalendar>,
    @InjectRepository(AvailabilityException)
    private exceptionRepository: Repository<AvailabilityException>,
    @InjectRepository(WelperProfile)
    private welperProfileRepository: Repository<WelperProfile>,
    private eventPublisher: EventPublisherService,
  ) {}

  async findByWelperId(
    welperId: string,
    page: number = 1,
    limit: number = 20,
    dayOfWeek?: string,
    available?: boolean,
  ): Promise<{ data: AvailabilityCalendar[]; total: number; page: number; limit: number; totalPages: number }> {
    const where: any = { welperId };
    if (dayOfWeek) {
      where.dayOfWeek = dayOfWeek;
    }
    if (available !== undefined) {
      where.available = available;
    }

    const [data, total] = await this.availabilityRepository.findAndCount({
      where,
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Build a comparable logical key for a calendar or DTO so we can match "same slot"
   * without relying on database id. Preserving matching calendars keeps their exceptions.
   */
  private slotKey(
    source:
      | AvailabilityCalendar
      | (UpdateAvailabilityDto & { effectiveDateStart?: string | null; effectiveDateEnd?: string | null }),
  ): string {
    const dayOfWeek = source.dayOfWeek;
    const startTime =
      typeof source.startTime === 'string' && source.startTime.length > 5
        ? source.startTime.slice(0, 5)
        : source.startTime;
    const endTime =
      typeof source.endTime === 'string' && source.endTime.length > 5
        ? source.endTime.slice(0, 5)
        : source.endTime;
    const recurringPattern = source.recurringPattern;
    const effectiveDateStart =
      source.effectiveDateStart != null
        ? (typeof source.effectiveDateStart === 'string'
            ? source.effectiveDateStart.slice(0, 10)
            : new Date(source.effectiveDateStart).toISOString().slice(0, 10))
        : '';
    const effectiveDateEnd =
      source.effectiveDateEnd != null
        ? (typeof source.effectiveDateEnd === 'string'
            ? source.effectiveDateEnd.slice(0, 10)
            : new Date(source.effectiveDateEnd).toISOString().slice(0, 10))
        : '';
    const available = source.available !== undefined ? source.available : true;
    return `${dayOfWeek}|${startTime}|${endTime}|${recurringPattern}|${effectiveDateStart}|${effectiveDateEnd}|${available}`;
  }

  async update(
    welperId: string,
    updateDto: UpdateAvailabilityDto[],
    userId: string,
  ): Promise<AvailabilityCalendar[]> {
    // Verify ownership
    if (welperId !== userId) {
      throw new ForbiddenException('You can only update your own availability');
    }

    // Verify welper profile exists
    const profile = await this.welperProfileRepository.findOne({
      where: { welperId },
    });

    if (!profile) {
      throw new NotFoundException('Welper profile not found');
    }

    const existingCalendars = await this.availabilityRepository.find({
      where: { welperId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });

    const usedExistingIds = new Set<string>();
    const matchedIncomingKeys = new Set<string>();

    // Match each incoming slot to an existing calendar by key (1:1); mark existing as "kept"
    for (const dto of updateDto) {
      const key = this.slotKey(dto as any);
      const existing = existingCalendars.find(
        (c) => !usedExistingIds.has(c.id) && this.slotKey(c) === key,
      );
      if (existing) {
        usedExistingIds.add(existing.id);
        matchedIncomingKeys.add(key);
      }
    }

    const toDelete = existingCalendars.filter((c) => !usedExistingIds.has(c.id));
    const toDeleteIds = toDelete.map((c) => c.id);

    // Delete exceptions only for calendars we are removing (so FK is satisfied)
    if (toDeleteIds.length > 0) {
      await this.exceptionRepository
        .createQueryBuilder()
        .delete()
        .where('calendarId IN (:...toDeleteIds)', { toDeleteIds })
        .execute();
    }

    // Delete only the calendars that are no longer in the schedule
    if (toDelete.length > 0) {
      await this.availabilityRepository.remove(toDelete);
    }

    const toInsert = updateDto.filter((dto) => !matchedIncomingKeys.has(this.slotKey(dto as any)));
    const kept = existingCalendars.filter((c) => usedExistingIds.has(c.id));

    const newCalendars = toInsert.map((dto) =>
      this.availabilityRepository.create({
        ...dto,
        welperId,
        available: dto.available !== undefined ? dto.available : true,
        effectiveDateStart: dto.effectiveDateStart
          ? new Date(dto.effectiveDateStart)
          : null,
        effectiveDateEnd: dto.effectiveDateEnd
          ? new Date(dto.effectiveDateEnd)
          : null,
      }),
    );

    const inserted =
      newCalendars.length > 0 ? await this.availabilityRepository.save(newCalendars) : [];

    const saved = [...kept, ...inserted].sort(
      (a, b) =>
        (a.dayOfWeek as string).localeCompare(b.dayOfWeek as string) ||
        (a.startTime as string).localeCompare(b.startTime as string),
    );

    // Publish event
    await this.eventPublisher.publishAvailabilityUpdated({
      welperId,
      timestamp: new Date().toISOString(),
    });

    return saved;
  }

  /**
   * Check if the welper is available for the given date and time window.
   * Returns true if at least one availability slot covers [startTime, endTime] on that date
   * and no exception blocks it.
   */
  async isSlotAvailable(
    welperId: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    const dateObj = new Date(date + 'T12:00:00Z');
    const dayIndex = dateObj.getUTCDay();
    const dayOfWeek = DAY_NAMES[dayIndex];
    const reqStart = toHHmm(startTime);
    const reqEnd = toHHmm(endTime);

    const calendars = await this.availabilityRepository.find({
      where: { welperId, dayOfWeek, available: true },
    });

    const dateOnly = date.slice(0, 10);
    let slotMatches = false;
    for (const cal of calendars) {
      const calStart = toHHmm(cal.startTime as string);
      const calEnd = toHHmm(cal.endTime as string);
      if (cal.effectiveDateStart != null) {
        const startStr =
          cal.effectiveDateStart instanceof Date
            ? cal.effectiveDateStart.toISOString().slice(0, 10)
            : String(cal.effectiveDateStart).slice(0, 10);
        if (dateOnly < startStr) continue;
      }
      if (cal.effectiveDateEnd != null) {
        const endStr =
          cal.effectiveDateEnd instanceof Date
            ? cal.effectiveDateEnd.toISOString().slice(0, 10)
            : String(cal.effectiveDateEnd).slice(0, 10);
        if (dateOnly > endStr) continue;
      }
      if (calStart <= reqStart && calEnd >= reqEnd) {
        slotMatches = true;
        break;
      }
    }
    if (!slotMatches) return false;

    const exceptions = await this.findExceptionsByWelperId(welperId);
    const dateObjOnly = new Date(dateOnly + 'T00:00:00Z');
    for (const ex of exceptions) {
      const exStart = new Date(ex.date);
      exStart.setUTCHours(0, 0, 0, 0);
      const exEnd = ex.endDate
        ? new Date(ex.endDate)
        : new Date(ex.date);
      exEnd.setUTCHours(23, 59, 59, 999);
      if (dateObjOnly >= exStart && dateObjOnly <= exEnd && !ex.available) {
        return false;
      }
    }
    return true;
  }

  /** Get all exceptions for a welper, optionally filtered by calendarId */
  async findExceptionsByWelperId(
    welperId: string,
    calendarId?: string,
  ): Promise<AvailabilityException[]> {
    if (calendarId) {
      const calendar = await this.availabilityRepository.findOne({
        where: { id: calendarId, welperId },
      });
      if (!calendar) return [];
      return this.exceptionRepository.find({
        where: { calendarId },
        order: { date: 'DESC' },
      });
    }
    const calendars = await this.availabilityRepository.find({
      where: { welperId },
      select: ['id'],
    });
    const calendarIds = calendars.map((c) => c.id);
    if (calendarIds.length === 0) return [];
    return this.exceptionRepository
      .createQueryBuilder('e')
      .where('e.calendarId IN (:...calendarIds)', { calendarIds })
      .orderBy('e.date', 'DESC')
      .getMany();
  }

  /** Create an exception; calendar must belong to welper */
  async createException(
    welperId: string,
    dto: CreateAvailabilityExceptionDto,
  ): Promise<AvailabilityException> {
    const calendar = await this.availabilityRepository.findOne({
      where: { id: dto.calendarId, welperId },
    });
    if (!calendar) {
      throw new NotFoundException('Availability calendar not found or access denied');
    }
    const exception = this.exceptionRepository.create({
      calendarId: dto.calendarId,
      date: new Date(dto.date),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      available: dto.available,
      reason: dto.reason ?? null,
    });
    return this.exceptionRepository.save(exception);
  }

  /** Delete an exception; its calendar must belong to welper */
  async deleteException(welperId: string, exceptionId: string): Promise<void> {
    const exception = await this.exceptionRepository.findOne({ where: { id: exceptionId } });
    if (!exception) {
      throw new NotFoundException('Availability exception not found');
    }
    const calendar = await this.availabilityRepository.findOne({
      where: { id: exception.calendarId, welperId },
    });
    if (!calendar) {
      throw new ForbiddenException('You can only delete your own availability exceptions');
    }
    await this.exceptionRepository.remove(exception);
  }
}

