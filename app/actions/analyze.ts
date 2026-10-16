"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runStageA } from "@/lib/ai/stage-a";

export async function analyzeFeedback(feedbackId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Login karo." };

  // RLS ki wajah se sirf apna feedback milega
  const { data: fb } = await supabase
    .from("graph_nodes")
    .select("id, project_id, content")
    .eq("id", feedbackId)
    .eq("type", "feedback")
    .single();
  if (!fb) return { error: "Feedback nahi mila." };

  // Pehle se analyze ho chuka hai?
  const { data: existing } = await supabase
    .from("graph_edges")
    .select("id")
    .eq("source_id", feedbackId)
    .eq("relationship", "derived_from")
    .limit(1);
  if (existing && existing.length > 0) {
    return { error: "Ye feedback pehle hi analyze ho chuka hai." };
  }

  // Image (agar hai) download karke Gemini ko bhejo
  let image: { data: string; mimeType: string } | undefined;
  const imagePath = fb.content?.image_path as string | null;
  if (imagePath) {
    const { data: blob } = await supabase.storage
      .from("feedback-images")
      .download(imagePath);
    if (blob) {
      const buf = Buffer.from(await blob.arrayBuffer());
      image = { data: buf.toString("base64"), mimeType: blob.type };
    }
  }

  let result;
  try {
    result = await runStageA(fb.content.text, image);
  } catch (e) {
    return { error: (e as Error).message };
  }

  // Problem node (AI-generated)
  const { data: problemNode, error: pErr } = await supabase
    .from("graph_nodes")
    .insert({
      project_id: fb.project_id,
      type: "problem",
      content: result.problem,
      is_human_authored: false,
    })
    .select("id")
    .single();
  if (pErr || !problemNode) return { error: "Problem node save nahi hua." };

  // Evidence nodes
  const evidenceRows = result.evidence.map((e) => ({
    project_id: fb.project_id,
    type: "evidence" as const,
    content: e,
    is_human_authored: false,
  }));
  const { data: evNodes, error: eErr } = await supabase
    .from("graph_nodes")
    .insert(evidenceRows)
    .select("id");
  if (eErr || !evNodes) return { error: "Evidence save nahi hua." };

  // Assumption nodes
  let asNodes: { id: string }[] = [];
  if (result.unsupportedAssumptions.length > 0) {
    const { data } = await supabase
      .from("graph_nodes")
      .insert(
        result.unsupportedAssumptions.map((a) => ({
          project_id: fb.project_id,
          type: "assumption" as const,
          content: { text: a },
          is_human_authored: false,
        }))
      )
      .select("id");
    asNodes = data ?? [];
  }

  // Edges: feedback -> evidence (supports), evidence -> problem (supports),
  // problem -> feedback (derived_from), assumption -> problem (assumed_by)
  const edges = [
    {
      project_id: fb.project_id,
      source_id: problemNode.id,
      target_id: feedbackId,
      relationship: "derived_from",
    },
    ...evNodes.map((n) => ({
      project_id: fb.project_id,
      source_id: n.id,
      target_id: problemNode.id,
      relationship: "supports",
    })),
    ...asNodes.map((n) => ({
      project_id: fb.project_id,
      source_id: n.id,
      target_id: problemNode.id,
      relationship: "assumed_by",
    })),
  ];
  const { error: edgeErr } = await supabase.from("graph_edges").insert(edges);
  if (edgeErr) return { error: "Edges save nahi hue." };

  revalidatePath(`/projects/${fb.project_id}`);
  return { ok: true };
}