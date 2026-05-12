import type { GeocodeResultDto } from './dto/geocode-result.dto';

export const GEOCODE_SERVICE = Symbol('GEOCODE_SERVICE');

export interface IGeocodeService {
  reverse(latitude: number, longitude: number): Promise<GeocodeResultDto>;
  forward(postalCode: string, countryCode?: string): Promise<GeocodeResultDto>;
}
