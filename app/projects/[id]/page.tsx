import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Sparkles,
  Network,
  Lightbulb,
  MessageSquare,
  FileText,
  LayoutTemplate,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { StepsList, ProgressRing } from "@/components/project-steps";
import { FeedbackForm } from "@/components/feedback-form";
import { AnalyzeButton } from "@/components/analyze-button";
import { LocalDate } from "@/components/local-date";
import { GenerateAlternativesButton } from "@/components/generate-alternatives-button";
import { IntentGraph } from "@/components/intent-graph";
import { DecisionButtons } from "@/components/decision-buttons";
import { ReplaceButton } from "@/components/replace-button";
import { GeneratePrototypeButton } from "@/components/generate-prototype-button";
import { DynamicRenderer } from "@/components/dynamic-renderer";


export const instant = false;

export default async function ProjectPage({
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
    .select("id, name, created_at")
    .eq("id", id)
    .single();
  if (!project) notFound();

  const { data: nodes } = await supabase
    .from("graph_nodes")
    .select("id, type, content, created_at, is_human_authored")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const { data: edges } = await supabase
    .from("graph_edges")
    .select("id, source_id, target_id, relationship")
    .eq("project_id", id);

  const all = nodes ?? [];
  const ofType = (t: string) => all.filter((n) => n.type === t);

  const feedback = ofType("feedback");
  const problems = ofType("problem");
  const evidence = ofType("evidence").reverse();
  const assumptions = ofType("assumption").reverse();
  const alternatives = ofType("alternative").reverse();
  const decisions = ofType("decision");
    const prototypes = ofType("prototype").reverse();
  const protoDecisionIds = new Set(
    (edges ?? [])
      .filter((e) => e.relationship === "generated_from")
      .map((e) => e.target_id)
  );

  // Map: alternative id -> its decision node
  const decisionByAlt = new Map<string, (typeof decisions)[number]>();
  (edges ?? [])
    .filter((e) => e.relationship === "targets")
    .forEach((e) => {
      const d = decisions.find((x) => x.id === e.source_id);
      if (d) decisionByAlt.set(e.target_id, d);
    });

  // Alternatives that already have a replacement
  const replacedIds = new Set(
    (edges ?? [])
      .filter((e) => e.relationship === "revises")
      .map((e) => e.target_id)
  );

  // Temporary signed links for private images
  const paths = feedback
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

  // Step status derived from real data
  const done = [
    feedback.length > 0,
    problems.length > 0,
    alternatives.length > 0,
    decisions.length > 0,
    ofType("prototype").length > 0,
    ofType("verification").length > 0,
  ];
  const completed = done.filter(Boolean).length;
  const latest = feedback[0];

  return (
    <AppShell email={user.email ?? ""}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ===== Left column ===== */}
        <div className="min-w-0 space-y-4">
          {/* Project header */}
          <Panel>
            <Link href="/" className="text-xs text-slate-400 hover:text-white">
              ← All projects
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                {project.name}
              </h1>
              <span className="rounded-full bg-blue-500/20 px-3 py-0.5 text-xs text-blue-300">
                {completed === 6 ? "Completed" : "In progress"}
              </span>
            </div>
            {latest && (
              <p className="mt-3 border-l-2 border-violet-500 pl-3 text-sm italic text-slate-300">
                &ldquo;{latest.content?.text}&rdquo;
              </p>
            )}
          </Panel>

          {/* Steps + Graph */}
          <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
            <Panel title="Progress">
              <StepsList done={done} />
            </Panel>
            <Panel
              title="Human Intent Graph"
              icon={<Network className="h-4 w-4" />}
            >
              <IntentGraph nodes={all} edges={edges ?? []} />
            </Panel>
          </div>

          {/* Solution Alternatives */}
          <Panel
            title="Solution Alternatives"
            icon={<Lightbulb className="h-4 w-4 text-amber-400" />}
          >
            {alternatives.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">
                Run &ldquo;Generate alternatives&rdquo; on an AI problem to see
                three distinct solution options.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {alternatives.map((a) => {
                  const decision = decisionByAlt.get(a.id);
                  const accepted = decision?.content?.status === "accepted";
                  const rejected = decision?.content?.status === "rejected";
                        {accepted && !protoDecisionIds.has(decision!.id) && (
                           <GeneratePrototypeButton decisionId={decision!.id} />
                          )}
                          {accepted && protoDecisionIds.has(decision!.id) && (
                            <p className="mt-1 text-slate-400">
                              Prototype generated.
                            </p>
                          )}
                  return (
                    <div
                      key={a.id}
                      className={`space-y-3 rounded-lg bg-white/5 p-4 text-sm ${
                        accepted
                          ? "border border-solid border-emerald-500"
                          : rejected
                          ? "border border-solid border-red-500/60 opacity-70"
                          : "border border-dashed border-amber-500/60"
                      }`}
                      
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[10px] font-semibold uppercase text-amber-400">
                          AI proposal · {a.content?.vector}
                        </p>
                        <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                          {a.content?.implementationComplexity} complexity
                        </span>
                      </div>
                      <p className="font-semibold text-white">
                        {a.content?.title}
                      </p>
                      <p className="text-slate-300">
                        {a.content?.proposedApproach}
                      </p>
                      <p className="text-xs text-emerald-300">
                        Benefit: {a.content?.userBenefit}
                      </p>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          Trade-offs
                        </p>
                        <ul className="list-disc pl-4 text-xs text-slate-400">
                          {a.content?.tradeOffs?.map((t: string, i: number) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          Unsupported assumptions
                        </p>
                        <ul className="list-disc pl-4 text-xs text-slate-400">
                          {a.content?.unsupportedAssumptions?.map(
                            (t: string, i: number) => (
                              <li key={i}>{t}</li>
                            )
                          )}
                        </ul>
                      </div>

                      {decision ? (
                        <div
                          className={`rounded-md p-2 text-xs ${
                            accepted ? "bg-emerald-500/10" : "bg-red-500/10"
                          }`}
                        >
                          <p
                            className={`font-semibold uppercase ${
                              accepted ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {accepted ? "Accepted" : "Rejected"} · Human
                            decision
                          </p>
                          {decision.content?.reason && (
                            <p className="mt-1 text-slate-300">
                              Reason: {decision.content.reason}
                            </p>
                          )}
                          {rejected && !replacedIds.has(a.id) && (
                            <ReplaceButton alternativeId={a.id} />
                          )}
                          {rejected && replacedIds.has(a.id) && (
                            <p className="mt-1 text-slate-400">
                              Replacement generated.
                            </p>
                          )}
                          <p className="mt-1 text-slate-500">
                            <LocalDate value={decision.created_at} withTime />
                          </p>
                        </div>
                      ) : (
                        <DecisionButtons alternativeId={a.id} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>


                    {/* Prototype preview */}
          <Panel
            title="Prototype Preview"
            icon={<LayoutTemplate className="h-4 w-4 text-cyan-400" />}
          >
            {prototypes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">
                Accept an alternative, then select &ldquo;Generate
                prototype&rdquo; to preview it here.
              </div>
            ) : (
              <div className="space-y-6">
                {prototypes.map((pr) => (
                  <div key={pr.id} className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase text-cyan-400">
                      AI-generated prototype · {pr.content?.title}
                    </p>
                    <div className="rounded-lg border border-dashed border-cyan-500/50 bg-slate-100 p-4">
                      <DynamicRenderer data={pr.content?.component_schema} />
                    </div>
                    <p className="text-xs text-slate-500">
                      Low-fidelity preview rendered from validated JSON. It does
                      not prove business impact without user testing.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Feedback */}
          <div className="grid gap-4 md:grid-cols-2">
            <Panel
              title="Add feedback"
              icon={<MessageSquare className="h-4 w-4" />}
            >
              <FeedbackForm projectId={project.id} />
            </Panel>

            <Panel title={`Feedback (${feedback.length})`}>
              {feedback.length === 0 && (
                <p className="rounded-lg border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">
                  No feedback yet.
                </p>
              )}
              <div className="space-y-3">
                {feedback.map((f) => {
                  const imgUrl = f.content?.image_path
                    ? urlMap.get(f.content.image_path)
                    : null;
                  return (
                    <div
                      key={f.id}
                      className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3"
                    >
                      <p className="text-xs text-slate-400">
                        <LocalDate value={f.created_at} withTime />
                      </p>
                      <p className="whitespace-pre-wrap text-sm text-slate-100">
                        {f.content?.text}
                      </p>
                      {imgUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imgUrl}
                          alt="Feedback screenshot"
                          className="max-h-48 w-full rounded-md border border-white/10 object-contain"
                        />
                      )}
                      <AnalyzeButton feedbackId={f.id} />
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>
        </div>

        {/* ===== Right column ===== */}
        <div className="min-w-0 space-y-4">
          <Panel>
            <ProgressRing completed={completed} total={6} />
          </Panel>

          <Panel title="Project Details" icon={<FileText className="h-4 w-4" />}>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Project name</dt>
                <dd className="truncate text-white">{project.name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Created</dt>
                <dd className="text-white">
                  <LocalDate value={project.created_at} />
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-400">Feedback items</dt>
                <dd className="text-white">{feedback.length}</dd>
              </div>
            </dl>
          </Panel>

          <Panel
            title="AI Analysis"
            icon={<Sparkles className="h-4 w-4 text-amber-400" />}
          >
            {problems.length === 0 ? (
              <p className="text-sm text-slate-400">
                Select &ldquo;Analyze with AI&rdquo; on a feedback item to
                extract the problem and supporting evidence.
              </p>
            ) : (
              <div className="space-y-4 text-sm">
                {problems.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg border border-dashed border-amber-500/60 p-3"
                  >
                    <p className="text-[10px] font-semibold uppercase text-amber-400">
                      AI hypothesis · Problem
                    </p>
                    <p className="mt-1 font-semibold text-white">
                      {p.content?.title}
                    </p>
                    <p className="text-slate-300">{p.content?.description}</p>
                    <GenerateAlternativesButton problemId={p.id} />
                  </div>
                ))}

                <div>
                  <p className="mb-1 font-semibold text-white">Evidence</p>
                  <ul className="space-y-2">
                    {evidence.map((e) => (
                      <li key={e.id} className="text-slate-300">
                        <span className="italic">
                          &ldquo;{e.content?.quote}&rdquo;
                        </span>
                        <span className="block text-xs text-slate-400">
                          {e.content?.observation}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-1 font-semibold text-white">
                    Unsupported assumptions
                  </p>
                  <ul className="space-y-2">
                    {assumptions.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-md border border-dashed border-amber-500/40 p-2 text-slate-300"
                      >
                        {a.content?.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}