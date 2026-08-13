"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type EvidenceItem } from "../schemas/analysis.schema";
import { EvidenceRow } from "./evidence-row";

interface EvidenceChecklistProps {
  evidenceMap: EvidenceItem[];
}

export function EvidenceChecklist({ evidenceMap }: EvidenceChecklistProps) {
  const [filter, setFilter] = useState<"all" | "strong" | "partial" | "missing">("all");

  const counts = {
    all: evidenceMap.length,
    strong: evidenceMap.filter((i) => i.status === "strong").length,
    partial: evidenceMap.filter((i) => i.status === "partial").length,
    missing: evidenceMap.filter((i) => i.status === "missing").length,
  };

  const filteredItems = evidenceMap.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold">Requirement Checklist</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Verbatim resume bullet evidence matched against job requirements
          </p>
        </div>

        <div className="flex gap-1 rounded-lg border border-border bg-muted p-1 text-xs">
          {(["all", "strong", "partial", "missing"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors capitalize ${
                filter === key
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {key} ({counts[key]})
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {filteredItems.map((item, idx) => (
          <EvidenceRow key={idx} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}
