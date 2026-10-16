"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runStageB } from "@/lib/ai/stage-b";

export async function generateAlternatives(problemNodeId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to continue." };

  const { data: problem } = await supabase
    .from("graph_nodes")
    .select("id, project_id, content")
    .eq("id", problemNodeId)
    .eq("type", "problem")
    .single();
  if (!problem) return { error: "Problem not found." };

  // Already generated for this problem?
  const { data: existing } = await supabase
    .from("graph_edges")
    .select("id")
    .eq("target_id", problemNodeId)
    .eq("relationship", "addresses")
    .limit(1);
  if (existing && existing.length > 0) {
    return { error: "Alternatives were already generated for this problem." };
  }

  // Evidence linked to this problem
  const { data: links } = await supabase
    .from("graph_edges")
    .select("source_id")
    .eq("target_id", problemNodeId)
    .eq("relationship", "supports");
  const evidenceIds = (links ?? []).map((l) => l.source_id);

  const { data: evNodes } = evidenceIds.length
    ? await supabase
        .from("graph_nodes")
        .select("content")
        .in("id", evidenceIds)
        .eq("type", "evidence")
    : { data: [] as { content: { quote: string; observation: string } }[] };

  let result;
  try {
    result = await runStageB({
      problem: problem.content,
      evidence: (evNodes ?? []).map((n) => n.content),
    });
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { data: altNodes, error: aErr } = await supabase
    .from("graph_nodes")
    .insert(
      result.alternatives.map((a) => ({
        project_id: problem.project_id,
        type: "alternative" as const,
        content: { ...a, status: "proposed" },
        is_human_authored: false,
      }))
    )
    .select("id");
  if (aErr || !altNodes) return { error: "Failed to save alternatives." };

  const { error: eErr } = await supabase.from("graph_edges").insert(
    altNodes.map((n) => ({
      project_id: problem.project_id,
      source_id: n.id,
      target_id: problemNodeId,
      relationship: "addresses",
    }))
  );
  if (eErr) return { error: "Failed to save graph connections." };

  revalidatePath(`/projects/${problem.project_id}`);
  return { ok: true };
}