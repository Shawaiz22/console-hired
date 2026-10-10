"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { loginSchema, type LoginValues } from "../schemas/login-schema";
import { GoogleAuthButton } from "./google-auth-button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState("");
  const [isUnverified, setIsUnverified] = useState(false);

  const isVerified = searchParams.get("verified") === "true";
  const emailParam = searchParams.get("email") || "";

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: emailParam, password: "" },
  });

  useEffect(() => {
    if (emailParam) {
      form.setValue("email", emailParam);
    }
  }, [emailParam, form]);

  async function onSubmit(values: LoginValues) {
    setServerError("");
    setIsUnverified(false);

    const res = await signIn("credentials", { ...values, redirect: false });

    if (res?.error) {
      if (res?.code === "email_not_verified") {
        setServerError("Your email is not verified yet. Please enter your verification code.");
        setIsUnverified(true);
      } else {
        setServerError("Invalid email or password");
      }
      return;
    }

    router.push("/dashboard");
  }

  return (
    <>
      {isVerified && (
        <div
          role="status"
          className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400"
        >
          ✓ Email verified successfully! Log in to access your dashboard.
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field data-invalid={!!form.formState.errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" {...form.register("email")} />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>
          <Field data-invalid={!!form.formState.errors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" type="password" {...form.register("password")} />
            <FieldError errors={[form.formState.errors.password]} />
          </Field>
          {serverError && (
            <div className="space-y-1">
              <FieldError>{serverError}</FieldError>
              {isUnverified && (
                <div className="text-center">
                  <Link
                    href={`/verify?email=${encodeURIComponent(form.getValues("email"))}`}
                    className="text-xs font-semibold text-primary underline underline-offset-4"
                  >
                    Click here to verify your email now →
                  </Link>
                </div>
              )}
            </div>
          )}
          <Field>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Logging in..." : "Log in"}
            </Button>
          </Field>
          <FieldSeparator>or</FieldSeparator>
          <Field>
            <GoogleAuthButton label="Sign in with Google" />
          </Field>
        </FieldGroup>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Registered but didn&apos;t verify?{" "}
        <Link
          href={
            form.getValues("email")
              ? `/verify?email=${encodeURIComponent(form.getValues("email"))}`
              : "/verify"
          }
          className="text-primary underline-offset-4 hover:underline"
        >
          Enter your code
        </Link>
      </p>
    </>
  );
}
