"use client";

import { useEffect, useState } from "react";
import { Award, CheckCircle2, Circle, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STAGES = [
  "Evaluating technical depth & STAR structure",
  "Calculating overall score & performance metrics",
  "Synthesizing top strengths & key focus areas",
  "Finalizing your interview summary report",
];

export function CompletingSessionView() {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStage(1), 1800);
    const timer2 = setTimeout(() => setCurrentStage(2), 4200);
    const timer3 = setTimeout(() => setCurrentStage(3), 7000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const progressPercent = Math.min(25 + currentStage * 25, 95);

  return (
    <div className="mx-auto max-w-xl py-12 px-4">
      <Card className="relative overflow-hidden border-primary/20 bg-card/80 backdrop-blur-sm shadow-xl">
        {/* Top subtle gradient accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-emerald-500 to-amber-500 animate-pulse" />

        <CardContent className="p-8 sm:p-10 space-y-8 text-center">
          {/* Animated Central Icon Ring */}
          <div className="flex justify-center">
            <div className="relative flex size-24 items-center justify-center rounded-full bg-primary/5 p-4 border border-primary/20 shadow-inner">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping opacity-25" />
              {/* Spinning gradient border overlay */}
              <Loader2 className="absolute size-24 animate-spin text-primary/40 stroke-[1.5]" />
              {/* Central Glowing Icon */}
              <Award className="size-10 text-primary animate-pulse" />
              <Sparkles className="absolute top-2 right-2 size-4 text-amber-500 animate-bounce" />
            </div>
          </div>

          {/* Heading & Tagline */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
              Calculating Your Score
            </h2>
            <p className="text-sm font-medium text-muted-foreground max-w-md mx-auto">
              Analyzing your interview responses and generating personalized feedback report...
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-700 ease-out rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-muted-foreground px-0.5">
              <span>AI Evaluation</span>
              <span>{progressPercent}% Complete</span>
            </div>
          </div>

          {/* Stages List */}
          <div className="space-y-3.5 text-left rounded-xl border border-border/60 bg-muted/30 p-4 sm:p-5">
            {STAGES.map((stageText, idx) => {
              const isDone = idx < currentStage;
              const isCurrent = idx === currentStage;

              return (
                <div key={stageText} className="flex items-center gap-3">
                  {isDone ? (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                  ) : isCurrent ? (
                    <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-muted-foreground/30" />
                  )}
                  <span
                    className={cn(
                      "text-xs sm:text-sm font-medium transition-all duration-300",
                      isDone && "text-foreground/90 line-through opacity-80",
                      isCurrent && "font-semibold text-primary scale-[1.01]",
                      !isDone && !isCurrent && "text-muted-foreground/50"
                    )}
                  >
                    {stageText}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
