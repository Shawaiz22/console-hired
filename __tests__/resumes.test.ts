/**
 * @jest-environment node
 */

import { POST as uploadResumeHandler } from "@/app/api/v1/resumes/route";

jest.mock("@/lib/auth-helpers", () => ({
  requireApiUser: jest.fn().mockResolvedValue({ id: "user-123", email: "test@example.com" }),
}));

jest.mock("@/modules/resume/utils/parse-resume", () => ({
  parseResume: jest.fn().mockResolvedValue(undefined),
}));

describe("Resume Upload API Suite", () => {
  it("returns 400 if no file is provided", async () => {
    const formData = new FormData();
    const req = new Request("http://localhost/api/v1/resumes", {
      method: "POST",
      body: formData,
    });

    const res = await uploadResumeHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("No file provided");
  });

  it("returns 400 if file size exceeds 5MB limit", async () => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
    const file = new File([largeBuffer], "large_resume.pdf", { type: "application/pdf" });

    const formData = new FormData();
    formData.append("file", file);

    const req = new Request("http://localhost/api/v1/resumes", {
      method: "POST",
      body: formData,
    });

    const res = await uploadResumeHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("File must be under 5MB");
  });
});
