"use client";

import { useEffect, useMemo, useRef } from "react";
import type {
  WelperDistributionBucket,
  WelperDistributionMapStyle,
} from "@/lib/services/admin-reports-service";

const DEFAULT_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_ATTRIBUTION = "&copy; OpenStreetMap contributors";
const CANADA_CENTER: [number, number] = [56.1304, -106.3468];

const MAP_STYLE_CONFIG: Record<
  WelperDistributionMapStyle,
  { filter: string; opacity: string; background: string }
> = {
  light: {
    filter: "grayscale(65%) saturate(45%) brightness(110%) contrast(90%)",
    opacity: "0.78",
    background: "#f8f7f2",
  },
  standard: {
    filter: "none",
    opacity: "1",
    background: "#dbe8f1",
  },
  grayscale: {
    filter: "grayscale(100%) saturate(0%) brightness(108%) contrast(88%)",
    opacity: "0.84",
    background: "#f4f4f2",
  },
  minimal: {
    filter: "grayscale(100%) saturate(0%) brightness(120%) contrast(60%)",
    opacity: "0.42",
    background: "#faf9f4",
  },
};

export function WelperDistributionMap({
  buckets,
  mapStyle,
}: {
  buckets: WelperDistributionBucket[];
  mapStyle: WelperDistributionMapStyle;
}) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const styleConfig = MAP_STYLE_CONFIG[mapStyle];

  const mappableBuckets = useMemo(
    () =>
      buckets.filter(
        (bucket) =>
          typeof bucket.latitude === "number" &&
          typeof bucket.longitude === "number" &&
          Number.isFinite(bucket.latitude) &&
          Number.isFinite(bucket.longitude),
      ),
    [buckets],
  );

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    async function renderMap() {
      const element = mapElementRef.current;
      if (!element) return;

      const L = await import("leaflet");
      if (cancelled) return;

      const map = L.map(element, {
        center: CANADA_CENTER,
        zoom: 4,
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      L.tileLayer(
        process.env.NEXT_PUBLIC_ADMIN_MAP_TILE_URL || DEFAULT_TILE_URL,
        {
          attribution:
            process.env.NEXT_PUBLIC_ADMIN_MAP_ATTRIBUTION || DEFAULT_ATTRIBUTION,
          maxZoom: 18,
        },
      ).addTo(map);
      const tilePane = map.getPane("tilePane");
      if (tilePane) {
        tilePane.style.filter = styleConfig.filter;
        tilePane.style.opacity = styleConfig.opacity;
      }

      const bounds = L.latLngBounds([]);
      for (const bucket of mappableBuckets) {
        if (bucket.latitude == null || bucket.longitude == null) continue;
        const position = L.latLng(bucket.latitude, bucket.longitude);
        bounds.extend(position);
        const marker = L.circleMarker(position, {
          radius: Math.min(30, Math.max(8, Math.sqrt(bucket.welperCount) * 5)),
          color: "#c9a227",
          fillColor: "#c9a227",
          fillOpacity: 0.35,
          weight: 2,
        });
        marker.bindPopup(
          [
            `<strong>${bucket.city}, ${bucket.provinceCode}</strong>`,
            `${bucket.welperCount} welpers`,
            `${bucket.discoverableCount} discoverable`,
            `${bucket.activeCount} active`,
          ].join("<br />"),
        );
        marker.addTo(map);
      }

      if (mappableBuckets.length > 0 && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 9 });
      }

      cleanup = () => {
        map.remove();
        mapRef.current = null;
      };
    }

    void renderMap();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [mappableBuckets, styleConfig.filter, styleConfig.opacity]);

  if (mappableBuckets.length === 0) {
    return (
      <div
        style={{
          alignItems: "center",
          border: "1px dashed var(--gray-a7)",
          borderRadius: "var(--radius-3)",
          color: "var(--gray-10)",
          display: "flex",
          minHeight: 360,
          justifyContent: "center",
          padding: "var(--space-4)",
          textAlign: "center",
          background: styleConfig.background,
        }}
      >
        No mappable area buckets yet. Welpers without coordinates are counted in
        the summary and table.
      </div>
    );
  }

  return (
    <div
      ref={mapElementRef}
      style={{
        background: styleConfig.background,
        borderRadius: "var(--radius-3)",
        minHeight: 420,
        overflow: "hidden",
        width: "100%",
      }}
    />
  );
}
