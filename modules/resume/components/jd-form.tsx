"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FileDropzone } from "./file-dropzone";

const jdSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  rawText: z.string().optional(),
});

type JDFormValues = z.infer<typeof jdSchema>;

interface JDFormProps {
  resumeId: string;
  onSuccess: (analysisId: string) => void;
  onBack: () => void;
}

export function JDForm({ resumeId, onSuccess, onBack }: JDFormProps) {
  const [mode, setMode] = useState<"text" | "file">("text");
  const [file, setFile] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<JDFormValues>({
    resolver: zodResolver(jdSchema),
    defaultValues: {
      title: "",
      company: "",
      rawText: "",
    },
  });

  const rawTextValue =
    useWatch({
      control: form.control,
      name: "rawText",
      defaultValue: "",
    }) || "";

  async function onSubmit(values: JDFormValues) {
    setServerError(null);

    if (mode === "text" && rawTextValue.trim().length < 100) {
      const msg = "Job description text must be at least 100 characters.";
      form.setError("rawText", { message: msg });
      toast.error(msg);
      return;
    }

    if (mode === "file" && !file) {
      const msg = "Please select a job description file.";
      setServerError(msg);
      toast.error(msg);
      return;
    }

    try {
      let jdRes: Response;

      if (mode === "file" && file) {
        const formData = new FormData();
        formData.append("file", file);
        if (values.title) formData.append("title", values.title);
        if (values.company) formData.append("company", values.company);

        jdRes = await fetch("/api/v1/job-descriptions", {
          method: "POST",
          body: formData,
        });
      } else {
        jdRes = await fetch("/api/v1/job-descriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawText: values.rawText,
            title: values.title || undefined,
            company: values.company || undefined,
          }),
        });
      }

      const jdData = await jdRes.json();

      if (!jdRes.ok) {
        const msg = jdData.error || "Failed to process job description";
        setServerError(msg);
        toast.error(msg);
        return;
      }

      const jobDescriptionId = jdData.jobDescription?.id;

      // Trigger analysis creation
      const analysisRes = await fetch("/api/v1/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, jobDescriptionId }),
      });

      const analysisData = await analysisRes.json();

      if (!analysisRes.ok) {
        const msg = analysisData.error || "Failed to start analysis";
        setServerError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Job description saved! Starting analysis...");
      onSuccess(analysisData.analysis?.id || analysisData.id);
    } catch {
      const msg = "An error occurred while analyzing. Please try again.";
      setServerError(msg);
      toast.error(msg);
    }
  }

  const charCount = rawTextValue.trim().length;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Step 2: Add Job Description</h2>
          <p className="text-sm text-muted-foreground">
            Paste the target job description or upload a document file.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setMode(mode === "text" ? "file" : "text");
            setServerError(null);
          }}
        >
          {mode === "text" ? "Upload File Instead" : "Paste Text Instead"}
        </Button>
      </div>

      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!form.formState.errors.title}>
            <FieldLabel htmlFor="title">Job Title (Optional)</FieldLabel>
            <Input
              id="title"
              placeholder="e.g. Senior Frontend Engineer"
              disabled={form.formState.isSubmitting}
              {...form.register("title")}
            />
            <FieldError errors={[form.formState.errors.title]} />
          </Field>

          <Field data-invalid={!!form.formState.errors.company}>
            <FieldLabel htmlFor="company">Company (Optional)</FieldLabel>
            <Input
              id="company"
              placeholder="e.g. Acme Corp"
              disabled={form.formState.isSubmitting}
              {...form.register("company")}
            />
            <FieldError errors={[form.formState.errors.company]} />
          </Field>
        </div>

        {mode === "text" ? (
          <Field data-invalid={!!form.formState.errors.rawText}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="rawText">Job Description Text</FieldLabel>
              <span className="text-xs text-muted-foreground">{charCount} / 100 min chars</span>
            </div>
            <textarea
              id="rawText"
              rows={8}
              placeholder="Paste the full job description here (minimum 100 characters)..."
              disabled={form.formState.isSubmitting}
              className="flex min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
              {...form.register("rawText")}
            />
            <FieldError errors={[form.formState.errors.rawText]} />
          </Field>
        ) : (
          <Field>
            <FieldLabel>Job Description File</FieldLabel>
            <FileDropzone
              selectedFile={file}
              onFileSelect={setFile}
              disabled={form.formState.isSubmitting}
            />
          </Field>
        )}
      </FieldGroup>

      {serverError && (
        <div role="alert" className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={form.formState.isSubmitting}
        >
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Starting Analysis..." : "Start Analysis"}
        </Button>
      </div>
    </form>
  );
}
