"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResumeUploadSchema, type ResumeUploadValues } from "../schemas/resume.schema";
import { FileDropzone } from "./file-dropzone";

interface UploadFormProps {
  onSuccess: (resume: { id: string; fileName: string }) => void;
}

export function UploadForm({ onSuccess }: UploadFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ResumeUploadValues>({
    resolver: zodResolver(ResumeUploadSchema),
  });

  const isUploading = form.formState.isSubmitting;

  async function onSubmit(values: ResumeUploadValues) {
    setServerError(null);

    try {
      const formData = new FormData();
      formData.append("file", values.file);

      const res = await fetch("/api/v1/resumes", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // Show server error (e.g. 422 NO_TEXT_LAYER) verbatim
        const message = data.error || "Failed to upload file";
        setServerError(message);
        toast.error(message);
        return;
      }

      toast.success("Resume uploaded and text extracted successfully!");
      onSuccess(data.resume);
    } catch {
      const message = "An error occurred while uploading. Please try again.";
      setServerError(message);
      toast.error(message);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div>
        <h2 className="text-lg font-semibold">Step 1: Upload your resume</h2>
        <p className="text-sm text-muted-foreground">
          Upload your resume in PDF or DOCX format to begin analysis.
        </p>
      </div>

      <Controller
        control={form.control}
        name="file"
        render={({ field, fieldState }) => (
          <FileDropzone
            selectedFile={field.value ?? null}
            onFileSelect={(file) => field.onChange(file ?? undefined)}
            error={fieldState.error?.message ?? serverError}
            disabled={isUploading}
          />
        )}
      />

      <Button type="submit" className="w-full" disabled={isUploading}>
        {isUploading ? "Uploading & Extracting..." : "Continue to Job Description"}
      </Button>
    </form>
  );
}
