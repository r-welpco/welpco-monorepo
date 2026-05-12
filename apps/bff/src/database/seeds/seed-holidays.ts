import { DataSource } from 'typeorm';
import { Holiday } from '../../domains/content-management/entities/holiday.entity';

/** Sample holidays for CA (country-wide + ON) and US for 2025–2026. Province null = country-wide. */
const HOLIDAYS: Array<{
  countryCode: string;
  provinceCode: string | null;
  name: string;
  date: string; // YYYY-MM-DD
  endDate?: string | null;
}> = [
  // Canada (country-wide)
  { countryCode: 'CA', provinceCode: null, name: "New Year's Day", date: '2025-01-01' },
  { countryCode: 'CA', provinceCode: null, name: 'Canada Day', date: '2025-07-01' },
  { countryCode: 'CA', provinceCode: null, name: 'Labour Day', date: '2025-09-01' },
  { countryCode: 'CA', provinceCode: null, name: 'Christmas Day', date: '2025-12-25' },
  { countryCode: 'CA', provinceCode: null, name: "New Year's Day", date: '2026-01-01' },
  { countryCode: 'CA', provinceCode: null, name: 'Canada Day', date: '2026-07-01' },
  { countryCode: 'CA', provinceCode: null, name: 'Labour Day', date: '2026-09-07' },
  { countryCode: 'CA', provinceCode: null, name: 'Christmas Day', date: '2026-12-25' },
  // Canada – Ontario
  { countryCode: 'CA', provinceCode: 'ON', name: 'Family Day', date: '2025-02-17' },
  { countryCode: 'CA', provinceCode: 'ON', name: 'Victoria Day', date: '2025-05-19' },
  { countryCode: 'CA', provinceCode: 'ON', name: 'Thanksgiving', date: '2025-10-13' },
  { countryCode: 'CA', provinceCode: 'ON', name: 'Family Day', date: '2026-02-16' },
  { countryCode: 'CA', provinceCode: 'ON', name: 'Victoria Day', date: '2026-05-18' },
  { countryCode: 'CA', provinceCode: 'ON', name: 'Thanksgiving', date: '2026-10-12' },
  // Canada – Quebec
  { countryCode: 'CA', provinceCode: 'QC', name: 'Fête nationale du Québec', date: '2025-06-24' },
  { countryCode: 'CA', provinceCode: 'QC', name: 'Fête nationale du Québec', date: '2026-06-24' },
  // US (country-wide)
  { countryCode: 'US', provinceCode: null, name: "New Year's Day", date: '2025-01-01' },
  { countryCode: 'US', provinceCode: null, name: 'Independence Day', date: '2025-07-04' },
  { countryCode: 'US', provinceCode: null, name: 'Labor Day', date: '2025-09-01' },
  { countryCode: 'US', provinceCode: null, name: 'Thanksgiving', date: '2025-11-27' },
  { countryCode: 'US', provinceCode: null, name: 'Christmas Day', date: '2025-12-25' },
  { countryCode: 'US', provinceCode: null, name: "New Year's Day", date: '2026-01-01' },
  { countryCode: 'US', provinceCode: null, name: 'Independence Day', date: '2026-07-04' },
  { countryCode: 'US', provinceCode: null, name: 'Labor Day', date: '2026-09-07' },
  { countryCode: 'US', provinceCode: null, name: 'Thanksgiving', date: '2026-11-26' },
  { countryCode: 'US', provinceCode: null, name: 'Christmas Day', date: '2026-12-25' },
];

export async function seedHolidays(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Holiday);
  const existing = await repo.count();
  if (existing > 0) {
    console.log('   Holidays already seeded, skipping');
    return;
  }
  for (const h of HOLIDAYS) {
    await repo.save(
      repo.create({
        countryCode: h.countryCode,
        provinceCode: h.provinceCode,
        name: h.name,
        date: new Date(h.date),
        endDate: h.endDate ? new Date(h.endDate) : null,
      }),
    );
  }
  console.log(`   ✅ Seeded ${HOLIDAYS.length} holidays (CA, US 2025–2026)`);
}
