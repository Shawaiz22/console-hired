/**
 * @jest-environment node
 */

import { POST as sendOtpHandler } from "@/app/api/v1/auth/send-otp/route";
import { POST as verifyOtpHandler } from "@/app/api/v1/auth/verify-otp/route";

describe("OTP Endpoints API Suite", () => {
  it("returns 400 for invalid send-otp email payload", async () => {
    const req = new Request("http://localhost/api/v1/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email: "invalid-email" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await sendOtpHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("returns 400 for invalid verify-otp payload", async () => {
    const req = new Request("http://localhost/api/v1/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com", code: "123" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await verifyOtpHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
