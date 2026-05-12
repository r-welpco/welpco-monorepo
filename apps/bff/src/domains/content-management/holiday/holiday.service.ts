import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Holiday } from '../entities/holiday.entity';

export interface HolidayQuery {
  countryCode: string;
  provinceCode?: string | null;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

@Injectable()
export class HolidayService {
  constructor(
    @InjectRepository(Holiday)
    private holidayRepository: Repository<Holiday>,
  ) {}

  /**
   * Find holidays by country and optional province, optionally filtered by date range.
   * Returns holidays that overlap [from, to] or all if from/to not provided.
   * For a given region we return: country-wide holidays (provinceCode null) plus
   * province-specific holidays when provinceCode is provided.
   */
  async findByCountryAndProvince(query: HolidayQuery): Promise<Holiday[]> {
    const qb = this.holidayRepository
      .createQueryBuilder('h')
      .where('h.country_code = :countryCode', { countryCode: query.countryCode });

    if (query.provinceCode != null && query.provinceCode !== '') {
      qb.andWhere(
        new Brackets((b) =>
          b
            .where('h.province_code IS NULL')
            .orWhere('h.province_code = :provinceCode', { provinceCode: query.provinceCode }),
        ),
      );
    } else {
      qb.andWhere('h.province_code IS NULL');
    }

    if (query.from) {
      qb.andWhere(
        new Brackets((b) => {
          b.where(
            'COALESCE(h.end_date, h.date) >= :from',
            { from: query.from },
          );
          if (query.to) {
            b.andWhere('h.date <= :to', { to: query.to });
          }
        }),
      );
    }
    if (query.to && !query.from) {
      qb.andWhere('h.date <= :to', { to: query.to });
    }

    qb.orderBy('h.date', 'ASC');
    return qb.getMany();
  }
}
