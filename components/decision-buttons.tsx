"use client";

import { useState } from "react";
import { recordDecision } from "@/app/actions/decisions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function DecisionButtons({ alternativeId }: { alternativeId: string }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(status: "accept" | "reject") {
    setLoading(true);
    setError("");
    const res = await recordDecision({ alternativeId, status, reason });
    setLoading(false);
    if (res?.error) setError(res.error);
  }

  return (
    <div className="space-y-2 border-t border-white/10 pt-3">
      {!rejecting ? (
        <div className="flex gap-2">
          <Button size="sm" disabled={loading} onClick={() => submit("accept")}>
            {loading ? "Saving..." : "Accept"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => setRejecting(true)}
          >
            Reject
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            placeholder="Why are you rejecting this? (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={loading}
              onClick={() => submit("reject")}
            >
              {loading ? "Saving..." : "Confirm rejection"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => setRejecting(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}