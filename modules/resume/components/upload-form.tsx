"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "./file-dropzone";

interface UploadFormProps {
  onSuccess: (resume: { id: string; fileName: string }) => void;
}

export function UploadForm({ onSuccess }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/resumes", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to upload file");
        toast.error(data.error || "Failed to upload file");
        setIsUploading(false);
        return;
      }

      toast.success("Resume uploaded and text extracted successfully!");
      onSuccess(data.resume);
    } catch {
      const msg = "An error occurred while uploading. Please try again.";
      setError(msg);
      toast.error(msg);
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Step 1: Upload your resume</h2>
        <p className="text-sm text-muted-foreground">
          Upload your resume in PDF or DOCX format to begin analysis.
        </p>
      </div>

      <FileDropzone
        selectedFile={file}
        onFileSelect={setFile}
        error={error}
        disabled={isUploading}
      />

      <Button type="submit" className="w-full" disabled={!file || isUploading}>
        {isUploading ? "Uploading & Extracting..." : "Continue to Job Description"}
      </Button>
    </form>
  );
}
