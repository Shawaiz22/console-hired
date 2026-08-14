/**
 * @jest-environment node
 *
 * Route handlers must answer unauthenticated calls with a 401 JSON body.
 * The page-level requireUser() redirects to /login, which surfaces as a 307
 * on an API route and breaks any non-browser client.
 */

import { GET as listResumes } from "@/app/api/v1/resumes/route";
import { GET as getStats } from "@/app/api/v1/stats/route";

jest.mock("@/lib/auth-helpers", () => ({
  requireApiUser: jest.fn().mockResolvedValue(null),
}));

jest.mock("@/modules/resume/utils/parse-resume", () => ({
  parseResume: jest.fn().mockResolvedValue(undefined),
}));

describe("API auth gate", () => {
  it("returns 401 JSON from /api/v1/resumes when there is no session", async () => {
    const res = await listResumes();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 JSON from /api/v1/stats when there is no session", async () => {
    const res = await getStats();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("does not answer an unauthenticated API call with a redirect", async () => {
    const res = await listResumes();

    expect(res.status).not.toBe(307);
    expect(res.headers.get("location")).toBeNull();
  });
});
