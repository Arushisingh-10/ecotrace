import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { CreateProjectForm } from "@/components/create-project-form";
import { LocalDate } from "@/components/local-date";
export const instant = false;
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Home() {
  await connection();
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
              EchoTrace
            </h1>
            <p className="hidden text-xs text-slate-500 sm:block">
              The Human Intent Graph System
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[200px] truncate text-sm text-slate-600 md:block">
              {user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Naya project banao
          </h2>
          <CreateProjectForm />
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Aapke projects
          </h2>

          {error && (
            <p className="text-sm text-red-600">Error: {error.message}</p>
          )}

          {projects && projects.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Abhi koi project nahi hai. Upar se pehla project banao.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects?.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="h-full transition hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="truncate">{p.name}</CardTitle>
                    <CardDescription>
                      <LocalDate value={p.created_at} />
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-500">
                    Feedback add karne ke liye kholo.
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}