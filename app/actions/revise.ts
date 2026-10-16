"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runStageC } from "@/lib/ai/stage-c";

export async function generateReplacement(rejectedAltId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to continue." };

  const { data: alt } = await supabase
    .from("graph_nodes")
    .select("id, project_id, content")
    .eq("id", rejectedAltId)
    .eq("type", "alternative")
    .single();
  if (!alt) return { error: "Alternative not found." };

  // Must have a rejection decision
  const { data: decEdge } = await supabase
    .from("graph_edges")
    .select("source_id")
    .eq("target_id", rejectedAltId)
    .eq("relationship", "targets")
    .limit(1)
    .single();
  if (!decEdge) return { error: "This alternative has no decision yet." };

  const { data: decision } = await supabase
    .from("graph_nodes")
    .select("content")
    .eq("id", decEdge.source_id)
    .eq("type", "decision")
    .single();
  if (!decision || decision.content?.status !== "rejected") {
    return { error: "Only rejected alternatives can be replaced." };
  }

  // Already replaced?
  const { data: existing } = await supabase
    .from("graph_edges")
    .select("id")
    .eq("target_id", rejectedAltId)
    .eq("relationship", "revises")
    .limit(1);
  if (existing && existing.length > 0) {
    return { error: "A replacement was already generated for this alternative." };
  }

  // Find the parent problem
  const { data: probEdge } = await supabase
    .from("graph_edges")
    .select("target_id")
    .eq("source_id", rejectedAltId)
    .eq("relationship", "addresses")
    .limit(1)
    .single();
  if (!probEdge) return { error: "Original problem not found." };

  const { data: problem } = await supabase
    .from("graph_nodes")
    .select("id, content")
    .eq("id", probEdge.target_id)
    .eq("type", "problem")
    .single();
  if (!problem) return { error: "Original problem not found." };

  // All alternatives already proposed for this problem
  const { data: siblingEdges } = await supabase
    .from("graph_edges")
    .select("source_id")
    .eq("target_id", problem.id)
    .eq("relationship", "addresses");
  const siblingIds = (siblingEdges ?? []).map((e) => e.source_id);
  const { data: siblings } = siblingIds.length
    ? await supabase.from("graph_nodes").select("content").in("id", siblingIds)
    : { data: [] as { content: { title: string } }[] };

  let result;
  try {
    result = await runStageC({
      problem: problem.content,
      rejected: {
        title: alt.content?.title,
        proposedApproach: alt.content?.proposedApproach,
        reason: decision.content?.reason ?? "",
      },
      previousTitles: (siblings ?? []).map((s) => s.content?.title),
    });
  } catch (e) {
    return { error: (e as Error).message };
  }

  const { data: newAlt, error: nErr } = await supabase
    .from("graph_nodes")
    .insert({
      project_id: alt.project_id,
      type: "alternative",
      content: { ...result, status: "proposed", revision_of: rejectedAltId },
      is_human_authored: false,
    })
    .select("id")
    .single();
  if (nErr || !newAlt) return { error: "Failed to save the replacement." };

  // New alternative addresses the same problem, and revises the rejected one
  const { error: eErr } = await supabase.from("graph_edges").insert([
    {
      project_id: alt.project_id,
      source_id: newAlt.id,
      target_id: problem.id,
      relationship: "addresses",
    },
    {
      project_id: alt.project_id,
      source_id: newAlt.id,
      target_id: rejectedAltId,
      relationship: "revises",
    },
  ]);
  if (eErr) return { error: "Failed to save graph connections." };

  revalidatePath(`/projects/${alt.project_id}`);
  return { ok: true };
}