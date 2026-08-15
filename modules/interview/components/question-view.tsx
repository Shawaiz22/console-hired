"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AiAvatar } from "./ai-avatar";
import { cn } from "@/lib/utils";
import {
  AnswerFormSchema,
  MIN_ANSWER_LENGTH,
  type AnswerFormValues,
  type InterviewQuestion,
} from "../schemas/interview.schema";
import { useAudioPlayer } from "../hooks/use-audio-player";
import { useSpeech } from "../utils/use-speech";
import { useAudioRecorder, type CapturedAudio } from "../utils/use-audio-recorder";

interface QuestionViewProps {
  question: InterviewQuestion;
  questionIndex: number;
  totalQuestions: number;
  onSubmitAnswer: (
    answerText: string,
    inputMode?: "text" | "voice",
    audio?: CapturedAudio
  ) => Promise<void>;
  isSubmitting: boolean;
}

export function QuestionView({
  question,
  questionIndex,
  totalQuestions = 6,
  onSubmitAnswer,
  isSubmitting,
}: QuestionViewProps) {
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [showWhyAsked, setShowWhyAsked] = useState(false);

  const isTechnical = question.type === "technical";
  const progressPercent = Math.round(((questionIndex + 1) / totalQuestions) * 100);

  const form = useForm<AnswerFormValues>({
    resolver: zodResolver(AnswerFormSchema),
    defaultValues: { answerText: "" },
  });

  const { isSpeaking, isMuted, toggleMute, playText, stop: stopAudio } = useAudioPlayer();

  const {
    listening,
    supported,
    toggle: toggleMic,
    stop: stopMic,
  } = useSpeech(
    (transcript) => {
      form.setValue("answerText", transcript, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      setInputMode("voice");
    },
    { lang: "en-IN", continuous: true, interimResults: true }
  );

  // Same take as the transcript above: Web Speech owns its own mic handle, so the
  // recorder opens a second one. The browser prompts once per origin, not once per hook.
  const recorder = useAudioRecorder();
  const capturedAudioRef = useRef<CapturedAudio | null>(null);
  // The transcript as it stood when recording stopped; typed edits after that would
  // make words-per-minute describe text the recording does not contain.
  const capturedTranscriptRef = useRef<string | null>(null);

  const lastPlayedQuestionIdRef = useRef<string | null>(null);

  // Auto-play question audio when a new question arrives (if not muted)
  useEffect(() => {
    if (!question?.id || isMuted) return;

    if (lastPlayedQuestionIdRef.current !== question.id) {
      lastPlayedQuestionIdRef.current = question.id;
      playText(question.question);
    }
  }, [question?.id, question?.question, isMuted, playText]);

  const handleMicToggle = async () => {
    stopAudio();

    if (listening) {
      stopMic();
      capturedAudioRef.current = await recorder.stop();
      capturedTranscriptRef.current = form.getValues("answerText");
      return;
    }

    // A fresh take replaces the last one, so the audio and transcript stay in step
    capturedAudioRef.current = null;
    capturedTranscriptRef.current = null;
    toggleMic();
    await recorder.start();
  };

  const answerText = useWatch({
    control: form.control,
    name: "answerText",
    defaultValue: "",
  });

  const charCount = answerText.trim().length;

  async function onSubmit(values: AnswerFormValues) {
    if (listening) {
      stopMic();
      capturedAudioRef.current = await recorder.stop();
      capturedTranscriptRef.current = values.answerText;
    }
    stopAudio();

    // Send audio only when it matches what is being submitted; delivery scored against
    // a transcript the candidate has since rewritten would be a number about nothing
    const audio =
      inputMode === "voice" &&
      capturedAudioRef.current &&
      capturedTranscriptRef.current?.trim() === values.answerText.trim()
        ? capturedAudioRef.current
        : undefined;

    await onSubmitAnswer(values.answerText, inputMode, audio);
  }

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { ref: formTextareaRef, ...formTextareaProps } = form.register("answerText");

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [answerText]);

  return (
    <div className="relative h-full max-h-full w-full rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 shadow-xl overflow-hidden flex flex-col justify-between p-3 sm:p-4 transition-colors">
      <div className="relative z-20 flex items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-2.5 px-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <span className="flex size-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Live AI Interview Studio
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={cn(
              "capitalize font-mono text-[11px] py-0.5 px-2.5",
              isTechnical
                ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400"
            )}
          >
            {question.type} • {question.targetSkill}
          </Badge>

          <div className="hidden sm:flex items-center gap-2 w-28">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-500">{progressPercent}%</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="size-8 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-transform hover:scale-105"
            title={isMuted ? "Unmute AI Interviewer Audio" : "Mute AI Interviewer Audio"}
            aria-label={isMuted ? "Unmute AI Interviewer Audio" : "Mute AI Interviewer Audio"}
          >
            {isMuted ? (
              <VolumeX className="size-4 text-red-500 animate-pulse" />
            ) : (
              <Volume2 className="size-4 text-blue-600 dark:text-blue-400" />
            )}
          </Button>
        </div>
      </div>

      <div className="relative z-10 my-auto flex flex-col items-center justify-center w-full max-w-xl mx-auto py-1">
        <AiAvatar
          isSpeaking={isSpeaking}
          isListening={listening}
          isThinking={isSubmitting}
          questionText={question.question}
          questionIndex={questionIndex}
          totalQuestions={totalQuestions}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onReplayAudio={() => playText(question.question, true)}
        />

        <div className="w-full max-w-lg mt-2">
          <button
            type="button"
            onClick={() => setShowWhyAsked(!showWhyAsked)}
            className="flex items-center justify-center gap-1.5 mx-auto text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors py-0.5"
            aria-expanded={showWhyAsked}
          >
            <HelpCircle className="size-3 text-blue-500" />
            <span>Why is the interviewer asking this?</span>
            {showWhyAsked ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>

          {showWhyAsked && (
            <div className="mt-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 shadow-xs text-center max-h-20 overflow-y-auto">
              {question.whyAsked}
            </div>
          )}
        </div>
      </div>

      <div className="relative z-20 w-full max-w-xl mx-auto space-y-1.5 pt-0.5">
        {/* Bound in the handler, not during render: onSubmit reads the capture refs */}
        <form onSubmit={(e) => form.handleSubmit(onSubmit)(e)} className="space-y-1.5">
          <div
            className={cn(
              "flex items-end justify-between gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 p-2 px-3 sm:px-4 shadow-2xl transition-all duration-300",
              charCount > 60 ? "rounded-2xl" : "rounded-full"
            )}
          >
            <div className="flex-1 min-w-0 flex items-center">
              <textarea
                rows={1}
                {...formTextareaProps}
                ref={(e) => {
                  formTextareaRef(e);
                  textareaRef.current = e;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isSubmitting && charCount >= MIN_ANSWER_LENGTH) {
                      form.handleSubmit(onSubmit)();
                    }
                  }
                }}
                placeholder={
                  listening ? "Listening to your voice..." : "Type or speak your answer..."
                }
                disabled={isSubmitting}
                aria-label="Interview response answer"
                className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none border-none px-1 py-1 resize-none min-h-[36px] max-h-28 overflow-y-auto leading-relaxed transition-all duration-150"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 pb-0.5">
              {charCount > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-mono",
                    charCount < MIN_ANSWER_LENGTH
                      ? "text-amber-500/90 dark:text-amber-400/90"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {charCount}/{MIN_ANSWER_LENGTH} chars
                </span>
              )}

              {supported && (
                <Button
                  type="button"
                  variant={listening ? "destructive" : "ghost"}
                  size="icon"
                  onClick={() => void handleMicToggle()}
                  disabled={isSubmitting}
                  className={cn(
                    "size-9 rounded-full transition-all text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                    listening &&
                      "bg-red-600 hover:bg-red-700 text-white animate-pulse ring-4 ring-red-500/30"
                  )}
                  title={listening ? "Stop Voice Dictation" : "Start Voice Dictation"}
                  aria-label={listening ? "Stop Voice Dictation" : "Start Voice Dictation"}
                >
                  {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </Button>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || charCount < MIN_ANSWER_LENGTH}
                size="icon"
                className="size-9 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 disabled:opacity-40 transition-all shadow-md"
                title="Submit Answer"
                aria-label="Submit Answer"
              >
                {isSubmitting ? (
                  <Sparkles className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          </div>

          {listening && (
            <div className="flex items-center justify-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-fade-in max-w-md mx-auto">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              <span>
                Voice Dictation Active... Speak your response clearly into your mic.
                {recorder.recording && " Audio is being recorded for delivery analysis."}
              </span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
