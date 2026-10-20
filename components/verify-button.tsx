"use client";

import { useState } from "react";
import { runVerification } from "@/app/actions/verify";
import { Button } from "@/components/ui/button";

export function VerifyButton({ prototypeId }: { prototypeId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    const res = await runVerification(prototypeId);
    setLoading(false);
    if (res?.error) setError(res.error);
  }

  return (
    <div className="space-y-1">
      <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
        {loading ? "Running checks..." : "Run verification"}
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}