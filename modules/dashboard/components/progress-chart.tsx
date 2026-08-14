"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "./empty-state";

export interface ChartDataPoint {
  date: string;
  /** null when no score was recorded on that date — the line is gapped, not interpolated. */
  matchScore: number | null;
  interviewScore: number | null;
}

interface ProgressChartProps {
  data: ChartDataPoint[];
}

export function ProgressChart({ data }: ProgressChartProps) {
  if (data.length < 2) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Score Progress Trend</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <EmptyState
            title="Not enough score trend data"
            description="Complete at least 2 analyses or mock interviews to view your performance trajectory over time."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Score Progress Trend</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs text-muted-foreground" tickLine={false} />
              <YAxis domain={[0, 100]} className="text-xs text-muted-foreground" tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="matchScore"
                name="Match Score"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="interviewScore"
                name="Interview Score"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
