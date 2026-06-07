import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getNotificationActionUrl,
  getNotificationCategoryCardType,
  mapNotificationToCardProps,
} from "./notification-card-mapper";
import type { NotificationItem } from "@/lib/services/notification-service";

const baseItem: NotificationItem = {
  id: "n1",
  userId: "u1",
  channel: "in_app",
  category: "booking",
  title: "Booking accepted",
  body: "Your welper accepted the job.",
  isRead: false,
  readAt: null,
  metadata: { actionUrl: "/dashboard/bookings/b1", bookingId: "b1" },
  createdAt: "2026-01-15T12:00:00.000Z",
  updatedAt: "2026-01-15T12:00:00.000Z",
};

describe("getNotificationCategoryCardType", () => {
  it("maps known categories", () => {
    assert.equal(getNotificationCategoryCardType("booking"), "booking");
    assert.equal(getNotificationCategoryCardType("payment"), "payment");
    assert.equal(getNotificationCategoryCardType("message"), "message");
    assert.equal(getNotificationCategoryCardType("dispute"), "warning");
  });

  it("falls back to info for unknown categories", () => {
    assert.equal(getNotificationCategoryCardType("unknown"), "info");
  });
});

describe("getNotificationActionUrl", () => {
  it("returns trimmed actionUrl from metadata", () => {
    assert.equal(
      getNotificationActionUrl({ actionUrl: "  /dashboard/bookings/b1  " }),
      "/dashboard/bookings/b1",
    );
  });

  it("returns undefined when actionUrl is missing or empty", () => {
    assert.equal(getNotificationActionUrl(null), undefined);
    assert.equal(getNotificationActionUrl({ actionUrl: "   " }), undefined);
  });
});

describe("mapNotificationToCardProps", () => {
  it("includes view label when actionUrl is present", () => {
    const card = mapNotificationToCardProps(baseItem, { viewLabel: "View" });
    assert.equal(card.actionLabel, "View");
    assert.equal(card.type, "booking");
    assert.equal(card.title, baseItem.title);
    assert.match(card.timestamp, /ago$/);
  });

  it("omits action label when there is no actionUrl", () => {
    const card = mapNotificationToCardProps(
      { ...baseItem, metadata: null },
      { viewLabel: "View" },
    );
    assert.equal(card.actionLabel, undefined);
  });
});
