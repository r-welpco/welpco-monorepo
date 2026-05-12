/**
 * GeoJSON type definitions
 * Used for service area definitions (Point or Polygon)
 */
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export type ServiceArea = GeoJSONPoint | GeoJSONPolygon;

