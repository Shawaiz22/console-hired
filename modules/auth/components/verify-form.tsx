"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const verifySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  code: z
    .string()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d+$/, "Verification code must contain digits only"),
});

type VerifyValues = z.infer<typeof verifySchema>;

export function VerifyForm({ initialEmail }: { initialEmail?: string }) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [serverError, setServerError] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isExhausted, setIsExhausted] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);
  const [cooldown, setCooldown] = useState(initialEmail ? 60 : 0);
  const [resendMessage, setResendMessage] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const form = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      email: initialEmail || "",
      code: "",
    },
  });

  const emailValue = useWatch({
    control: form.control,
    name: "email",
    defaultValue: initialEmail || "",
  });

  // 60-second cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function syncDigitsToForm(newDigits: string[]) {
    setDigits(newDigits);
    const code = newDigits.join("");
    form.setValue("code", code, { shouldValidate: true });
  }

  function handleDigitChange(index: number, value: string) {
    if (isExhausted) return;
    setServerError("");
    setResendMessage("");

    const cleanValue = value.replace(/\D/g, "");
    const lastChar = cleanValue.slice(-1);

    const newDigits = [...digits];
    newDigits[index] = lastChar;
    syncDigitsToForm(newDigits);

    if (lastChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    if (isExhausted) return;

    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pastedData) return;

    const pastedDigits = pastedData.slice(0, 6).split("");
    const newDigits = ["", "", "", "", "", ""];

    pastedDigits.forEach((digit, i) => {
      newDigits[i] = digit;
    });

    syncDigitsToForm(newDigits);
    setServerError("");

    const focusIndex = Math.min(pastedDigits.length, 5);
    inputRefs.current[focusIndex]?.focus();
  }

  async function handleResend() {
    if (cooldown > 0) return;
    if (!emailValue) {
      setServerError("Please enter your email address first.");
      return;
    }
    setServerError("");
    setResendMessage("");

    try {
      const res = await fetch("/api/v1/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });

      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "Failed to resend code");
        toast.error(data.error || "Failed to resend code");
        if (data.retryAfter) {
          setCooldown(data.retryAfter);
        }
        return;
      }

      setIsExhausted(false);
      setIsEditingEmail(false);
      const resetDigits = ["", "", "", "", "", ""];
      setDigits(resetDigits);
      form.setValue("code", "");
      setAttemptsRemaining(null);
      setCooldown(60);
      const successMsg = `A new verification code has been sent to ${emailValue}.`;
      setResendMessage(successMsg);
      toast.success("New verification code sent!");
    } catch {
      const errMsg = "Could not resend code. Please try again.";
      setServerError(errMsg);
      toast.error(errMsg);
    }
  }

  async function onSubmit(values: VerifyValues) {
    setServerError("");
    setResendMessage("");

    try {
      const res = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, code: values.code }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (typeof data.attemptsRemaining === "number") {
          setAttemptsRemaining(data.attemptsRemaining);
          if (data.attemptsRemaining === 0) {
            setIsExhausted(true);
          }
        }
        if (
          res.status === 429 ||
          data.error?.includes("expired") ||
          data.error?.includes("Too many")
        ) {
          setIsExhausted(true);
        }
        setServerError(data.error || "Verification failed");
        toast.error(data.error || "Verification failed");
        return;
      }

      toast.success("Email verified successfully! You can now log in.");
      router.push(`/login?verified=true&email=${encodeURIComponent(values.email)}`);
    } catch {
      const errMsg = "Verification request failed. Please try again.";
      setServerError(errMsg);
      toast.error(errMsg);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-tight">Verify your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {emailValue && !isEditingEmail ? (
            <span>
              We sent a 6-digit code to <strong className="text-foreground">{emailValue}</strong>
              <button
                type="button"
                onClick={() => setIsEditingEmail(true)}
                className="ml-2 text-xs font-medium text-primary underline underline-offset-4 hover:opacity-80"
              >
                Change email
              </button>
            </span>
          ) : (
            "Enter your email and the 6-digit code sent to you."
          )}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {isEditingEmail && (
          <Field data-invalid={!!form.formState.errors.email}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="email">Email Address</FieldLabel>
              {initialEmail && (
                <button
                  type="button"
                  onClick={() => setIsEditingEmail(false)}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Cancel
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                aria-required="true"
                aria-invalid={!!form.formState.errors.email}
                {...form.register("email")}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResend}
                disabled={cooldown > 0 || !emailValue}
                className="shrink-0"
              >
                {cooldown > 0 ? `${cooldown}s` : "Send code"}
              </Button>
            </div>
            <FieldError errors={[form.formState.errors.email]} />
          </Field>
        )}

        {isExhausted ? (
          <div
            role="alert"
            className="rounded-md bg-destructive/15 p-4 text-center text-sm text-destructive"
          >
            Code expired or maximum attempts reached. Please request a new code.
          </div>
        ) : (
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.code}>
              <FieldLabel id="otp-label">Verification Code</FieldLabel>
              <div role="group" aria-labelledby="otp-label" className="flex justify-between gap-2">
                {digits.map((digit, idx) => (
                  <Input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    aria-label={`Digit ${idx + 1} of 6`}
                    aria-required="true"
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    className="h-12 w-12 text-center text-lg font-bold"
                  />
                ))}
              </div>
              <FieldError errors={[form.formState.errors.code]} />
            </Field>
          </FieldGroup>
        )}

        {serverError && (
          <div role="alert" className="text-center text-sm text-destructive">
            {serverError}
            {attemptsRemaining !== null && attemptsRemaining > 0 && (
              <span className="mt-1 block text-xs">
                {attemptsRemaining} {attemptsRemaining === 1 ? "attempt" : "attempts"} remaining
              </span>
            )}
          </div>
        )}

        {resendMessage && (
          <div role="status" className="text-center text-sm text-emerald-600 dark:text-emerald-400">
            {resendMessage}
          </div>
        )}

        {!isExhausted && (
          <Field>
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting || digits.join("").length < 6}
            >
              {form.formState.isSubmitting ? "Verifying..." : "Verify Code"}
            </Button>
          </Field>
        )}
      </form>

      <div className="flex flex-col items-center gap-2 pt-2 text-center text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="text-primary underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-50"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Request a new code"}
        </button>

        <Link href="/login" className="text-xs text-muted-foreground hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
