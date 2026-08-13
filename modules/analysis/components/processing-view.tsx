"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProcessingViewProps {
  errorMessage?: string | null;
  onRetry?: () => void;
}

export function ProcessingView({ errorMessage, onRetry }: ProcessingViewProps) {
  const [currentStage, setCurrentStage] = useState(0);

  const stages = [
    "Resume parsed",
    "Job description analysed",
    "Matching requirements",
    "Generating suggestions",
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStage(1), 1500);
    const timer2 = setTimeout(() => setCurrentStage(2), 4000);
    const timer3 = setTimeout(() => setCurrentStage(3), 8000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  if (errorMessage) {
    return (
      <Card className="mx-auto my-12 max-w-md">
        <CardContent className="space-y-4 p-6 text-center">
          <div className="flex justify-center text-destructive">
            <AlertCircle className="size-12" />
          </div>
          <h2 className="text-lg font-semibold">Analysis Failed</h2>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto my-12 max-w-md">
      <CardContent className="space-y-6 p-8">
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold tracking-tight">Analyzing Fit</h2>
          <p className="text-sm text-muted-foreground">
            Comparing your experience against job requirements...
          </p>
        </div>

        <div className="space-y-4">
          {stages.map((stage, idx) => {
            const isDone = idx < currentStage;
            const isCurrent = idx === currentStage;

            return (
              <div key={stage} className="flex items-center gap-3">
                {isDone ? (
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                ) : isCurrent ? (
                  <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
                ) : (
                  <Circle className="size-5 shrink-0 text-muted-foreground/40" />
                )}
                <span
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isDone && "text-foreground",
                    isCurrent && "font-semibold text-primary",
                    !isDone && !isCurrent && "text-muted-foreground/60"
                  )}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
