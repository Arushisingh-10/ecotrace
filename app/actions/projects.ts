"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteProject(projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to continue." };

  // RLS: only the owner can see (and delete) the project
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();
  if (!project) return { error: "Project not found." };

  // Collect screenshot paths before the rows disappear
  const { data: feedback } = await supabase
    .from("graph_nodes")
    .select("content")
    .eq("project_id", projectId)
    .eq("type", "feedback");
  const paths = (feedback ?? [])
    .map((f) => f.content?.image_path as string | null)
    .filter((p): p is string => !!p);

  // Cascade removes nodes, edges and prototype versions
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);
  if (error) return { error: "Failed to delete the project." };

  if (paths.length > 0) {
    await supabase.storage.from("feedback-images").remove(paths);
  }

  revalidatePath("/");
  revalidatePath("/graph");
  return { ok: true };
}