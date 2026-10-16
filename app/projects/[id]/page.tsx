import Link from "next/link";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FeedbackForm } from "@/components/feedback-form";
import { LogoutButton } from "@/components/logout-button";
import { LocalDate } from "@/components/local-date";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
export const instant = false;

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
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

  const { data: feedback } = await supabase
    .from("graph_nodes")
    .select("id, content, created_at")
    .eq("project_id", id)
    .eq("type", "feedback")
    .order("created_at", { ascending: false });

  // Private images ke liye temporary (1 ghanta) links
  const paths = (feedback ?? [])
    .map((f) => f.content?.image_path as string | null)
    .filter((p): p is string => !!p);

  const urlMap = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("feedback-images")
      .createSignedUrls(paths, 3600);
    signed?.forEach((s) => {
      if (s.path && s.signedUrl) urlMap.set(s.path, s.signedUrl);
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              ← Back
            </Link>
            <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
              {project.name}
            </h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Naya feedback add karo
          </h2>
          <FeedbackForm projectId={project.id} />
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Feedback list ({feedback?.length ?? 0})
          </h2>

          {feedback?.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Abhi koi feedback nahi hai.
            </p>
          )}

          <div className="space-y-4">
            {feedback?.map((f) => {
              const imgUrl = f.content?.image_path
                ? urlMap.get(f.content.image_path)
                : null;
              return (
                <Card key={f.id}>
                  <CardContent className="space-y-3">
                    <CardDescription>
                      <LocalDate value={f.created_at} withTime />
                    </CardDescription>
                    <p className="whitespace-pre-wrap text-sm text-slate-800">
                      {f.content?.text}
                    </p>
                    {imgUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgUrl}
                        alt="Feedback screenshot"
                        className="max-h-64 w-full rounded-md border object-contain"
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}