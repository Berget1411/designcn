"use client";

import Link from "next/link";
import { useState } from "react";
import { sendVerificationEmail, useSession } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const { data: session } = useSession();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    if (!session?.user.email) return;
    setLoading(true);
    await sendVerificationEmail({ email: session.user.email, callbackURL: "/" });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="w-full max-w-sm space-y-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Verify your email</h1>
      <p className="text-sm text-muted-foreground">
        We sent a verification link to your email address. Check your inbox and click the link to
        continue.
      </p>

      {sent ? (
        <p className="text-sm text-muted-foreground">Link resent — check your inbox.</p>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          disabled={loading || !session}
          className="text-sm font-medium text-foreground hover:underline disabled:opacity-50"
        >
          {loading ? "Sending…" : "Resend verification email"}
        </button>
      )}

      <p className="text-sm text-muted-foreground">
        <Link href="/sign-in" className="font-medium text-foreground hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
