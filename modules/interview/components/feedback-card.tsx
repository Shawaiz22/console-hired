"use client";

import { AlertTriangle, ArrowRight, Award, CheckCircle, Mic, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type AnswerEvaluation } from "../schemas/interview.schema";
import { useAudioPlayer } from "../hooks/use-audio-player";

interface FeedbackCardProps {
  evaluation: AnswerEvaluation;
  onNextQuestion: () => void;
  isLastQuestion: boolean;
  inputMode?: "text" | "voice";
}

export function FeedbackCard({
  evaluation,
  onNextQuestion,
  isLastQuestion,
  inputMode = "text",
}: FeedbackCardProps) {
  const { isSpeaking, playText, stop } = useAudioPlayer();

  const scoreDimensions = [
    { label: "Clarity", score: evaluation.clarity },
    { label: "Relevance", score: evaluation.relevance },
    { label: "Completeness", score: evaluation.completeness },
    { label: "Specificity", score: evaluation.specificity },
  ];

  const starParts = [
    { key: "situation", label: "Situation", val: evaluation.star?.situation },
    { key: "task", label: "Task", val: evaluation.star?.task },
    { key: "action", label: "Action", val: evaluation.star?.action },
    { key: "result", label: "Result", val: evaluation.star?.result },
  ];

  const handleListenFeedback = () => {
    if (isSpeaking) {
      stop();
      return;
    }

    const summaryText = `Answer feedback. Clarity: ${evaluation.clarity} out of 5. Relevance: ${
      evaluation.relevance
    } out of 5. Strengths: ${evaluation.strengths.join(". ")}. Areas for improvement: ${evaluation.improvements.join(
      ". "
    )}.`;
    playText(summaryText, true);
  };

  const handleNext = () => {
    stop();
    onNextQuestion();
  };

  return (
    <Card className="mx-auto max-w-2xl border-primary/30 bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="size-5 text-primary" />
            <CardTitle className="text-lg">Answer Feedback</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleListenFeedback}
              className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              title={isSpeaking ? "Stop feedback audio" : "Listen to feedback audio"}
            >
              <Volume2 className={cn("size-3.5", isSpeaking && "text-primary animate-pulse")} />
              <span className="hidden sm:inline">
                {isSpeaking ? "Speaking..." : "Listen to Feedback"}
              </span>
            </Button>
            {inputMode === "voice" ? (
              <Badge
                variant="secondary"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-xs gap-1"
              >
                <Mic className="size-3" /> Voice Response
              </Badge>
            ) : (
              <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                Typed Response
              </Badge>
            )}
            <Badge variant="outline" className="font-mono text-xs">
              AI Evaluation
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Rubric Scores */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {scoreDimensions.map((dim) => (
            <div
              key={dim.label}
              className="rounded-lg border border-border bg-muted/30 p-3 text-center space-y-1"
            >
              <span className="text-xs font-medium text-muted-foreground block">{dim.label}</span>
              <div className="flex items-center justify-center gap-1 text-sm font-bold">
                {[1, 2, 3, 4, 5].map((dot) => (
                  <span
                    key={dot}
                    className={cn(
                      "size-2 rounded-full",
                      dot <= dim.score ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-foreground block pt-0.5">
                {dim.score} / 5
              </span>
            </div>
          ))}
        </div>

        {/* STAR Chips for Behavioral Questions */}
        {evaluation.star !== undefined && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              STAR Structure Analysis
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {starParts.map((part) => (
                <div
                  key={part.key}
                  className={cn(
                    "rounded-md border p-2.5 text-center text-xs font-medium transition-colors",
                    part.val
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-muted bg-muted/40 text-muted-foreground/50 line-through"
                  )}
                >
                  <span className="block font-bold">{part.label}</span>
                  <span className="text-[10px] opacity-80">
                    {part.val ? "Detected" : "Missing"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Improvements */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Strengths */}
          <div className="space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle className="size-4" />
              <span>Strengths</span>
            </div>
            <ul className="space-y-1.5 text-xs text-foreground/90 list-disc pl-4">
              {evaluation.strengths.map((str, idx) => (
                <li key={idx}>{str}</li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold">
              <AlertTriangle className="size-4" />
              <span>Areas for Improvement</span>
            </div>
            <ul className="space-y-1.5 text-xs text-foreground/90 list-disc pl-4">
              {evaluation.improvements.map((imp, idx) => (
                <li key={idx}>{imp}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Next Question Action */}
        <Button onClick={handleNext} className="w-full">
          {isLastQuestion ? "Complete Interview & View Summary" : "Next Question"}
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
