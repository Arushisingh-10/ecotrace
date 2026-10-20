"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runStageD } from "@/lib/ai/stage-d";

export async function generatePrototype(decisionNodeId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to continue." };

  // The decision must exist and be an acceptance
  const { data: decision } = await supabase
    .from("graph_nodes")
    .select("id, project_id, content")
    .eq("id", decisionNodeId)
    .eq("type", "decision")
    .single();
  if (!decision) return { error: "Decision not found." };
  if (decision.content?.status !== "accepted") {
    return { error: "Prototypes can only be generated from accepted decisions." };
  }

  // Already generated?
  const { data: existing } = await supabase
    .from("graph_edges")
    .select("id")
    .eq("target_id", decisionNodeId)
    .eq("relationship", "generated_from")
    .limit(1);
  if (existing && existing.length > 0) {
    return { error: "A prototype was already generated for this decision." };
  }

  // Find the accepted alternative
  const { data: altEdge } = await supabase
    .from("graph_edges")
    .select("target_id")
    .eq("source_id", decisionNodeId)
    .eq("relationship", "targets")
    .limit(1)
    .single();
  if (!altEdge) return { error: "Alternative not found." };

  const { data: alt } = await supabase
    .from("graph_nodes")
    .select("content")
    .eq("id", altEdge.target_id)
    .eq("type", "alternative")
    .single();
  if (!alt) return { error: "Alternative not found." };

  let tree;
  try {
    tree = await runStageD({
      title: alt.content?.title,
      proposedApproach: alt.content?.proposedApproach,
      userBenefit: alt.content?.userBenefit,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }

  // Prototype node (AI generated)
  const { data: protoNode, error: pErr } = await supabase
    .from("graph_nodes")
    .insert({
      project_id: decision.project_id,
      type: "prototype",
      content: { title: alt.content?.title, component_schema: tree },
      is_human_authored: false,
    })
    .select("id")
    .single();
  if (pErr || !protoNode) return { error: "Failed to save the prototype." };

  const { error: vErr } = await supabase.from("prototype_versions").insert({
    decision_node_id: decisionNodeId,
    component_schema: tree,
  });
  if (vErr) return { error: "Failed to save the prototype version." };

  const { error: eErr } = await supabase.from("graph_edges").insert({
    project_id: decision.project_id,
    source_id: protoNode.id,
    target_id: decisionNodeId,
    relationship: "generated_from",
  });
  if (eErr) return { error: "Failed to link the prototype." };

  revalidatePath(`/projects/${decision.project_id}`);
  return { ok: true };
}