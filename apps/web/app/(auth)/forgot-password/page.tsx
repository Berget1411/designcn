"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { forgetPassword } from "@/lib/auth-client";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Field, FieldLabel, FieldError, FieldGroup } from "@workspace/ui/components/field";

const formSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [serverError, setServerError] = useState("");

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError("");
      const { error } = await forgetPassword({
        email: value.email,
        redirectTo: "/reset-password",
      });
      if (error) {
        setServerError(error.message ?? "Something went wrong");
      } else {
        setSubmittedEmail(value.email);
        setDone(true);
      }
    },
  });

  if (done) {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          If an account exists for <strong>{submittedEmail}</strong>, we sent a password reset link.
        </p>
        <Link href="/sign-in" className="text-sm font-medium text-foreground hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send a reset link
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        {serverError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <FieldGroup>
          <form.Field name="email">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    autoComplete="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="you@example.com"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="font-medium text-foreground hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
