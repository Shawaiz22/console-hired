"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FileDropzone } from "./file-dropzone";

interface JDFormProps {
  resumeId: string;
  onSuccess: (analysisId: string) => void;
  onBack: () => void;
}

export function JDForm({ resumeId, onSuccess, onBack }: JDFormProps) {
  const [mode, setMode] = useState<"text" | "file">("text");
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "text" && rawText.trim().length < 100) {
      const msg = "Job description is too short to analyse.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (mode === "file" && !file) {
      const msg = "Please select a job description file.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);

    try {
      let jdRes: Response;

      if (mode === "file" && file) {
        const formData = new FormData();
        formData.append("file", file);
        if (title) formData.append("title", title);
        if (company) formData.append("company", company);

        jdRes = await fetch("/api/v1/job-descriptions", {
          method: "POST",
          body: formData,
        });
      } else {
        jdRes = await fetch("/api/v1/job-descriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawText,
            title: title || undefined,
            company: company || undefined,
          }),
        });
      }

      const jdData = await jdRes.json();

      if (!jdRes.ok) {
        const msg = jdData.error || "Failed to process job description";
        setError(msg);
        toast.error(msg);
        setIsSubmitting(false);
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
        setError(msg);
        toast.error(msg);
        setIsSubmitting(false);
        return;
      }

      toast.success("Job description saved! Starting analysis...");
      onSuccess(analysisData.analysis?.id || analysisData.id);
    } catch {
      const msg = "An error occurred while analyzing. Please try again.";
      setError(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  }

  const charCount = rawText.trim().length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            setError(null);
          }}
        >
          {mode === "text" ? "Upload File Instead" : "Paste Text Instead"}
        </Button>
      </div>

      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="title">Job Title (Optional)</FieldLabel>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              disabled={isSubmitting}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="company">Company (Optional)</FieldLabel>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp"
              disabled={isSubmitting}
            />
          </Field>
        </div>

        {mode === "text" ? (
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="rawText">Job Description Text</FieldLabel>
              <span className="text-xs text-muted-foreground">{charCount} / 100 min chars</span>
            </div>
            <textarea
              id="rawText"
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste the full job description here (minimum 100 characters)..."
              disabled={isSubmitting}
              className="flex min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
            />
          </Field>
        ) : (
          <Field>
            <FieldLabel>Job Description File</FieldLabel>
            <FileDropzone selectedFile={file} onFileSelect={setFile} disabled={isSubmitting} />
          </Field>
        )}
      </FieldGroup>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "Starting Analysis..." : "Start Analysis"}
        </Button>
      </div>
    </form>
  );
}
