"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getRedirectResult } from "firebase/auth";
import { firebaseAuth } from "../../../../lib/firebase";
import { Card } from "../../../../components/ui";

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="text-muted">Loading...</div>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(() => {
    const raw = searchParams?.get("next") || searchParams?.get("redirect") || "/dashboard";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return "/dashboard";
    return raw.startsWith("/") ? raw : "/dashboard";
  }, [searchParams]);

  useEffect(() => {
    const run = async () => {
      try {
        await getRedirectResult(firebaseAuth);
        router.replace(nextPath);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Authentication failed.");
      }
    };
    run();
  }, [router, nextPath]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md p-10 text-center">
        <h1 className="font-serif text-2xl text-ink-deep">Finishing sign-in…</h1>
        <p className="mt-3 text-muted">
          {error ? <span className="text-red-700">{error}</span> : "Please wait a moment."}
        </p>
      </Card>
    </div>
  );
}
