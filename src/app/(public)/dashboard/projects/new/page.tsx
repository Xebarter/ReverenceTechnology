"use client";

import { Suspense } from "react";
import CreateClientProject from "../../../../../components/CreateClientProject";
import SEO from "../../../../../components/SEO";

export default function DashboardNewProjectPage() {
  return (
    <>
      <SEO title="Start a project" />
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center p-6 text-muted">Loading...</div>
        }
      >
        <CreateClientProject />
      </Suspense>
    </>
  );
}
