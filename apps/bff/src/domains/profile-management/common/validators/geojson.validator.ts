import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { ServiceArea, GeoJSONPoint, GeoJSONPolygon } from '../../../../common/types';

/**
 * Validates GeoJSON structure (Point or Polygon)
 * Validates coordinate ranges and polygon closure
 */
@ValidatorConstraint({ name: 'isValidGeoJSON', async: false })
export class IsValidGeoJSONConstraint
  implements ValidatorConstraintInterface
{
  validate(serviceArea: any, args: ValidationArguments): boolean {
    if (!serviceArea || typeof serviceArea !== 'object') {
      return false;
    }

    const area = serviceArea as ServiceArea;

    // Must have type field
    if (!area.type || (area.type !== 'Point' && area.type !== 'Polygon')) {
      return false;
    }

    // Validate Point
    if (area.type === 'Point') {
      const point = area as GeoJSONPoint;
      if (!Array.isArray(point.coordinates) || point.coordinates.length !== 2) {
        return false;
      }

      const [longitude, latitude] = point.coordinates;
      if (typeof longitude !== 'number' || typeof latitude !== 'number') {
        return false;
      }

      // Validate coordinate ranges
      if (latitude < -90 || latitude > 90) {
        return false;
      }
      if (longitude < -180 || longitude > 180) {
        return false;
      }

      return true;
    }

    // Validate Polygon
    if (area.type === 'Polygon') {
      const polygon = area as GeoJSONPolygon;
      if (!Array.isArray(polygon.coordinates)) {
        return false;
      }

      // Polygon must have at least one ring (exterior ring)
      if (polygon.coordinates.length === 0) {
        return false;
      }

      // Validate each ring
      for (const ring of polygon.coordinates) {
        if (!Array.isArray(ring) || ring.length < 4) {
          // Ring must have at least 4 points (closed polygon)
          return false;
        }

        // Validate each coordinate pair
        for (const coord of ring) {
          if (!Array.isArray(coord) || coord.length !== 2) {
            return false;
          }

          const [longitude, latitude] = coord;
          if (typeof longitude !== 'number' || typeof latitude !== 'number') {
            return false;
          }

          // Validate coordinate ranges
          if (latitude < -90 || latitude > 90) {
            return false;
          }
          if (longitude < -180 || longitude > 180) {
            return false;
          }
        }

        // Check polygon closure (first and last points should be the same)
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Service area must be a valid GeoJSON Point or Polygon with valid coordinates';
  }
}

export function IsValidGeoJSON(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidGeoJSONConstraint,
    });
  };
}

