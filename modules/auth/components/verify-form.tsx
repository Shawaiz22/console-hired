"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function VerifyForm({ initialEmail }: { initialEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail || "");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isExhausted, setIsExhausted] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [resendMessage, setResendMessage] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function handleDigitChange(index: number, value: string) {
    if (isExhausted) return;
    setServerError("");
    setResendMessage("");

    const cleanValue = value.replace(/\D/g, "");
    const lastChar = cleanValue.slice(-1);

    const newDigits = [...digits];
    newDigits[index] = lastChar;
    setDigits(newDigits);

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

    setDigits(newDigits);
    setServerError("");

    const focusIndex = Math.min(pastedDigits.length, 5);
    inputRefs.current[focusIndex]?.focus();
  }

  async function handleResend() {
    if (cooldown > 0 || !email) return;
    setServerError("");
    setResendMessage("");

    try {
      const res = await fetch("/api/v1/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
      setDigits(["", "", "", "", "", ""]);
      setAttemptsRemaining(null);
      setCooldown(60);
      const successMsg = "A new verification code has been sent to your email.";
      setResendMessage(successMsg);
      toast.success("New verification code sent!");
    } catch {
      const errMsg = "Could not resend code. Please try again.";
      setServerError(errMsg);
      toast.error(errMsg);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) {
      setServerError("Please enter all 6 digits.");
      return;
    }

    if (!email) {
      setServerError("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    setServerError("");
    setResendMessage("");

    try {
      const res = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
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
        setIsSubmitting(false);
        return;
      }

      toast.success("Email verified successfully! You can now log in.");
      router.push("/login?verified=true");
    } catch {
      const errMsg = "Verification request failed. Please try again.";
      setServerError(errMsg);
      toast.error(errMsg);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-tight">Verify your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {email ? (
            <>
              We sent a 6-digit code to <strong className="text-foreground">{email}</strong>
            </>
          ) : (
            "Enter your email and the 6-digit code sent to you."
          )}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {!initialEmail && (
          <Field>
            <FieldLabel htmlFor="email">Email Address</FieldLabel>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </Field>
        )}

        {isExhausted ? (
          <div className="rounded-md bg-destructive/15 p-4 text-center text-sm text-destructive">
            Code expired or maximum attempts reached. Please request a new code.
          </div>
        ) : (
          <FieldGroup>
            <Field>
              <FieldLabel>Verification Code</FieldLabel>
              <div className="flex justify-between gap-2">
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
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    className="h-12 w-12 text-center text-lg font-bold"
                  />
                ))}
              </div>
            </Field>
          </FieldGroup>
        )}

        {serverError && (
          <div className="text-center text-sm text-destructive">
            {serverError}
            {attemptsRemaining !== null && attemptsRemaining > 0 && (
              <span className="mt-1 block text-xs">
                {attemptsRemaining} {attemptsRemaining === 1 ? "attempt" : "attempts"} remaining
              </span>
            )}
          </div>
        )}

        {resendMessage && (
          <div className="text-center text-sm text-emerald-600 dark:text-emerald-400">
            {resendMessage}
          </div>
        )}

        {!isExhausted && (
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || digits.join("").length < 6}
          >
            {isSubmitting ? "Verifying..." : "Verify Code"}
          </Button>
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
