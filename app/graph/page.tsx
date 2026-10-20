import Link from "next/link";
import { redirect } from "next/navigation";
import { Network } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { LocalDate } from "@/components/local-date";

export default async function GraphIndexPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  const { data: nodes } = await supabase
    .from("graph_nodes")
    .select("project_id");

  const counts = new Map<string, number>();
  nodes?.forEach((n) =>
    counts.set(n.project_id, (counts.get(n.project_id) ?? 0) + 1)
  );

  return (
    <AppShell email={user.email ?? ""}>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Graph View
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Select a project to explore its Human Intent Graph.
          </p>
        </div>

        {projects && projects.length === 0 && (
          <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">
            No projects yet. Create a project to start building a graph.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects?.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}/graph`}>
              <div className="h-full rounded-xl border border-white/10 bg-[#0e1530]/80 p-4 transition hover:border-violet-500/60 hover:bg-[#131c40]">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-violet-400" />
                  <p className="truncate font-semibold text-white">{p.name}</p>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Created <LocalDate value={p.created_at} />
                </p>
                <p className="mt-3 text-sm text-slate-400">
                  {counts.get(p.id) ?? 0} nodes · Open graph →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}