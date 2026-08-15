import { Bot, Mic, Sparkles, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AvatarState = "speaking" | "listening" | "thinking" | "idle";

interface AiAvatarProps {
  avatarState?: AvatarState;
  isSpeaking: boolean;
  isListening: boolean;
  isThinking?: boolean;
  questionText?: string;
  questionIndex?: number;
  totalQuestions?: number;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onReplayAudio?: () => void;
  className?: string;
}

export function AiAvatar({
  avatarState,
  isSpeaking,
  isListening,
  isThinking = false,
  questionText,
  questionIndex,
  totalQuestions,
  isMuted = false,
  onToggleMute,
  onReplayAudio,
  className,
}: AiAvatarProps) {
  // Determine effective state
  const currentState: AvatarState =
    avatarState ||
    (isThinking ? "thinking" : isSpeaking ? "speaking" : isListening ? "listening" : "idle");

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-full space-y-2 text-center",
        className
      )}
    >
      {/* ChatGPT Voice / Gemini Live Fluid Morphing Orb Stage */}
      <div className="relative flex items-center justify-center my-1">
        {/* Ambient Pulsing Glow Backdrop */}
        <div
          className={cn(
            "absolute size-36 sm:size-48 rounded-full transition-all duration-700 blur-2xl opacity-40 pointer-events-none",
            currentState === "speaking" &&
              "bg-gradient-to-tr from-blue-400 via-indigo-500 to-cyan-300 animate-pulse scale-110",
            currentState === "listening" &&
              "bg-gradient-to-tr from-emerald-300 via-teal-400 to-cyan-400 animate-pulse scale-110",
            currentState === "thinking" &&
              "bg-gradient-to-tr from-amber-300 via-purple-400 to-indigo-500 animate-pulse scale-105",
            currentState === "idle" && "bg-gradient-to-tr from-blue-300/30 to-indigo-400/30"
          )}
        />

        {/* Outer Audio Equalizer Ring */}
        {(currentState === "speaking" || currentState === "listening") && (
          <div
            className={cn(
              "absolute size-36 sm:size-44 rounded-full border border-blue-400/30 dark:border-blue-400/20 animate-ping pointer-events-none",
              currentState === "listening" && "border-emerald-400/30"
            )}
            style={{ animationDuration: "3s" }}
          />
        )}

        {/* 3D Morphing Fluid Gradient Orb */}
        <div
          className={cn(
            "relative z-10 size-28 sm:size-36 shadow-lg transition-all duration-500 flex items-center justify-center overflow-hidden",
            currentState === "speaking" && "scale-105 shadow-blue-500/25",
            currentState === "listening" && "scale-105 shadow-emerald-500/25",
            currentState === "thinking" && "scale-98 shadow-purple-500/25"
          )}
          style={{
            background:
              currentState === "speaking"
                ? "radial-gradient(circle at 30% 30%, #a5b4fc, #6366f1 40%, #3b82f6 70%, #1d4ed8)"
                : currentState === "listening"
                  ? "radial-gradient(circle at 30% 30%, #6ee7b7, #10b981 40%, #06b6d4 70%, #0e7490)"
                  : currentState === "thinking"
                    ? "radial-gradient(circle at 30% 30%, #fde047, #a855f7 40%, #6366f1 70%, #4338ca)"
                    : "radial-gradient(circle at 30% 30%, #bfdbfe, #818cf8 40%, #6366f1 70%, #3730a3)",
            borderRadius: "45% 55% 65% 35% / 40% 50% 60% 50%",
            animation: "morphOrb 8s ease-in-out infinite alternate",
          }}
        >
          {/* Internal Fluid Shimmer Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/20 mix-blend-overlay pointer-events-none" />

          {/* Minimal State Icon Badge Inside Orb */}
          <div className="relative z-20 flex flex-col items-center justify-center text-white drop-shadow-md">
            {currentState === "speaking" && <Volume2 className="size-6 animate-pulse text-white" />}
            {currentState === "listening" && <Mic className="size-6 animate-pulse text-white" />}
            {currentState === "thinking" && <Sparkles className="size-6 animate-spin text-white" />}
            {currentState === "idle" && <Bot className="size-6 text-white/90" />}
          </div>
        </div>
      </div>

      {/* State Status Badge */}
      <div className="z-10">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] py-0 px-2.5 gap-1 font-medium rounded-full backdrop-blur-md transition-all border shadow-2xs",
            currentState === "speaking" &&
              "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 animate-pulse",
            currentState === "listening" &&
              "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 animate-pulse",
            currentState === "thinking" &&
              "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400 animate-pulse",
            currentState === "idle" && "bg-muted/80 border-border text-muted-foreground"
          )}
        >
          {currentState === "speaking" && <span>AI Interviewer Speaking...</span>}
          {currentState === "listening" && <span>Listening to Candidate...</span>}
          {currentState === "thinking" && <span>Evaluating Response...</span>}
          {currentState === "idle" && <span>AI Interviewer Ready</span>}
        </Badge>
      </div>

      {/* Question Speech Card */}
      <div className="w-full max-w-lg px-1 z-10">
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-3 shadow-sm backdrop-blur-xl space-y-1.5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="flex size-1.5 rounded-full bg-blue-500 animate-ping" />
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Question {questionIndex !== undefined ? questionIndex + 1 : 1}{" "}
                {totalQuestions ? `of ${totalQuestions}` : ""}
              </span>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center gap-1">
              {onReplayAudio && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onReplayAudio}
                  className="h-5 px-1.5 text-[10px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1 rounded-full"
                  title="Replay question audio"
                >
                  <Volume2 className="size-3 text-blue-500" />
                  <span>Replay</span>
                </Button>
              )}

              {onToggleMute && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onToggleMute}
                  className="h-5 px-1.5 text-[10px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1 rounded-full"
                  title={isMuted ? "Unmute AI Interviewer" : "Mute AI Interviewer"}
                >
                  {isMuted ? (
                    <VolumeX className="size-3 text-destructive" />
                  ) : (
                    <Volume2 className="size-3 text-slate-400" />
                  )}
                  <span>{isMuted ? "Muted" : "Mute"}</span>
                </Button>
              )}
            </div>
          </div>

          <h2 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug tracking-tight max-h-28 overflow-y-auto">
            &quot;{questionText || "Preparing question..."}&quot;
          </h2>
        </div>
      </div>

      {/* Inline Keyframes for Orb Morphing */}
      <style jsx global>{`
        @keyframes morphOrb {
          0% {
            border-radius: 45% 55% 65% 35% / 40% 50% 60% 50%;
            transform: rotate(0deg) scale(1);
          }
          33% {
            border-radius: 65% 35% 40% 60% / 55% 45% 55% 45%;
            transform: rotate(120deg) scale(1.04);
          }
          66% {
            border-radius: 35% 65% 55% 45% / 60% 40% 45% 55%;
            transform: rotate(240deg) scale(0.98);
          }
          100% {
            border-radius: 45% 55% 65% 35% / 40% 50% 60% 50%;
            transform: rotate(360deg) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
