/**
 * @jest-environment node
 */

import { GET as getInterviewSession } from "@/app/api/v1/interviews/[id]/route";
import { POST as postAnswer } from "@/app/api/v1/interviews/[id]/answers/route";
import { POST as completeSession } from "@/app/api/v1/interviews/[id]/complete/route";
import interviewFixture from "@/modules/interview/fixtures/interview.json";

jest.mock("ai", () => ({
  generateObject: jest.fn(),
}));

jest.mock("@/lib/ai", () => ({
  extractionModel: {},
  evaluationModel: {},
  embeddingModel: {},
}));

jest.mock("@/lib/auth-helpers", () => ({
  requireApiUser: jest.fn().mockResolvedValue({ id: "user-123", email: "test@example.com" }),
}));

jest.mock("@/lib/db", () => ({
  db: {
    query: {
      interviewSessions: {
        findFirst: jest.fn(),
      },
      interviewAnswers: {
        findMany: jest.fn(),
      },
    },
    insert: jest.fn(),
    update: jest.fn(),
  },
}));

import { db } from "@/lib/db";

describe("Interview Routes Ownership & Validation Suite", () => {
  const validUuid = interviewFixture.id;
  const malformedId = "not-a-uuid-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Malformed UUID Validation", () => {
    it("returns 400 when GET /interviews/[id] receives malformed UUID", async () => {
      const req = new Request(`http://localhost/api/v1/interviews/${malformedId}`);
      const res = await getInterviewSession(req, { params: Promise.resolve({ id: malformedId }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid session ID");
    });

    it("returns 400 when POST /interviews/[id]/answers receives malformed UUID", async () => {
      const req = new Request(`http://localhost/api/v1/interviews/${malformedId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIndex: 0, answerText: "Test answer text" }),
      });
      const res = await postAnswer(req, { params: Promise.resolve({ id: malformedId }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid session ID");
    });

    it("returns 400 when POST /interviews/[id]/complete receives malformed UUID", async () => {
      const req = new Request(`http://localhost/api/v1/interviews/${malformedId}/complete`, {
        method: "POST",
      });
      const res = await completeSession(req, { params: Promise.resolve({ id: malformedId }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid session ID");
    });
  });

  describe("IDOR Protection & Session Ownership (404 on Mismatch)", () => {
    it("returns 404 on GET /interviews/[id] when accessing another user's session", async () => {
      (db.query.interviewSessions.findFirst as jest.Mock).mockResolvedValue(null);

      const req = new Request(`http://localhost/api/v1/interviews/${validUuid}`);
      const res = await getInterviewSession(req, { params: Promise.resolve({ id: validUuid }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Interview session not found");
    });

    it("returns 404 on POST /interviews/[id]/answers when targeting another user's session", async () => {
      (db.query.interviewSessions.findFirst as jest.Mock).mockResolvedValue(null);

      const req = new Request(`http://localhost/api/v1/interviews/${validUuid}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIndex: 0, answerText: "Test answer" }),
      });
      const res = await postAnswer(req, { params: Promise.resolve({ id: validUuid }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Interview session not found");
    });

    it("returns 404 on POST /interviews/[id]/complete when completing another user's session", async () => {
      (db.query.interviewSessions.findFirst as jest.Mock).mockResolvedValue(null);

      const req = new Request(`http://localhost/api/v1/interviews/${validUuid}/complete`, {
        method: "POST",
      });
      const res = await completeSession(req, { params: Promise.resolve({ id: validUuid }) });
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe("Interview session not found");
    });
  });

  describe("Session Completion Validation", () => {
    it("returns 400 on POST /interviews/[id]/complete when session has zero answers", async () => {
      (db.query.interviewSessions.findFirst as jest.Mock).mockResolvedValue({
        id: validUuid,
        userId: "user-123",
        status: "in_progress",
        questions: interviewFixture.questions,
      });
      (db.query.interviewAnswers.findMany as jest.Mock).mockResolvedValue([]);

      const req = new Request(`http://localhost/api/v1/interviews/${validUuid}/complete`, {
        method: "POST",
      });
      const res = await completeSession(req, { params: Promise.resolve({ id: validUuid }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Answer at least one question before completing this session");
    });
  });
});
