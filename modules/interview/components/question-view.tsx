"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type InterviewQuestion } from "../schemas/interview.schema";

interface QuestionViewProps {
  question: InterviewQuestion;
  questionIndex: number;
  totalQuestions: number;
  onSubmitAnswer: (answerText: string) => Promise<void>;
  isSubmitting: boolean;
}

export function QuestionView({
  question,
  questionIndex,
  totalQuestions = 6,
  onSubmitAnswer,
  isSubmitting,
}: QuestionViewProps) {
  const [answerText, setAnswerText] = useState("");
  const [showWhyAsked, setShowWhyAsked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTechnical = question.type === "technical";
  const progressPercent = Math.round(((questionIndex + 1) / totalQuestions) * 100);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (answerText.trim().length < 50) {
      setError("Answer should be at least 50 characters for effective AI feedback.");
      return;
    }

    await onSubmitAnswer(answerText.trim());
  }

  const charCount = answerText.trim().length;

  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="space-y-6 p-6">
        {/* Progress Bar Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">
              Question {questionIndex + 1} of {totalQuestions}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "capitalize font-mono text-[11px]",
                isTechnical
                  ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                  : "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400"
              )}
            >
              {question.type} • {question.targetSkill}
            </Badge>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Text */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold leading-snug tracking-tight">{question.question}</h2>

          {/* Collapsible Why Asked */}
          <div className="rounded-lg border border-border bg-muted/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowWhyAsked(!showWhyAsked)}
              className="flex w-full items-center justify-between p-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <div className="flex items-center gap-1.5">
                <HelpCircle className="size-4 text-primary" />
                <span>Why this question?</span>
              </div>
              {showWhyAsked ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>

            {showWhyAsked && (
              <div className="border-t border-border p-3 text-xs text-muted-foreground bg-card">
                {question.whyAsked}
              </div>
            )}
          </div>
        </div>

        {/* Response Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="answer" className="text-xs font-semibold text-foreground">
                Your Answer
              </label>
              <span className="text-xs text-muted-foreground">{charCount} / 50 min chars</span>
            </div>
            <textarea
              id="answer"
              rows={6}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your response here. Include specific details, metrics, and technologies..."
              disabled={isSubmitting}
              className="flex min-h-[140px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting || charCount < 50}>
            {isSubmitting ? "Evaluating Answer..." : "Submit Answer & View Feedback"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
