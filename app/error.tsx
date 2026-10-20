"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b17] p-4">
      <div className="max-w-md space-y-4 rounded-xl border border-white/10 bg-[#0e1530]/80 p-8 text-center">
        <h1 className="text-xl font-bold text-white">Something went wrong</h1>
        <p className="text-sm text-slate-400">
          An unexpected error occurred. Please try again. If the problem
          continues, return to the home page.
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}