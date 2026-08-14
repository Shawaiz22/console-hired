"use client";

import { useCallback, useEffect, useState } from "react";
import { VideoAnalysis } from "@/components/interview/video-analysis";
import { FeedbackCard } from "./feedback-card";
import { QuestionView } from "./question-view";
import { SessionSummaryView } from "./session-summary";
import {
  type AnswerEvaluation,
  type InterviewQuestion,
  type SessionSummary,
} from "../schemas/interview.schema";

interface AnswerRecord {
  questionIndex: number;
  answerText: string;
  evaluation: AnswerEvaluation;
}

interface SessionData {
  id: string;
  status: "in_progress" | "completed" | "cancelled";
  questions: InterviewQuestion[];
  overallScore?: number | null;
  summary?: SessionSummary | null;
}

interface InterviewSessionViewProps {
  id: string;
}

export function InterviewSessionView({ id }: InterviewSessionViewProps) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeEvaluation, setActiveEvaluation] = useState<AnswerEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadSession() {
      try {
        const res = await fetch(`/api/v1/interviews/${id}`);
        const data = await res.json();
        if (ignore) return;

        if (!res.ok) {
          setError(data.error || "Could not load session");
        } else {
          setSession(data.session);
          const loadedAnswers: AnswerRecord[] = data.answers || [];

          // Resumability: land on the first unanswered question
          const questionCount = data.session.questions?.length ?? 0;
          setCurrentQuestionIndex(
            questionCount > 0 ? Math.min(loadedAnswers.length, questionCount - 1) : 0
          );
        }
        setLoading(false);
      } catch {
        if (!ignore) {
          setError("Failed to load interview session");
          setLoading(false);
        }
      }
    }

    loadSession();
    return () => {
      ignore = true;
    };
  }, [id]);

  const handleAnswerSubmit = useCallback(
    async (answerText: string) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const res = await fetch(`/api/v1/interviews/${id}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionIndex: currentQuestionIndex, answerText }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to evaluate answer");
          return;
        }

        setActiveEvaluation(data.answer.evaluation as AnswerEvaluation);
      } catch {
        setError("An error occurred while evaluating your answer.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, currentQuestionIndex]
  );

  const handleNextQuestion = useCallback(async () => {
    setActiveEvaluation(null);

    const questionCount = session?.questions.length ?? 0;
    if (currentQuestionIndex < questionCount - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    // Last question answered: ask the server to score and summarise the session
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/interviews/${id}/complete`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not complete the interview session");
        return;
      }

      setSession((prev) => (prev ? { ...prev, ...data.session } : data.session));
    } catch {
      setError("An error occurred while completing your session.");
    } finally {
      setIsSubmitting(false);
    }
  }, [id, session, currentQuestionIndex]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center text-sm text-muted-foreground">
        Loading interview session...
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-sm text-destructive">
        {error || "Interview session not found"}
      </div>
    );
  }

  if (session.status === "completed") {
    // Score and summary are produced by the complete endpoint; never invented here.
    if (session.summary && typeof session.overallScore === "number") {
      return <SessionSummaryView overallScore={session.overallScore} summary={session.summary} />;
    }

    return (
      <div className="mx-auto max-w-md py-16 text-center text-sm text-muted-foreground">
        This session is complete, but its summary could not be generated. Please start a new mock
        interview to get feedback.
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-sm text-destructive">
        This session has no questions to answer.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="grid gap-6 md:grid-cols-12 items-start">
        <div className="md:col-span-7">
          {activeEvaluation ? (
            <FeedbackCard
              evaluation={activeEvaluation}
              onNextQuestion={handleNextQuestion}
              isLastQuestion={currentQuestionIndex === session.questions.length - 1}
            />
          ) : (
            <QuestionView
              question={currentQuestion}
              questionIndex={currentQuestionIndex}
              totalQuestions={session.questions.length}
              onSubmitAnswer={handleAnswerSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        <div className="md:col-span-5">
          <VideoAnalysis />
        </div>
      </div>
    </div>
  );
}
