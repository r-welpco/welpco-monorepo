import { IsValidGeoJSONConstraint } from './geojson.validator';
import { GeoJSONPoint, GeoJSONPolygon } from '../../../../common/types';

describe('IsValidGeoJSONConstraint', () => {
  let constraint: IsValidGeoJSONConstraint;

  beforeEach(() => {
    constraint = new IsValidGeoJSONConstraint();
  });

  describe('validate - Point', () => {
    it('should return true for valid Point', () => {
      const point: GeoJSONPoint = {
        type: 'Point',
        coordinates: [-122.4, 37.8],
      };

      expect(constraint.validate(point, null as any)).toBe(true);
    });

    it('should return false for Point with wrong number of coordinates', () => {
      const point = {
        type: 'Point',
        coordinates: [-122.4],
      };

      expect(constraint.validate(point, null as any)).toBe(false);
    });

    it('should return false for Point with invalid latitude', () => {
      const point = {
        type: 'Point',
        coordinates: [-122.4, 91],
      };

      expect(constraint.validate(point, null as any)).toBe(false);
    });

    it('should return false for Point with invalid longitude', () => {
      const point = {
        type: 'Point',
        coordinates: [-181, 37.8],
      };

      expect(constraint.validate(point, null as any)).toBe(false);
    });

    it('should return false for Point with non-numeric coordinates', () => {
      const point = {
        type: 'Point',
        coordinates: ['-122.4', '37.8'],
      };

      expect(constraint.validate(point, null as any)).toBe(false);
    });
  });

  describe('validate - Polygon', () => {
    it('should return true for valid Polygon', () => {
      const polygon: GeoJSONPolygon = {
        type: 'Polygon',
        coordinates: [
          [
            [-122.4, 37.8],
            [-122.3, 37.8],
            [-122.3, 37.9],
            [-122.4, 37.9],
            [-122.4, 37.8], // Closed polygon
          ],
        ],
      };

      expect(constraint.validate(polygon, null as any)).toBe(true);
    });

    it('should return false for Polygon with less than 4 points', () => {
      const polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [-122.4, 37.8],
            [-122.3, 37.8],
            [-122.4, 37.8], // Only 3 points
          ],
        ],
      };

      expect(constraint.validate(polygon, null as any)).toBe(false);
    });

    it('should return false for Polygon that is not closed', () => {
      const polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [-122.4, 37.8],
            [-122.3, 37.8],
            [-122.3, 37.9],
            [-122.4, 37.9],
            // Missing closing point
          ],
        ],
      };

      expect(constraint.validate(polygon, null as any)).toBe(false);
    });

    it('should return false for Polygon with invalid coordinate format', () => {
      const polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [-122.4], // Missing second coordinate
            [-122.3, 37.8],
          ],
        ],
      };

      expect(constraint.validate(polygon, null as any)).toBe(false);
    });

    it('should return false for Polygon with invalid latitude', () => {
      const polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [-122.4, 91], // Invalid latitude
            [-122.3, 37.8],
            [-122.3, 37.9],
            [-122.4, 37.9],
            [-122.4, 91],
          ],
        ],
      };

      expect(constraint.validate(polygon, null as any)).toBe(false);
    });

    it('should return false for Polygon with invalid longitude', () => {
      const polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [-181, 37.8], // Invalid longitude
            [-122.3, 37.8],
            [-122.3, 37.9],
            [-122.4, 37.9],
            [-181, 37.8],
          ],
        ],
      };

      expect(constraint.validate(polygon, null as any)).toBe(false);
    });

    it('should return false for Polygon with empty coordinates array', () => {
      const polygon = {
        type: 'Polygon',
        coordinates: [],
      };

      expect(constraint.validate(polygon, null as any)).toBe(false);
    });
  });

  describe('validate - Invalid types', () => {
    it('should return false for invalid type', () => {
      const invalid = {
        type: 'LineString',
        coordinates: [[-122.4, 37.8], [-122.3, 37.8]],
      };

      expect(constraint.validate(invalid, null as any)).toBe(false);
    });

    it('should return false for missing type', () => {
      const invalid = {
        coordinates: [-122.4, 37.8],
      };

      expect(constraint.validate(invalid, null as any)).toBe(false);
    });

    it('should return false for null value', () => {
      expect(constraint.validate(null, null as any)).toBe(false);
    });

    it('should return false for non-object value', () => {
      expect(constraint.validate('invalid', null as any)).toBe(false);
    });
  });

  describe('defaultMessage', () => {
    it('should return error message', () => {
      const message = constraint.defaultMessage(null as any);
      expect(message).toContain('Service area must be a valid GeoJSON');
    });
  });
});

