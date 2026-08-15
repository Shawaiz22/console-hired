"use client";

import { AudioLines, Gauge, MessageSquareDashed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type DeliveryMetrics } from "../schemas/interview.schema";
import { paceLabel } from "../utils/delivery-metrics";

interface DeliveryCardProps {
  metrics: DeliveryMetrics;
}

/**
 * How the candidate sounded, scored from the audio and kept separate from the content
 * feedback above it. The wording stays on what is audible — delivery, never confidence.
 */
export function DeliveryCard({ metrics }: DeliveryCardProps) {
  const { analysis } = metrics;

  const dimensions = analysis
    ? [
        { label: "Pace", score: analysis.pace },
        { label: "Vocal variation", score: analysis.vocalVariation },
        { label: "Fluency", score: analysis.fluency },
        { label: "Articulation", score: analysis.articulation },
      ]
    : [];

  return (
    <Card className="mx-auto max-w-2xl border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AudioLines className="size-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Delivery</CardTitle>
              <p className="text-xs text-muted-foreground pt-0.5">
                How you sounded — scored separately from your answer&apos;s content.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs shrink-0">
            Audio Analysis
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Computed from the transcript and recording length, not from the model */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Gauge className="size-3.5" />
              <span>Speaking rate</span>
            </div>
            <p className="text-lg font-bold text-foreground">{metrics.wordsPerMinute} WPM</p>
            <p className="text-[11px] text-muted-foreground">{paceLabel(metrics.wordsPerMinute)}</p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MessageSquareDashed className="size-3.5" />
              <span>Filler words</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {metrics.fillerCount} {metrics.fillerCount === 1 ? "filler" : "fillers"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {metrics.fillerRate}% of {metrics.wordCount} words
            </p>
          </div>
        </div>

        {analysis ? (
          <>
            <div className="space-y-2.5">
              {dimensions.map((dim) => (
                <div key={dim.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">{dim.label}</span>
                    <span className="font-mono font-bold text-foreground">{dim.score} / 5</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        dim.score >= 4
                          ? "bg-emerald-500"
                          : dim.score >= 3
                            ? "bg-primary"
                            : "bg-amber-500"
                      )}
                      style={{ width: `${(dim.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {analysis.observations.length > 0 && (
              <ul className="space-y-1.5 rounded-lg border border-border bg-muted/20 p-4 text-xs text-foreground/90 list-disc pl-8">
                {analysis.observations.map((observation, idx) => (
                  <li key={idx}>{observation}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          // Never fill this in with a plausible-looking score
          <p className="rounded-lg border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
            Detailed delivery analysis is unavailable for this answer.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
