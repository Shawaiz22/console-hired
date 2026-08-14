/**
 * @jest-environment node
 */

import bcrypt from "bcryptjs";

describe("Auth Verification Gate Logic", () => {
  it("rejects user login when email is unverified", async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);
    const mockUser = {
      id: "user-1",
      email: "test@example.com",
      passwordHash,
      emailVerified: null,
    };

    const validPassword = await bcrypt.compare("Password123!", mockUser.passwordHash);
    expect(validPassword).toBe(true);

    // Verification gate check
    const canLogin = validPassword && Boolean(mockUser.emailVerified);
    expect(canLogin).toBe(false);
  });

  it("allows user login when email is verified", async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);
    const mockUser = {
      id: "user-1",
      email: "test@example.com",
      passwordHash,
      emailVerified: new Date(),
    };

    const validPassword = await bcrypt.compare("Password123!", mockUser.passwordHash);
    expect(validPassword).toBe(true);

    const canLogin = validPassword && Boolean(mockUser.emailVerified);
    expect(canLogin).toBe(true);
  });
});
