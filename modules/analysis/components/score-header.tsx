import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type ScoreBreakdown } from "../schemas/analysis.schema";

interface ScoreHeaderProps {
  score: number;
  breakdown: ScoreBreakdown;
}

export function ScoreHeader({ score, breakdown }: ScoreHeaderProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = "stroke-emerald-500";
  let textColor = "text-emerald-500";
  let verdict = "Strong match — you are well suited for this role!";

  if (score < 50) {
    strokeColor = "stroke-amber-500";
    textColor = "text-amber-500";
    verdict = "Foundational match — focus on addressing key skill gaps.";
  } else if (score <= 75) {
    strokeColor = "stroke-blue-500";
    textColor = "text-blue-500";
    verdict = "Solid match — a few gaps worth closing before you apply.";
  }

  const breakdownItems = [
    { label: "Skill Coverage", value: breakdown.skillCoverage },
    { label: "Experience Fit", value: breakdown.experienceFit },
    { label: "Responsibility Evidence", value: breakdown.responsibilityEvidence },
    { label: "ATS Hygiene", value: breakdown.atsHygiene },
  ];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-12 md:items-center">
          <div className="flex flex-col items-center justify-center md:col-span-4">
            <div className="relative flex size-36 items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="stroke-muted"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className={cn("transition-all duration-1000 ease-out", strokeColor)}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className={cn("text-4xl font-extrabold tracking-tight", textColor)}>
                  {score}%
                </span>
                <span className="text-xs font-medium text-muted-foreground">Match Score</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 md:col-span-8">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Overall Match Verdict</h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{verdict}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {breakdownItems.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.value}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        strokeColor.replace("stroke-", "bg-")
                      )}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
