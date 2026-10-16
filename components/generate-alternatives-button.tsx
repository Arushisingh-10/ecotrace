"use client";

import { useState } from "react";
import { generateAlternatives } from "@/app/actions/alternatives";
import { Button } from "@/components/ui/button";

export function GenerateAlternativesButton({ problemId }: { problemId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    const res = await generateAlternatives(problemId);
    setLoading(false);
    if (res?.error) setError(res.error);
  }

  return (
    <div className="mt-3 space-y-1">
      <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
        {loading ? "Generating..." : "Generate alternatives"}
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}