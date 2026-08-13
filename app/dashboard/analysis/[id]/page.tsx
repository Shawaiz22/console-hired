"use client";

import { use, useEffect, useState } from "react";
import { EvidenceChecklist } from "@/modules/analysis/components/evidence-checklist";
import { GapsSuggestions } from "@/modules/analysis/components/gaps-suggestions";
import { ProcessingView } from "@/modules/analysis/components/processing-view";
import { ScoreHeader } from "@/modules/analysis/components/score-header";
import { type AnalysisResult } from "@/modules/analysis/schemas/analysis.schema";

type Params = Promise<{ id: string }>;

interface AnalysisData extends Partial<AnalysisResult> {
  id: string;
  status: "pending" | "processing" | "complete" | "failed";
  errorMessage?: string | null;
}

export default function AnalysisResultPage({ params }: { params: Params }) {
  const { id } = use(params);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/v1/analyses/${id}`);
        const data = await res.json();
        if (!ignore) {
          if (!res.ok) {
            setError(data.error || "Failed to load analysis");
          } else {
            setAnalysis(data.analysis);
          }
          setLoading(false);
        }
      } catch {
        if (!ignore) {
          setError("An error occurred while fetching analysis");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [id]);

  // Polling every 2 seconds until complete or failed
  useEffect(() => {
    if (!analysis || analysis.status === "complete" || analysis.status === "failed") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/analyses/${id}`);
        const data = await res.json();
        if (res.ok && data.analysis) {
          setAnalysis(data.analysis);
        }
      } catch {
        // keep existing state on transient poll error
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [analysis, id]);

  if (loading || !analysis || analysis.status === "pending" || analysis.status === "processing") {
    return (
      <ProcessingView
        errorMessage={analysis?.status === "failed" ? analysis.errorMessage : error}
        onRetry={() => {
          setLoading(true);
          setError(null);
        }}
      />
    );
  }

  if (analysis.status === "failed") {
    return (
      <ProcessingView
        errorMessage={analysis.errorMessage || "Analysis failed"}
        onRetry={() => {
          setLoading(true);
          setError(null);
        }}
      />
    );
  }

  const overallScore = analysis.overallScore ?? 0;
  const breakdown = analysis.breakdown ?? {
    skillCoverage: 0,
    experienceFit: 0,
    responsibilityEvidence: 0,
    atsHygiene: 0,
  };
  const evidenceMap = analysis.evidenceMap ?? [];
  const gaps = analysis.gaps ?? [];
  const suggestions = analysis.suggestions ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Analysis Results</h1>
        <p className="text-sm text-muted-foreground">
          Detailed match analysis and evidence breakdown for your resume against the target role.
        </p>
      </div>

      <ScoreHeader score={overallScore} breakdown={breakdown} />
      <EvidenceChecklist evidenceMap={evidenceMap} />
      <GapsSuggestions gaps={gaps} suggestions={suggestions} />
    </div>
  );
}
