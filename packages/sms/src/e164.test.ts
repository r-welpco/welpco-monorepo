import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toE164 } from "./e164";
import { resolveTwilioConfig, sendSmsViaStub } from "./transport";

describe("toE164", () => {
  it("builds E.164 from countryCode and number", () => {
    assert.equal(
      toE164({ countryCode: "+1", number: "4165551212" }),
      "+14165551212",
    );
  });

  it("strips formatting from the national number", () => {
    assert.equal(
      toE164({ countryCode: "1", number: "(416) 555-1212" }),
      "+14165551212",
    );
  });

  it("returns null for incomplete phones", () => {
    assert.equal(toE164(null), null);
    assert.equal(toE164({ countryCode: "+1", number: "" }), null);
    assert.equal(toE164({ countryCode: "", number: "4165551212" }), null);
  });
});

describe("resolveTwilioConfig", () => {
  it("defaults to stub when credentials are missing", () => {
    const prev = {
      sid: process.env.TWILIO_ACCOUNT_SID,
      token: process.env.TWILIO_AUTH_TOKEN,
      from: process.env.TWILIO_FROM_NUMBER,
      provider: process.env.SMS_PROVIDER,
    };
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_FROM_NUMBER;
    delete process.env.SMS_PROVIDER;
    try {
      assert.equal(resolveTwilioConfig().provider, "stub");
    } finally {
      if (prev.sid) process.env.TWILIO_ACCOUNT_SID = prev.sid;
      if (prev.token) process.env.TWILIO_AUTH_TOKEN = prev.token;
      if (prev.from) process.env.TWILIO_FROM_NUMBER = prev.from;
      if (prev.provider) process.env.SMS_PROVIDER = prev.provider;
    }
  });
});

describe("sendSmsViaStub", () => {
  it("returns a stub sid without calling Twilio", async () => {
    const result = await sendSmsViaStub({
      to: "+14165551212",
      body: "Hello",
    });
    assert.equal(result.provider, "stub");
    assert.match(result.sid, /^stub_/);
    assert.equal(result.status, "stubbed");
  });
});
