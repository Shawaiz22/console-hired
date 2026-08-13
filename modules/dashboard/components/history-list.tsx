"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type ActivityItem } from "./recent-activity";

interface HistoryListProps {
  items: ActivityItem[];
}

export function HistoryList({ items }: HistoryListProps) {
  const [filter, setFilter] = useState<"all" | "analysis" | "interview">("all");

  const filtered = items.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  return (
    <div className="space-y-4">
      {/* Filter Toggles */}
      <div className="flex items-center gap-2">
        {(["all", "analysis", "interview"] as const).map((key) => (
          <Button
            key={key}
            type="button"
            variant={filter === key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(key)}
            className="capitalize text-xs"
          >
            {key === "all" ? "All History" : key === "analysis" ? "Analyses" : "Interviews"}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No history records found for this filter.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden rounded-lg border border-border bg-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Score</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const isAnalysis = item.type === "analysis";
                  const dateStr = new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          {isAnalysis ? (
                            <FileText className="size-4 text-primary" />
                          ) : (
                            <Video className="size-4 text-primary" />
                          )}
                          <span className="capitalize text-xs font-medium">{item.type}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-medium">{item.title}</td>
                      <td className="p-3.5 text-xs text-muted-foreground">{dateStr}</td>
                      <td className="p-3.5">
                        <Badge variant="outline" className="font-mono text-xs">
                          {item.score}%
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                          <Link href={item.href}>
                            View <ArrowRight className="ml-1 size-3" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="space-y-3 md:hidden">
            {filtered.map((item) => {
              const isAnalysis = item.type === "analysis";
              const dateStr = new Date(item.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {isAnalysis ? (
                      <FileText className="size-5 text-primary" />
                    ) : (
                      <Video className="size-5 text-primary" />
                    )}
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.type} • {dateStr}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {item.score}%
                    </Badge>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
