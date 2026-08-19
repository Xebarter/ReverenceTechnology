"use client";

import { Suspense } from "react";
import AuthPage from "../../../components/AuthPage";
import SEO from "../../../components/SEO";

export default function Auth() {
  return (
    <>
      <SEO title="Sign in" />
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center p-6">
            <div className="text-muted">Loading...</div>
          </div>
        }
      >
        <AuthPage />
      </Suspense>
    </>
  );
}
