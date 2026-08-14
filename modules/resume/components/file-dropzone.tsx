"use client";

import { useState } from "react";
import { AlertCircle, FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_UPLOAD_BYTES, isAcceptedUpload } from "../schemas/resume.schema";

interface FileDropzoneProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  error?: string | null;
  disabled?: boolean;
}

export function FileDropzone({
  onFileSelect,
  selectedFile,
  error,
  disabled = false,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  function validateAndSelect(file: File) {
    setClientError(null);

    if (!isAcceptedUpload(file)) {
      setClientError("Only PDF and DOCX files are supported.");
      onFileSelect(null);
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setClientError("File must be under 5MB");
      onFileSelect(null);
      return;
    }

    onFileSelect(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const displayError = clientError || error;

  return (
    <div className="space-y-3">
      {selectedFile ? (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <FileText className="size-8 text-primary" />
            <div>
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => {
              setClientError(null);
              onFileSelect(null);
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            disabled && "pointer-events-none opacity-60"
          )}
        >
          <Upload className="mb-3 size-8 text-muted-foreground" />
          <p className="text-sm font-medium">Drag & drop your resume file here</p>
          <p className="mt-1 text-xs text-muted-foreground">PDF or DOCX (max 5MB)</p>
          <label className="mt-4 cursor-pointer">
            <Button type="button" variant="outline" size="sm" disabled={disabled} asChild>
              <span>Browse File</span>
            </Button>
            <input
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              disabled={disabled}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  validateAndSelect(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>
      )}

      {displayError && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
