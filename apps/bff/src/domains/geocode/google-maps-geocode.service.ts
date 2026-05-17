/**
 * Google Maps Geocoding Service
 *
 * Implements IGeocodeService using the Google Maps Geocoding API.
 * This can be swapped with Mapbox (or another provider) in the future
 * by creating a new class that implements IGeocodeService and updating
 * the module provider binding.
 */
import {
  HttpException,
  HttpStatus,
  Injectable,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fetchJson } from '../../common/http/fetch-json';
import type { GeocodeResultDto } from './dto/geocode-result.dto';
import { IGeocodeService } from './geocode.interface';
import { RateLimiterService } from './rate-limiter.service';

const GOOGLE_GEOCODE_URL =
  'https://maps.googleapis.com/maps/api/geocode/json';

const REVERSE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FORWARD_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_SIZE = 1000;

// ---------------------------------------------------------------------------
// LRU Cache – simple Map-based implementation.
// Map iteration order is insertion order, so the oldest entry is first.
// On every get-hit we delete + re-insert to move the entry to the end.
// When the cache exceeds MAX_CACHE_SIZE we evict the oldest (first) entry.
// ---------------------------------------------------------------------------

interface CacheEntry {
  result: GeocodeResultDto;
  expiresAt: number;
}

class LruCache {
  private readonly store = new Map<string, CacheEntry>();

  constructor(private readonly maxSize: number) {}

  get(key: string): CacheEntry | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    // Move to end (most-recently used)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry;
  }

  set(key: string, entry: CacheEntry): void {
    // If key already exists, delete first so re-insert moves it to the end
    if (this.store.has(key)) {
      this.store.delete(key);
    }

    this.store.set(key, entry);

    // Evict oldest entries if over capacity
    while (this.store.size > this.maxSize) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) {
        this.store.delete(oldest);
      }
    }
  }

  get size(): number {
    return this.store.size;
  }
}

// ---------------------------------------------------------------------------
// Google Maps address_component types
// ---------------------------------------------------------------------------

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GoogleGeocodeResult {
  address_components?: AddressComponent[];
  geometry?: {
    location?: { lat: number; lng: number };
  };
}

interface GoogleGeocodeResponse {
  status: string;
  results?: GoogleGeocodeResult[];
  error_message?: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class GoogleMapsGeocodeService
  implements IGeocodeService, OnModuleInit
{
  private readonly logger = new Logger(GoogleMapsGeocodeService.name);
  private readonly reverseCache = new LruCache(MAX_CACHE_SIZE);
  private readonly forwardCache = new LruCache(MAX_CACHE_SIZE);
  private readonly apiKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly rateLimiter: RateLimiterService,
  ) {
    this.apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY', '');
  }

  onModuleInit(): void {
    if (!this.apiKey) {
      throw new Error(
        'GOOGLE_MAPS_API_KEY is not configured. ' +
          'Set the environment variable before starting the application.',
      );
    }
    this.logger.log('Google Maps Geocoding service initialised');
  }

  // -------------------------------------------------------------------------
  // Reverse geocode
  // -------------------------------------------------------------------------

