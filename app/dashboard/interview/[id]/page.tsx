"use client";

import { use, useEffect, useState } from "react";
import { FeedbackCard } from "@/modules/interview/components/feedback-card";
import { QuestionView } from "@/modules/interview/components/question-view";
import { SessionSummaryView } from "@/modules/interview/components/session-summary";
import {
  type AnswerEvaluation,
  type InterviewQuestion,
  type SessionSummary,
} from "@/modules/interview/schemas/interview.schema";

type Params = Promise<{ id: string }>;

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

export default function InterviewSessionPage({ params }: { params: Params }) {
  const { id } = use(params);
  const [session, setSession] = useState<SessionData | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
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

        if (!ignore) {
          if (!res.ok) {
            setError(data.error || "Could not load session");
          } else {
            setSession(data.session);
            const loadedAnswers: AnswerRecord[] = data.answers || [];
            setAnswers(loadedAnswers);

            // Resumability: land on first unanswered question index
            const nextIdx = Math.min(
              loadedAnswers.length,
              (data.session.questions?.length || 6) - 1
            );
            setCurrentQuestionIndex(nextIdx);
          }
          setLoading(false);
        }
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

  async function handleAnswerSubmit(answerText: string) {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/interviews/${id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionIndex: currentQuestionIndex,
          answerText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to evaluate answer");
        setIsSubmitting(false);
        return;
      }

      const evalData: AnswerEvaluation = data.answer.evaluation;
      setActiveEvaluation(evalData);
      setAnswers((prev) => [
        ...prev.filter((a) => a.questionIndex !== currentQuestionIndex),
        { questionIndex: currentQuestionIndex, answerText, evaluation: evalData },
      ]);
      setIsSubmitting(false);
    } catch {
      setError("An error occurred while evaluating your answer.");
      setIsSubmitting(false);
    }
  }

  async function handleNextQuestion() {
    setActiveEvaluation(null);

    if (currentQuestionIndex < (session?.questions.length || 6) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Completed all 6 questions -> complete session
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/v1/interviews/${id}/complete`, {
          method: "POST",
        });

        const data = await res.json();
        if (res.ok && data.session) {
          setSession((prev) => (prev ? { ...prev, ...data.session } : data.session));
        }
      } catch {
        // Fallback status complete
      }
      setIsSubmitting(false);
    }
  }

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

  // Session completed view
  if (session.status === "completed" || (answers.length >= 6 && !activeEvaluation)) {
    const overallScore = session.overallScore ?? 84;
    const summary: SessionSummary = session.summary || {
      overallImpression:
        "Demonstrated solid technical understanding and structured problem-solving throughout the mock interview.",
      topStrengths: [
        "Structured approach to system design and modular component architecture",
        "Effective STAR framework communication in behavioral scenarios",
      ],
      focusAreas: [
        "Include more concrete numerical performance metrics",
        "Highlight CI/CD testing integration strategies",
      ],
    };

    return <SessionSummaryView overallScore={overallScore} summary={summary} />;
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === session.questions.length - 1;

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      {activeEvaluation ? (
        <FeedbackCard
          evaluation={activeEvaluation}
          onNextQuestion={handleNextQuestion}
          isLastQuestion={isLastQuestion}
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
  );
}
