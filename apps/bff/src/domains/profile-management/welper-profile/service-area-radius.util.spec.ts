import type { WelperProfile } from '../entities/welper-profile.entity';
import {
  isWelperServiceAreaStepComplete,
  normalizeCountryCode,
  resolveWelperServiceAreaFields,
  syncWelperServiceAreaColumnsFromJson,
} from './service-area-radius.util';

function welper(partial: Partial<WelperProfile>): WelperProfile {
  return partial as WelperProfile;
}

describe('service-area-radius.util', () => {
  it('defaults empty country to CA', () => {
    expect(normalizeCountryCode(undefined)).toBe('CA');
    expect(normalizeCountryCode('')).toBe('CA');
  });

  it('marks complete when radius JSON has city/province but columns were never synced', () => {
    const profile = welper({
      serviceArea: {
        type: 'radius',
        centerAddress: {
          city: 'Toronto',
          stateProvince: 'ON',
          zipPostalCode: 'M5V 2T6',
        },
        radiusKm: 25,
      },
      serviceAreaCity: null,
      provinceCode: null,
      countryCode: null,
    });
    expect(isWelperServiceAreaStepComplete(profile)).toBe(true);
  });

  it('marks complete when country column is empty but JSON is valid', () => {
    const profile = welper({
      serviceAreaCity: 'Montreal',
      provinceCode: 'QC',
      countryCode: '',
      serviceArea: {
        type: 'radius',
        centerAddress: {
          city: 'Montreal',
          stateProvince: 'QC',
          zipPostalCode: 'H2X 1Y4',
        },
        radiusKm: 10,
      },
    });
    expect(resolveWelperServiceAreaFields(profile)?.country).toBe('CA');
    expect(isWelperServiceAreaStepComplete(profile)).toBe(true);
  });

  it('syncWelperServiceAreaColumnsFromJson backfills columns', () => {
    const profile = welper({
      serviceArea: {
        type: 'radius',
        centerAddress: {
          city: 'Ottawa',
          stateProvince: 'ON',
          zipPostalCode: 'K1A 0B1',
        },
        radiusKm: 30,
      },
      serviceAreaCity: null,
      provinceCode: null,
      countryCode: null,
      serviceAreaPostalCodes: null,
    });
    expect(syncWelperServiceAreaColumnsFromJson(profile)).toBe(true);
    expect(profile.serviceAreaCity).toBe('Ottawa');
    expect(profile.provinceCode).toBe('ON');
    expect(profile.countryCode).toBe('CA');
    expect(profile.serviceAreaPostalCodes).toEqual(['K1A 0B1']);
  });
});
