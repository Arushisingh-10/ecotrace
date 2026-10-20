"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifyPrototype } from "@/lib/prototype/verify";

export async function runVerification(prototypeNodeId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to continue." };

  const { data: proto } = await supabase
    .from("graph_nodes")
    .select("id, project_id, content")
    .eq("id", prototypeNodeId)
    .eq("type", "prototype")
    .single();
  if (!proto) return { error: "Prototype not found." };

  const { data: existing } = await supabase
    .from("graph_edges")
    .select("id")
    .eq("target_id", prototypeNodeId)
    .eq("relationship", "verifies")
    .limit(1);
  if (existing && existing.length > 0) {
    return { error: "This prototype has already been verified." };
  }

  // Deterministic checks. No AI involved.
  const checks = verifyPrototype(proto.content?.component_schema);
  const passedCount = checks.filter((c) => c.passed).length;

  const { data: vNode, error: vErr } = await supabase
    .from("graph_nodes")
    .insert({
      project_id: proto.project_id,
      type: "verification",
      content: {
        checks,
        passed: passedCount,
        total: checks.length,
        ran_at: new Date().toISOString(),
        method: "deterministic",
      },
      is_human_authored: false,
    })
    .select("id")
    .single();
  if (vErr || !vNode) return { error: "Failed to save verification." };

  const { error: eErr } = await supabase.from("graph_edges").insert({
    project_id: proto.project_id,
    source_id: vNode.id,
    target_id: prototypeNodeId,
    relationship: "verifies",
  });
  if (eErr) return { error: "Failed to link verification." };

  revalidatePath(`/projects/${proto.project_id}`);
  return { ok: true };
}