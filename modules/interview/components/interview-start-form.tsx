"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

interface Option {
  id: string;
  label: string;
}

export function InterviewStartForm() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Option[]>([]);
  const [jds, setJds] = useState<Option[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedJdId, setSelectedJdId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [resumesRes, jdsRes] = await Promise.all([
          fetch("/api/v1/resumes"),
          fetch("/api/v1/job-descriptions"),
        ]);

        const resumesData = await resumesRes.json();
        const jdsData = await jdsRes.json();

        const resumeOpts: Option[] = (resumesData.resumes || []).map(
          (r: { id: string; fileName: string }) => ({
            id: r.id,
            label: r.fileName,
          })
        );

        const jdOpts: Option[] = (jdsData.jobDescriptions || []).map(
          (j: { id: string; title?: string; company?: string; rawText: string }) => ({
            id: j.id,
            label: j.title
              ? `${j.title} ${j.company ? `(${j.company})` : ""}`
              : j.rawText.slice(0, 40) + "...",
          })
        );

        setResumes(resumeOpts);
        setJds(jdOpts);
        if (resumeOpts.length > 0) setSelectedResumeId(resumeOpts[0].id);
        if (jdOpts.length > 0) setSelectedJdId(jdOpts[0].id);
        setLoading(false);
      } catch {
        setError("Could not load your resumes and job descriptions.");
        setLoading(false);
      }
    }

    loadOptions();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedResumeId || !selectedJdId) {
      setError("Please select both a resume and a job description.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: selectedResumeId,
          jobDescriptionId: selectedJdId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start interview session");
        setIsSubmitting(false);
        return;
      }

      router.push(`/dashboard/interview/${data.session.id}`);
    } catch {
      setError("An error occurred while creating session.");
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Card className="mx-auto my-12 max-w-lg">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Loading your resumes and job descriptions...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto my-8 max-w-lg">
      <CardHeader>
        <CardTitle className="text-xl">Start AI Mock Interview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select an uploaded resume and target job description to generate 6 custom questions.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="resumeSelect">Select Resume</FieldLabel>
              {resumes.length === 0 ? (
                <p className="text-xs italic text-muted-foreground">
                  No resumes found. Please upload one in the Analyze section first.
                </p>
              ) : (
                <select
                  id="resumeSelect"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="jdSelect">Select Job Description</FieldLabel>
              {jds.length === 0 ? (
                <p className="text-xs italic text-muted-foreground">
                  No job descriptions found. Please create one in Analyze first.
                </p>
              ) : (
                <select
                  id="jdSelect"
                  value={selectedJdId}
                  onChange={(e) => setSelectedJdId(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden"
                >
                  {jds.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </FieldGroup>

          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || resumes.length === 0 || jds.length === 0}
          >
            {isSubmitting ? "Generating Questions..." : "Start Practice Session"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
