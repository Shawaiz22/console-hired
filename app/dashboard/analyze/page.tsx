"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { JDForm } from "@/modules/resume/components/jd-form";
import { StepIndicator } from "@/modules/resume/components/step-indicator";
import { UploadForm } from "@/modules/resume/components/upload-form";

export default function AnalyzePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [resume, setResume] = useState<{ id: string; fileName: string } | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6">
      <StepIndicator currentStep={step} />

      <Card>
        <CardContent className="p-6">
          {step === 1 ? (
            <UploadForm
              onSuccess={(uploadedResume) => {
                setResume(uploadedResume);
                setStep(2);
              }}
            />
          ) : (
            <JDForm
              resumeId={resume?.id || ""}
              onBack={() => setStep(1)}
              onSuccess={(analysisId) => {
                router.push(`/dashboard/analysis/${analysisId}`);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
