"use client";

import { useState } from "react";
import { generatePrototype } from "@/app/actions/prototype";
import { Button } from "@/components/ui/button";

export function GeneratePrototypeButton({ decisionId }: { decisionId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    const res = await generatePrototype(decisionId);
    setLoading(false);
    if (res?.error) setError(res.error);
  }

  return (
    <div className="mt-2 space-y-1">
      <Button size="sm" onClick={handleClick} disabled={loading}>
        {loading ? "Generating prototype..." : "Generate prototype"}
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}