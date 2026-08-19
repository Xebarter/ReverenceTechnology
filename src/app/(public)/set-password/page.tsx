"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "firebase/auth";
import SEO from "../../../components/SEO";
import { useUser } from "../../../UserContext";
import { firebaseAuth } from "../../../lib/firebase";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button, Card, Container, FieldLabel, Input, PageHeader } from "../../../components/ui";

export default function SetPasswordPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth?redirect=/set-password");
  }, [loading, user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    const current = firebaseAuth.currentUser;
    if (!current) {
      setError("Please sign in again, then set your password.");
      return;
    }

    setBusy(true);
    try {
      await updatePassword(current, password);
      setDone(true);
      window.setTimeout(() => router.replace("/dashboard"), 800);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to set password.";
      setError(
        /requires-recent-login/i.test(message)
          ? "For security, please sign out, sign in again, then set a new password."
          : message,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SEO title="Set Password" />
      <PageHeader
        eyebrow="Secure your account"
        title="Set your password"
        description="Create a password to access your dashboard, projects, and applications."
      />
      <Container className="py-16">
        <Card className="mx-auto max-w-lg p-8 md:p-12">
          {error && (
            <div className="mb-6 flex items-center gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle size={18} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {done ? (
            <div className="py-8 text-center">
              <div className="font-serif text-2xl text-ink-deep">Password set</div>
              <div className="mt-2 text-muted">Redirecting you to your dashboard…</div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <FieldLabel>New password</FieldLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <FieldLabel>Confirm password</FieldLabel>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" disabled={busy || loading || !user} className="w-full" size="lg">
                {busy ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save password"
                )}
              </Button>
            </form>
          )}
        </Card>
      </Container>
    </>
  );
}
