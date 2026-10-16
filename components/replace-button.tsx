"use client";

import { useState } from "react";
import { generateReplacement } from "@/app/actions/revise";
import { Button } from "@/components/ui/button";

export function ReplaceButton({ alternativeId }: { alternativeId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    const res = await generateReplacement(alternativeId);
    setLoading(false);
    if (res?.error) setError(res.error);
  }

  return (
    <div className="mt-2 space-y-1">
      <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
        {loading ? "Generating..." : "Generate replacement"}
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}