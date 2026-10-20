import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { CreateProjectForm } from "@/components/create-project-form";
import { LocalDate } from "@/components/local-date";

// export const instant = false;

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  return (
    <AppShell email={user.email ?? ""}>
      <div className="space-y-6">
        <Panel title="Create a new project">
          <CreateProjectForm />
        </Panel>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white sm:text-lg">
            Your projects ({projects?.length ?? 0})
          </h2>

          {error && (
            <p className="text-sm text-red-400">Error: {error.message}</p>
          )}

          {projects && projects.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">
              No projects yet. Create your first project above.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects?.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <div className="h-full rounded-xl border border-white/10 bg-[#0e1530]/80 p-4 transition hover:border-violet-500/60 hover:bg-[#131c40]">
                  <p className="truncate font-semibold text-white">{p.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Created <LocalDate value={p.created_at} />
                  </p>
                  <p className="mt-3 text-sm text-slate-400">
                    Open project →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}