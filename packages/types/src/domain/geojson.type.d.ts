/**
 * GeoJSON type definitions
 * Used for service area definitions (Point or Polygon)
 */
export interface GeoJSONPoint {
    type: 'Point';
    coordinates: [number, number];
}
export interface GeoJSONPolygon {
    type: 'Polygon';
    coordinates: number[][][];
}
export type ServiceArea = GeoJSONPoint | GeoJSONPolygon;
//# sourceMappingURL=geojson.type.d.ts.map