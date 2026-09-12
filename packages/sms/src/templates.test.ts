import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSmsBody, SMS_TEMPLATE_TYPES } from "./templates";

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

  it("appends the team sign-off and dashboard link on every template", () => {
    const previous = process.env.FRONTEND_URL;
    delete process.env.FRONTEND_URL;
    try {
      for (const type of SMS_TEMPLATE_TYPES) {
        const en = getSmsBody(type, "en");
        assert.match(en, /\n\nThe Welpco Team\nhttps:\/\/welpco\.com\/dashboard$/);
        assert.doesNotMatch(en, /\/fr\/dashboard/);

        const fr = getSmsBody(type, "fr");
        assert.match(fr, /\n\nL'équipe Welpco\nhttps:\/\/welpco\.com\/fr\/dashboard$/);
      }
    } finally {
      if (previous === undefined) delete process.env.FRONTEND_URL;
      else process.env.FRONTEND_URL = previous;
    }
  });

  it("uses an explicit dashboard URL when provided", () => {
    const body = getSmsBody("welper_booking_request", "en", {
      dashboardUrl: "https://preview.example/dashboard",
    });
    assert.match(body, /\n\nThe Welpco Team\nhttps:\/\/preview\.example\/dashboard$/);
  });
});
