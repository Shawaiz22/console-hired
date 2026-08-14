"use client";

import { useVideoAnalysis } from "@/hooks/use-video-analysis";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Camera, CameraOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoAnalysisProps {
  enabled?: boolean;
  className?: string;
}

export function VideoAnalysis({ enabled = true, className }: VideoAnalysisProps) {
  const { videoRef, cameraActive, permissionError, analysis, startCamera } =
    useVideoAnalysis(enabled);

  return (
    <Card className={cn("overflow-hidden border border-border bg-card shadow-sm", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Video Preview Container */}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-950 flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className={cn(
              "h-full w-full object-cover -scale-x-100 transition-opacity duration-300",
              cameraActive ? "opacity-100" : "opacity-0"
            )}
          />

          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-slate-400 space-y-3 bg-slate-900/90">
              <CameraOff className="size-10 text-muted-foreground" />
              {permissionError ? (
                <div className="space-y-2">
                  <p className="text-xs text-destructive font-medium">{permissionError}</p>
                  <button
                    onClick={startCamera}
                    className="text-xs underline text-primary hover:text-primary/80"
                  >
                    Grant Camera Access
                  </button>
                </div>
              ) : (
                <p className="text-xs">Initializing webcam feed...</p>
              )}
            </div>
          )}

          {/* Top Overlay Badges */}
          {cameraActive && (
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
              <Badge
                variant="outline"
                className="bg-slate-900/80 backdrop-blur-md border-slate-700 text-slate-200 text-xs gap-1.5 py-1 px-2.5"
              >
                <Camera className="size-3.5 text-emerald-400 animate-pulse" />
                Live Analysis
              </Badge>

              <Badge
                className={cn(
                  "font-mono text-xs py-1 px-2.5 gap-1 shadow-sm backdrop-blur-md",
                  analysis.overallPresenceScore >= 80
                    ? "bg-emerald-500/90 text-white"
                    : analysis.overallPresenceScore >= 60
                      ? "bg-amber-500/90 text-white"
                      : "bg-slate-800/90 text-slate-200"
                )}
              >
                <Sparkles className="size-3" />
                {analysis.isPersonVisible
                  ? `${analysis.overallPresenceScore}% Presence`
                  : "Searching Candidate"}
              </Badge>
            </div>
          )}

          {/* Floating Live Warning Banner */}
          {cameraActive && analysis.warningMessage && (
            <div className="absolute bottom-3 left-3 right-3 rounded-md bg-amber-500/90 backdrop-blur-md p-2 text-center text-xs font-medium text-white shadow-md animate-fade-in flex items-center justify-center gap-1.5">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{analysis.warningMessage}</span>
            </div>
          )}
        </div>

        {/* Live Visual Indicators & Real-Time Status Chips */}
        {cameraActive && (
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="rounded-md border border-border/60 bg-muted/30 p-2 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Posture
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[11px] font-medium px-2 py-0.5",
                  analysis.postureStatus === "UPRIGHT"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                )}
              >
                {analysis.postureStatus.replace("_", " ")}
              </Badge>
            </div>

            <div className="rounded-md border border-border/60 bg-muted/30 p-2 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Position
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[11px] font-medium px-2 py-0.5",
                  analysis.positionStatus === "CENTERED"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                )}
              >
                {analysis.positionStatus.replace("_", " ")}
              </Badge>
            </div>

            <div className="rounded-md border border-border/60 bg-muted/30 p-2 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Stability
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[11px] font-medium px-2 py-0.5",
                  analysis.movementStatus === "STABLE"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                )}
              >
                {analysis.movementStatus}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
