"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StartInterviewSchema, type StartInterviewValues } from "../schemas/interview.schema";

interface Option {
  id: string;
  label: string;
}

export function InterviewStartForm() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Option[]>([]);
  const [jds, setJds] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<StartInterviewValues>({
    resolver: zodResolver(StartInterviewSchema),
    defaultValues: {
      resumeId: "",
      jobDescriptionId: "",
    },
  });

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

        if (resumeOpts.length > 0 && jdOpts.length > 0) {
          form.reset({
            resumeId: resumeOpts[0].id,
            jobDescriptionId: jdOpts[0].id,
          });
        }
        setLoading(false);
      } catch {
        setServerError("Could not load your resumes and job descriptions.");
        setLoading(false);
      }
    }

    loadOptions();
  }, [form]);

  async function onSubmit(values: StartInterviewValues) {
    setServerError(null);

    try {
      const res = await fetch("/api/v1/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "Failed to start interview session");
        return;
      }

      router.push(`/dashboard/interview/${data.session.id}`);
    } catch {
      setServerError("An error occurred while creating session.");
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.resumeId}>
              <FieldLabel htmlFor="resumeSelect">Select Resume</FieldLabel>
              {resumes.length === 0 ? (
                <p className="text-xs italic text-muted-foreground">
                  No resumes found. Please upload one in the Analyze section first.
                </p>
              ) : (
                <Controller
                  name="resumeId"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="resumeSelect" className="w-full">
                        <SelectValue placeholder="Select a resume" />
                      </SelectTrigger>
                      <SelectContent>
                        {resumes.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              <FieldError errors={[form.formState.errors.resumeId]} />
            </Field>

            <Field data-invalid={!!form.formState.errors.jobDescriptionId}>
              <FieldLabel htmlFor="jdSelect">Select Job Description</FieldLabel>
              {jds.length === 0 ? (
                <p className="text-xs italic text-muted-foreground">
                  No job descriptions found. Please create one in Analyze first.
                </p>
              ) : (
                <Controller
                  name="jobDescriptionId"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="jdSelect" className="w-full">
                        <SelectValue placeholder="Select a job description" />
                      </SelectTrigger>
                      <SelectContent>
                        {jds.map((j) => (
                          <SelectItem key={j.id} value={j.id}>
                            {j.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              <FieldError errors={[form.formState.errors.jobDescriptionId]} />
            </Field>
          </FieldGroup>

          {serverError && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting || resumes.length === 0 || jds.length === 0}
          >
            {form.formState.isSubmitting ? "Generating Questions..." : "Start Practice Session"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
