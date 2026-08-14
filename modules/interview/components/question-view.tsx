"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ChevronDown, ChevronUp, HelpCircle, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  AnswerFormSchema,
  MIN_ANSWER_LENGTH,
  type AnswerFormValues,
  type InterviewQuestion,
} from "../schemas/interview.schema";
import { useAudioPlayer } from "../hooks/use-audio-player";
import { useSpeech } from "../utils/use-speech";

interface QuestionViewProps {
  question: InterviewQuestion;
  questionIndex: number;
  totalQuestions: number;
  onSubmitAnswer: (answerText: string, inputMode?: "text" | "voice") => Promise<void>;
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

  const lastPlayedQuestionIdRef = useRef<string | null>(null);

  // Auto-play question audio when a new question arrives (if not muted)
  useEffect(() => {
    if (!question?.id || isMuted) return;

    if (lastPlayedQuestionIdRef.current !== question.id) {
      lastPlayedQuestionIdRef.current = question.id;
      playText(question.question);
    }
  }, [question?.id, question?.question, isMuted, playText]);

  const handleMicToggle = () => {
    stopAudio(); // Silence any audio playback before user speaks into the mic
    toggleMic();
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
    }
    stopAudio();
    await onSubmitAnswer(values.answerText, inputMode);
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="space-y-6 p-6">
        {/* Progress Bar Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">
              Question {questionIndex + 1} of {totalQuestions}
            </span>
            <div className="flex items-center gap-2">
              {/* TTS Controls Toolbar */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => (isSpeaking ? stopAudio() : playText(question.question, true))}
                  className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  title={isSpeaking ? "Stop AI audio" : "Read question aloud"}
                >
                  <Volume2 className={cn("size-3.5", isSpeaking && "text-primary animate-pulse")} />
                  <span className="hidden sm:inline">
                    {isSpeaking ? "Reading..." : "Read Aloud"}
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="h-6 px-1.5 text-muted-foreground hover:text-foreground"
                  title={isMuted ? "Unmute question audio" : "Mute question audio"}
                >
                  {isMuted ? (
                    <VolumeX className="size-3.5 text-destructive" />
                  ) : (
                    <Volume2 className="size-3.5 text-muted-foreground" />
                  )}
                </Button>
              </div>

              <Badge
                variant="outline"
                className={cn(
                  "capitalize font-mono text-[11px]",
                  isTechnical
                    ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                    : "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                )}
              >
                {question.type} • {question.targetSkill}
              </Badge>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Text */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold leading-snug tracking-tight flex-1">
              {question.question}
            </h2>
          </div>

          {/* Collapsible Why Asked */}
          <div className="rounded-lg border border-border bg-muted/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowWhyAsked(!showWhyAsked)}
              className="flex w-full items-center justify-between p-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <div className="flex items-center gap-1.5">
                <HelpCircle className="size-4 text-primary" />
                <span>Why this question?</span>
              </div>
              {showWhyAsked ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>

            {showWhyAsked && (
              <div className="border-t border-border p-3 text-xs text-muted-foreground bg-card">
                {question.whyAsked}
              </div>
            )}
          </div>
        </div>

        {/* Response Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label htmlFor="answerText" className="text-xs font-semibold text-foreground">
                  Your Answer
                </label>
                {inputMode === "voice" && (
                  <Badge variant="secondary" className="text-[10px] font-medium py-0 px-1.5">
                    Voice Dictated
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Voice Input Action Button (Hidden when Web Speech is unsupported) */}
                {supported && (
                  <Button
                    type="button"
                    variant={listening ? "destructive" : "outline"}
                    size="sm"
                    onClick={handleMicToggle}
                    disabled={isSubmitting}
                    className={cn(
                      "h-7 gap-1.5 px-2.5 text-xs transition-all",
                      listening && "animate-pulse ring-2 ring-destructive/40"
                    )}
                  >
                    {listening ? (
                      <>
                        <span className="size-2 rounded-full bg-white animate-ping" />
                        <MicOff className="size-3.5" />
                        <span>Stop Voice</span>
                      </>
                    ) : (
                      <>
                        <Mic className="size-3.5 text-primary" />
                        <span>Voice Input</span>
                      </>
                    )}
                  </Button>
                )}
                <span className="text-xs text-muted-foreground">
                  {charCount} / {MIN_ANSWER_LENGTH} min chars
                </span>
              </div>
            </div>

            {/* Active Listening Status Banner */}
            {listening && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive">
                <span className="size-2 rounded-full bg-destructive animate-pulse" />
                <span>Listening actively... Speak your response clearly.</span>
              </div>
            )}

            <textarea
              id="answerText"
              rows={6}
              {...form.register("answerText")}
              placeholder="Type or speak your response here. Include specific details, metrics, and technologies..."
              disabled={isSubmitting}
              aria-invalid={Boolean(form.formState.errors.answerText)}
              className={cn(
                "flex min-h-35 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
                listening && "border-destructive/50 ring-1 ring-destructive/30"
              )}
            />
            {form.formState.errors.answerText && (
              <FieldError>{form.formState.errors.answerText.message}</FieldError>
            )}
          </Field>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || charCount < MIN_ANSWER_LENGTH}
          >
            {isSubmitting ? "Evaluating Answer..." : "Submit Answer & View Feedback"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
