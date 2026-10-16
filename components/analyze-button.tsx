"use client";

import { useState } from "react";
import { analyzeFeedback } from "@/app/actions/analyze";
import { Button } from "@/components/ui/button";

export function AnalyzeButton({ feedbackId }: { feedbackId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    const res = await analyzeFeedback(feedbackId);
    setLoading(false);
    if (res?.error) setError(res.error);
  }

  return (
    <div className="space-y-1">
      <Button size="sm" onClick={handleClick} disabled={loading}>
        {loading ? "AI analyze kar raha hai..." : "Analyze with AI"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}