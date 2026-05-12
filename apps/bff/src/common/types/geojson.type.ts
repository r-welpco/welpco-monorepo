/**
 * GeoJSON types used for service area definitions.
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
