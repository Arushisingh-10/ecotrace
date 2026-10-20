import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { IntentGraph } from "@/components/intent-graph";

export default async function ProjectGraphPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .single();
  if (!project) notFound();

  const { data: nodes } = await supabase
    .from("graph_nodes")
    .select("id, type, content, created_at, is_human_authored")
    .eq("project_id", id);

  const { data: edges } = await supabase
    .from("graph_edges")
    .select("id, source_id, target_id, relationship")
    .eq("project_id", id);

  return (
    <AppShell email={user.email ?? ""}>
      <div className="space-y-4">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <Link
                href="/graph"
                className="text-xs text-slate-400 hover:text-white"
              >
                ← All graphs
              </Link>
              <h1 className="mt-1 truncate text-xl font-bold text-white">
                {project.name}
                <span className="font-normal text-slate-400">
                  {" "}
                  · Human Intent Graph
                </span>
              </h1>
            </div>
            <Link
              href={`/projects/${project.id}`}
              className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
            >
              Open project
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
            <span>
              <span className="mr-1 inline-block h-2.5 w-4 rounded-sm border border-dashed border-amber-400" />
              Dashed border: AI hypothesis
            </span>
            <span>
              <span className="mr-1 inline-block h-2.5 w-4 rounded-sm border border-solid border-emerald-400" />
              Solid border: human decision
            </span>
            <span>Click a node to see its details. Drag to rearrange.</span>
          </div>
        </Panel>

        <Panel>
          <IntentGraph
            nodes={nodes ?? []}
            edges={edges ?? []}
            height="max(480px, calc(100vh - 340px))"
          />
        </Panel>
      </div>
    </AppShell>
  );
}