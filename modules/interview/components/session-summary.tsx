"use client";

import Link from "next/link";
import { Award, CheckCircle, AlertTriangle, RotateCcw, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type SessionSummary } from "../schemas/interview.schema";

interface SessionSummaryProps {
  overallScore: number;
  summary: SessionSummary;
}

export function SessionSummaryView({ overallScore, summary }: SessionSummaryProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 my-6">
      <Card className="text-center">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">Interview Session Complete!</CardTitle>
          <p className="text-sm text-muted-foreground">
            Here is your overall performance summary and feedback evaluation.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {/* Big Score Ring */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex size-32 flex-col items-center justify-center rounded-full border-4 border-primary bg-primary/5">
              <span className="text-4xl font-extrabold text-primary">{overallScore}%</span>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Overall Score
              </span>
            </div>
          </div>

          {/* Overall Impression */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-left space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Award className="size-4 text-primary" />
              <span>Overall Impression</span>
            </div>
            <p className="text-sm text-muted-foreground">{summary.overallImpression}</p>
          </div>

          {/* Strengths & Focus Areas */}
          <div className="grid gap-4 sm:grid-cols-2 text-left">
            <div className="space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle className="size-4" />
                <span>Top Strengths</span>
              </div>
              <ul className="space-y-1.5 text-xs text-foreground/90 list-disc pl-4">
                {summary.topStrengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                <AlertTriangle className="size-4" />
                <span>Recommended Focus Areas</span>
              </div>
              <ul className="space-y-1.5 text-xs text-foreground/90 list-disc pl-4">
                {summary.focusAreas.map((fa, idx) => (
                  <li key={idx}>{fa}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/dashboard/interview">
                <RotateCcw className="mr-2 size-4" />
                Practice Another Session
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 size-4" />
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
