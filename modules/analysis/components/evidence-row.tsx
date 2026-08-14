import { CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type EvidenceItem } from "../schemas/analysis.schema";

interface EvidenceRowProps {
  item: EvidenceItem;
}

export function EvidenceRow({ item }: EvidenceRowProps) {
  const isStrong = item.status === "strong";
  const isPartial = item.status === "partial";
  const isMissing = item.status === "missing";

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {isStrong && <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />}
          {isPartial && <MinusCircle className="mt-0.5 size-5 shrink-0 text-amber-500" />}
          {isMissing && <XCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />}

          <span className="text-sm font-medium leading-snug">{item.requirement}</span>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "shrink-0 font-mono text-[11px] capitalize",
            isStrong &&
              "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            isPartial && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
            isMissing && "border-muted bg-muted/50 text-muted-foreground"
          )}
        >
          {item.status}
        </Badge>
      </div>

      <div className="pl-7 font-mono text-xs text-muted-foreground">
        {item.matchedBullet ? (
          <p className="border-l-2 border-primary/40 py-0.5 pl-3 italic text-foreground/90">
            └ &quot;{item.matchedBullet}&quot;
          </p>
        ) : (
          <p className="border-l-2 border-muted py-0.5 pl-3 text-muted-foreground/70">
            └ No evidence found in your resume
          </p>
        )}
      </div>
    </div>
  );
}