  async reverse(
    latitude: number,
    longitude: number,
  ): Promise<GeocodeResultDto> {
    const key = this.cacheKeyReverse(latitude, longitude);
    const cached = this.reverseCache.get(key);
    if (cached) {
      this.logger.debug(`Reverse geocode cache HIT for ${key}`);
      return { ...cached.result, latitude, longitude };
    }

    this.logger.log(
      `Reverse geocode cache MISS for lat=${latitude}, lng=${longitude}`,
    );

    await this.rateLimiter.waitForSlot();
    try {
      const url = new URL(GOOGLE_GEOCODE_URL);
      url.searchParams.set('latlng', `${latitude},${longitude}`);
      url.searchParams.set('key', this.apiKey);

      const res = await fetchJson(url.toString(), {
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        this.logger.error(
          `Google Maps reverse geocode HTTP ${res.status} for lat=${latitude}, lng=${longitude}`,
        );
        throw new BadRequestException('Reverse geocoding failed');
      }

      const body = (await res.json()) as GoogleGeocodeResponse;

      if (body.status === 'REQUEST_DENIED') {
        this.logger.warn(
          `Google Maps reverse geocode REQUEST_DENIED for lat=${latitude}, lng=${longitude}: ${body.error_message ?? 'Geocoding API not enabled'}`,
        );
        throw new HttpException(
          {
            message:
              'Geocoding service is not configured. Enable the Geocoding API in Google Cloud Console.',
            code: 'GEOCODING_API_DISABLED',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (body.status !== 'OK' || !body.results?.length) {
        this.logger.warn(
          `Google Maps reverse geocode returned status=${body.status} for lat=${latitude}, lng=${longitude}` +
            (body.error_message ? `: ${body.error_message}` : ''),
        );
        throw new BadRequestException('Reverse geocoding failed');
      }

      const result = this.extractResult(body.results[0], latitude, longitude);

      this.reverseCache.set(key, {
        result,
        expiresAt: Date.now() + REVERSE_CACHE_TTL_MS,
      });

      this.logger.log(
        `Reverse geocode SUCCESS for lat=${latitude}, lng=${longitude}`,
      );
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(
        `Reverse geocode network error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException('Reverse geocoding failed');
    } finally {
      this.rateLimiter.releaseSlot();
    }
  }

  // -------------------------------------------------------------------------
  // Forward geocode
  // -------------------------------------------------------------------------

  async forward(
    postalCode: string,
    countryCode?: string,
  ): Promise<GeocodeResultDto> {
    const trimmed = (postalCode || '').trim();
    if (!trimmed) {
      this.logger.warn('Forward geocode called with empty postal code');
      throw new BadRequestException('postalCode is required');
    }

    const key = this.cacheKeyForward(trimmed, countryCode);
    const cached = this.forwardCache.get(key);
    if (cached) {
      this.logger.debug(`Forward geocode cache HIT for ${key}`);
      return { ...cached.result };
    }

    this.logger.log(
      `Forward geocode cache MISS for postal=${trimmed}, country=${countryCode || 'none'}`,
    );

    await this.rateLimiter.waitForSlot();
    try {
      const url = new URL(GOOGLE_GEOCODE_URL);

      // Build an address query; adding the country component improves accuracy
      const addressParts = [trimmed];
      if (countryCode?.trim()) {
        url.searchParams.set(
          'components',
          `country:${countryCode.trim().toUpperCase()}|postal_code:${trimmed}`,
        );
      } else {
        url.searchParams.set('address', addressParts.join(', '));
      }

      url.searchParams.set('key', this.apiKey);

      const res = await fetchJson(url.toString(), {
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        this.logger.error(
          `Google Maps forward geocode HTTP ${res.status} for postal=${trimmed}, country=${countryCode}`,
        );
        throw new BadRequestException('Forward geocoding failed');
      }

      const body = (await res.json()) as GoogleGeocodeResponse;

      if (body.status === 'ZERO_RESULTS' || !body.results?.length) {
        this.logger.warn(
          `No result found for postal code: ${trimmed} (country=${countryCode || 'none'})`,
        );
        throw new BadRequestException('No result for postal code');
      }

      if (body.status === 'REQUEST_DENIED') {
        this.logger.warn(
          `Google Maps forward geocode REQUEST_DENIED for postal=${trimmed}: ${body.error_message ?? 'Geocoding API not enabled'}`,
        );
        throw new HttpException(
          {
            message:
              'Geocoding service is not configured. Enable the Geocoding API in Google Cloud Console.',
            code: 'GEOCODING_API_DISABLED',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (body.status !== 'OK') {
        this.logger.error(
          `Google Maps forward geocode status=${body.status}` +
            (body.error_message ? `: ${body.error_message}` : ''),
        );
        throw new BadRequestException('Forward geocoding failed');
      }

      const first = body.results[0];
      const lat = first.geometry?.location?.lat;
      const lng = first.geometry?.location?.lng;

      if (lat === undefined || lng === undefined) {
        this.logger.error('Invalid coordinates in Google Maps result');
        throw new BadRequestException('Invalid geocode result');
      }

      const result = this.extractResult(first, lat, lng);

      this.forwardCache.set(key, {
        result,
        expiresAt: Date.now() + FORWARD_CACHE_TTL_MS,
      });

      this.logger.log(`Forward geocode SUCCESS for postal=${trimmed}`);
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(
        `Forward geocode network error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException('Forward geocoding failed');
    } finally {
      this.rateLimiter.releaseSlot();
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private extractResult(
    googleResult: GoogleGeocodeResult,
    latitude: number,
    longitude: number,
  ): GeocodeResultDto {
    const components = googleResult.address_components ?? [];

    const country = components.find((c) => c.types.includes('country'));
    const province = components.find((c) =>
      c.types.includes('administrative_area_level_1'),
    );
    const postal = components.find((c) => c.types.includes('postal_code'));

    const countryCode = country?.short_name?.toUpperCase();
    const countryName = country?.long_name;
    const provinceCode = province?.short_name?.toUpperCase();
    const provinceName = province?.long_name;
    const postalCode = postal?.short_name ?? postal?.long_name;

    return {
      latitude,
      longitude,
      ...(countryCode && { countryCode }),
      ...(countryName && { countryName }),
      ...(provinceCode && { provinceCode }),
      ...(provinceName && { provinceName }),
      ...(postalCode && { postalCode }),
    };
  }

  private cacheKeyReverse(lat: number, lng: number): string {
    return `${Number(lat.toFixed(2))},${Number(lng.toFixed(2))}`;
  }

  private cacheKeyForward(postalCode: string, countryCode?: string): string {
    return `${postalCode.toUpperCase()}|${(countryCode || '').trim().toUpperCase()}`;
  }
}
