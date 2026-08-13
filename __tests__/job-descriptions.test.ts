/**
 * @jest-environment node
 */

import { POST as createJDHandler } from "@/app/api/v1/job-descriptions/route";

jest.mock("@/lib/auth-helpers", () => ({
  requireUser: jest.fn().mockResolvedValue({ id: "user-123", email: "test@example.com" }),
}));

jest.mock("@/modules/resume/utils/parse-jd", () => ({
  parseJD: jest.fn().mockResolvedValue(undefined),
}));

describe("Job Descriptions API Suite", () => {
  it("returns 400 when rawText is under 100 characters", async () => {
    const req = new Request("http://localhost/api/v1/job-descriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText: "Short text" }),
    });

    const res = await createJDHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Job description is too short to analyse");
  });

  it("returns 400 when no rawText or file is provided in multipart body", async () => {
    const formData = new FormData();
    const req = new Request("http://localhost/api/v1/job-descriptions", {
      method: "POST",
      body: formData,
    });

    const res = await createJDHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("No file or rawText provided");
  });
});
