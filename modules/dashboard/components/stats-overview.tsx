import { StatCard } from "./stat-card";

interface StatsOverviewProps {
  resumesAnalyzed: number;
  interviewsCompleted: number;
  bestMatchScore: number;
  avgInterviewScore: number;
}

export function StatsOverview({
  resumesAnalyzed,
  interviewsCompleted,
  bestMatchScore,
  avgInterviewScore,
}: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
      <StatCard label="Resumes Analyzed" value={String(resumesAnalyzed)} />
      <StatCard label="Interviews Completed" value={String(interviewsCompleted)} />
      <StatCard label="Best Match Score" value={bestMatchScore ? `${bestMatchScore}%` : "—"} />
      <StatCard
        label="Avg Interview Score"
        value={avgInterviewScore ? `${avgInterviewScore}%` : "—"}
      />
    </div>
  );
}
