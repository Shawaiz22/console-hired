"use client";

import { useCallback, useEffect, useState } from "react";
import { VideoAnalysis } from "@/components/interview/video-analysis";
import { CompletingSessionView } from "./completing-session-view";
import { FeedbackCard } from "./feedback-card";
import { QuestionView } from "./question-view";
import { SessionSummaryView } from "./session-summary";
import { stopSpeaking } from "../utils/speak";
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
  const [activeInputMode, setActiveInputMode] = useState<"text" | "voice">("text");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
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
    async (answerText: string, inputMode: "text" | "voice" = "text") => {
      stopSpeaking();
      setIsSubmitting(true);
      setError(null);

      try {
        const res = await fetch(`/api/v1/interviews/${id}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionIndex: currentQuestionIndex, answerText, inputMode }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to evaluate answer");
          return;
        }

        setActiveEvaluation(data.answer.evaluation as AnswerEvaluation);
        setActiveInputMode(data.answer.inputMode || inputMode);
      } catch {
        setError("An error occurred while evaluating your answer.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, currentQuestionIndex]
  );

  const handleNextQuestion = useCallback(async () => {
    stopSpeaking();
    setActiveEvaluation(null);

    const questionCount = session?.questions.length ?? 0;
    if (currentQuestionIndex < questionCount - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    // Last question answered: ask the server to score and summarise the session
    setIsCompleting(true);
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
      setIsCompleting(false);
    }
  }, [id, session, currentQuestionIndex]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center text-sm text-muted-foreground">
        Loading interview session...
      </div>
    );
  }

  if (isCompleting) {
    return <CompletingSessionView />;
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-sm text-destructive">
        {error || "Interview session not found"}
      </div>
    );
  }

  if (session.status === "completed") {
    const fallbackSummary: SessionSummary = {
      overallImpression:
        session.summary?.overallImpression ||
        "Mock interview session successfully completed! Review your performance scores below.",
      topStrengths:
        session.summary?.topStrengths && session.summary.topStrengths.length > 0
          ? session.summary.topStrengths
          : ["Completed all interview questions", "Engaged thoughtfully with prompt questions"],
      focusAreas:
        session.summary?.focusAreas && session.summary.focusAreas.length > 0
          ? session.summary.focusAreas
          : [
              "Incorporate specific metrics and libraries",
              "Structure behavioral responses using STAR",
            ],
    };

    return (
      <SessionSummaryView
        overallScore={typeof session.overallScore === "number" ? session.overallScore : 70}
        summary={fallbackSummary}
      />
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
    <div className="mx-auto max-w-7xl w-full h-[calc(100vh-7.5rem)] max-h-[calc(100vh-7.5rem)] overflow-hidden p-1 sm:p-2">
      {error && (
        <div className="rounded-md bg-destructive/15 p-2 text-xs text-destructive shrink-0 mb-2">
          {error}
        </div>
      )}

      {activeEvaluation ? (
        <div className="mx-auto max-w-3xl w-full overflow-y-auto max-h-full py-2">
          <FeedbackCard
            evaluation={activeEvaluation}
            onNextQuestion={handleNextQuestion}
            isLastQuestion={currentQuestionIndex === session.questions.length - 1}
            inputMode={activeInputMode}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch h-full max-h-full overflow-hidden">
          {/* LEFT: ChatGPT Voice Stage (7 cols) */}
          <div className="lg:col-span-7 h-full max-h-full overflow-hidden">
            <QuestionView
              key={currentQuestion.id}
              question={currentQuestion}
              questionIndex={currentQuestionIndex}
              totalQuestions={session.questions.length}
              onSubmitAnswer={handleAnswerSubmit}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* RIGHT: Separate Expanded Candidate Webcam Panel (5 cols) */}
          <div className="lg:col-span-5 h-full max-h-full overflow-hidden flex flex-col justify-center">
            <div className="w-full h-full max-h-full rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-3 shadow-xl backdrop-blur-xl flex flex-col justify-center overflow-hidden">
              <VideoAnalysis compact={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
