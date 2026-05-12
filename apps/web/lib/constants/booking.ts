/** Shared booking constants used across list and detail pages. */

export const STATUS_COLOR_MAP: Record<
  string,
  "amber" | "blue" | "green" | "gray" | "red" | "orange"
> = {
  pending: "amber",
  accepted: "blue",
  in_progress: "green",
  completed: "gray",
  payment_released: "green",
  cancelled: "red",
  declined: "red",
  disputed: "orange",
  no_show: "red",
};

export function getStatusColor(status: string) {
  return STATUS_COLOR_MAP[status] ?? "gray";
}

export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}
