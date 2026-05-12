"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@welpco/ui/skeleton";

function BlockSkeleton({ height = 140 }: { height?: number }) {
  return <Skeleton width="100%" height={`${height}px`} />;
}

export const CustomerProfileForm = dynamic(
  () =>
    import("@welpco/ui/platform/profile-management").then((m) => ({ default: m.CustomerProfileForm })),
  { loading: () => <BlockSkeleton height={200} /> }
);

export const WelperProfileForm = dynamic(
  () =>
    import("@welpco/ui/platform/profile-management").then((m) => ({ default: m.WelperProfileForm })),
  { loading: () => <BlockSkeleton height={220} /> }
);

export const ProfilePhotoUpload = dynamic(
  () =>
    import("@welpco/ui/platform/profile-management").then((m) => ({ default: m.ProfilePhotoUpload })),
  { loading: () => <BlockSkeleton height={120} /> }
);

export const ServiceOfferingList = dynamic(
  () =>
    import("@welpco/ui/platform/profile-management").then((m) => ({ default: m.ServiceOfferingList })),
  { loading: () => <BlockSkeleton height={180} /> }
);

export const ServiceOfferingForm = dynamic(
  () =>
    import("@welpco/ui/platform/profile-management").then((m) => ({ default: m.ServiceOfferingForm })),
  { loading: () => <BlockSkeleton height={280} /> }
);

export const TimeSlotAvailability = dynamic(
  () =>
    import("@welpco/ui/platform/profile-management").then((m) => ({ default: m.TimeSlotAvailability })),
  { loading: () => <BlockSkeleton height={240} /> }
);

export const AvailabilityScheduleStats = dynamic(
  () =>
    import("@welpco/ui/platform/profile-management").then((m) => ({
      default: m.AvailabilityScheduleStats,
    })),
  { loading: () => <BlockSkeleton height={160} /> }
);

export const AvailabilityExceptions = dynamic(
  () =>
    import("@welpco/ui/platform/profile-management").then((m) => ({
      default: m.AvailabilityExceptions,
    })),
  { loading: () => <BlockSkeleton height={200} /> }
);

export const FavoriteWelperList = dynamic(
  () =>
    import("@welpco/ui/platform/profile-management").then((m) => ({ default: m.FavoriteWelperList })),
  { loading: () => <BlockSkeleton height={200} /> }
);

export const ServicePreferences = dynamic(
  () =>
    import("@welpco/ui/platform/profile-management").then((m) => ({ default: m.ServicePreferences })),
  { loading: () => <BlockSkeleton height={180} /> }
);

export const ProfileCompletionStatus = dynamic(
  () =>
    import("@welpco/ui/platform/profile-management").then((m) => ({
      default: m.ProfileCompletionStatus,
    })),
  { loading: () => <BlockSkeleton height={100} /> }
);

export const ServiceAreaCard = dynamic(
  () =>
    import("@welpco/ui/platform/profile-management").then((m) => ({ default: m.ServiceAreaCard })),
  { loading: () => <BlockSkeleton height={200} /> }
);
