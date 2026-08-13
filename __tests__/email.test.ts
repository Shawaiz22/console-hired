import { otpEmailTemplate, sendEmail } from "@/lib/email";

describe("Email Module", () => {
  it("generates OTP email HTML with code, expiry, and fallback message", () => {
    const code = "123456";
    const html = otpEmailTemplate(code);

    expect(html).toContain("123456");
    expect(html).toContain("10 minutes");
    expect(html).toContain("If you didn't request this, you can ignore this email.");
    expect(html).toContain("console.hired()");
  });

  it("exports sendEmail function", () => {
    expect(typeof sendEmail).toBe("function");
  });
});
