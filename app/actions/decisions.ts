"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function recordDecision(input: {
  alternativeId: string;
  status: "accept" | "reject";
  reason: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to continue." };

  const reason = input.reason.trim();
  if (input.status === "reject" && reason.length < 5) {
    return { error: "Please give a reason (at least 5 characters)." };
  }

  // RLS ensures only your own alternatives are visible
  const { data: alt } = await supabase
    .from("graph_nodes")
    .select("id, project_id, content")
    .eq("id", input.alternativeId)
    .eq("type", "alternative")
    .single();
  if (!alt) return { error: "Alternative not found." };

  // Already decided? Decisions are never overwritten.
  const { data: existing } = await supabase
    .from("graph_edges")
    .select("id")
    .eq("target_id", input.alternativeId)
    .eq("relationship", "targets")
    .limit(1);
  if (existing && existing.length > 0) {
    return { error: "A decision has already been recorded for this alternative." };
  }

  // Decision node (human authored)
  const { data: decision, error: dErr } = await supabase
    .from("graph_nodes")
    .insert({
      project_id: alt.project_id,
      type: "decision",
      content: {
        status: input.status === "accept" ? "accepted" : "rejected",
        reason,
        alternative_title: alt.content?.title,
        decided_at: new Date().toISOString(),
      },
      is_human_authored: true,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (dErr || !decision) return { error: "Failed to save the decision." };

  // Invariant: a decision links to exactly one alternative via 'targets'
  const { error: eErr } = await supabase.from("graph_edges").insert({
    project_id: alt.project_id,
    source_id: decision.id,
    target_id: input.alternativeId,
    relationship: "targets",
  });
  if (eErr) return { error: "Failed to link the decision." };

  revalidatePath(`/projects/${alt.project_id}`);
  return { ok: true };
}