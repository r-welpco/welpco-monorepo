import type { AdminTimelineEvent } from "@/components/admin-timeline";
import type { DisputeItem } from "@/lib/services/dispute-service";

export function buildDisputeTimeline(dispute: DisputeItem): AdminTimelineEvent[] {
  const events: AdminTimelineEvent[] = [
    { id: "filed", label: "Dispute filed", timestamp: dispute.createdAt },
  ];

  if (dispute.updatedAt && dispute.updatedAt !== dispute.createdAt) {
    events.push({ id: "updated", label: "Last updated", timestamp: dispute.updatedAt });
  }

  if (dispute.resolution?.resolvedAt) {
    events.push({
      id: "resolved",
      label: "Resolved",
      timestamp: dispute.resolution.resolvedAt,
      tone: "success",
    });
  }

  return events.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return ta - tb;
  });
}
