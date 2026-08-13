"use client";

import { useState } from "react";
import { AlertTriangle, Check, Copy, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Gap, type Suggestion } from "../schemas/analysis.schema";

interface GapsSuggestionsProps {
  gaps: Gap[];
  suggestions: Suggestion[];
}

export function GapsSuggestions({ gaps, suggestions }: GapsSuggestionsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  function handleCopy(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            <CardTitle className="text-base font-semibold">Skill & Knowledge Gaps</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Skills requested in the job description absent from your resume
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          {gaps.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              No critical skill gaps identified!
            </p>
          ) : (
            gaps.map((gap, idx) => (
              <div key={idx} className="space-y-1.5 rounded-lg border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{gap.skill}</span>
                  <Badge
                    variant={gap.required ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {gap.required ? "Required" : "Nice to Have"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{gap.reason}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-5 text-primary" />
            <CardTitle className="text-base font-semibold">Bullet Point Improvements</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            AI-suggested bullet rewrites tailored to maximize ATS & evidence score
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {suggestions.map((sug, idx) => (
            <div key={idx} className="space-y-2 rounded-lg border border-border bg-card p-3">
              {sug.original && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-muted-foreground/80">Original:</span>
                  <p className="mt-0.5 line-through opacity-80">&quot;{sug.original}&quot;</p>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">Suggested Rewrite:</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleCopy(sug.improved, idx)}
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="mr-1 size-3 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 size-3" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="rounded-md border border-primary/20 bg-primary/5 p-2.5 text-xs font-medium text-foreground">
                  &quot;{sug.improved}&quot;
                </p>
              </div>

              <p className="text-[11px] italic text-muted-foreground">
                <strong>Why:</strong> {sug.rationale}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
