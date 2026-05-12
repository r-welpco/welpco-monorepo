import { Module } from '@nestjs/common';
import { GeocodeController } from './geocode.controller';
import { GEOCODE_SERVICE } from './geocode.interface';
import { GoogleMapsGeocodeService } from './google-maps-geocode.service';
import { RateLimiterService } from './rate-limiter.service';

@Module({
  controllers: [GeocodeController],
  providers: [
    { provide: GEOCODE_SERVICE, useClass: GoogleMapsGeocodeService },
    GoogleMapsGeocodeService,
    RateLimiterService,
  ],
  exports: [GEOCODE_SERVICE, GoogleMapsGeocodeService],
})
export class GeocodeModule {}
