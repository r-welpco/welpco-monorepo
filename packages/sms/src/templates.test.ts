import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSmsBody } from "./templates";

describe("getSmsBody", () => {
  it("interpolates welper name for customer booking request", () => {
    const en = getSmsBody("customer_booking_request_sent", "en", {
      welperName: "Alex",
    });
    assert.match(en, /Alex/);
    assert.match(en, /booking request has been sent/);

    const fr = getSmsBody("customer_booking_request_sent", "fr", {
      welperName: "Alex",
    });
    assert.match(fr, /Alex/);
    assert.match(fr, /demande de réservation/);
  });

  it("uses distinct cancel copy for customer vs welper", () => {
    const customer = getSmsBody("customer_booking_cancelled", "en");
    const welper = getSmsBody("welper_booking_cancelled", "en");
    assert.match(customer, /Your booking has been cancelled/);
    assert.match(welper, /One of your bookings have been cancelled/);
  });
});
