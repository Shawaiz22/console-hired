import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepIndicator({ currentStep }: { currentStep: 1 | 2 }) {
  const steps = [
    { number: 1, title: "Resume Upload" },
    { number: 2, title: "Job Description" },
  ];

  return (
    <div className="flex items-center justify-center gap-4">
      {steps.map((step, idx) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;

        return (
          <div key={step.number} className="flex items-center gap-2">
            {idx > 0 && <div className="h-px w-12 bg-border" />}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isActive && "border-2 border-primary bg-background text-primary",
                  !isActive && !isCompleted && "border border-muted bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="size-4" /> : step.number}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
