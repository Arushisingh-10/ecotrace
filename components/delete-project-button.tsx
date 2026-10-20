"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";

export function DeleteProjectButton({
  projectId,
  projectName,
  redirectTo,
  compact = false,
}: {
  projectId: string;
  projectName: string;
  redirectTo?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function confirmDelete() {
    setLoading(true);
    setError("");
    const res = await deleteProject(projectId);
    setLoading(false);
    if (res?.error) return setError(res.error);
    setOpen(false);
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <>
      {compact ? (
        <button
          type="button"
          aria-label={`Delete project ${projectName}`}
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          className="gap-2 text-red-400 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
          Delete project
        </Button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <div className="w-full max-w-md space-y-4 rounded-xl border border-white/10 bg-[#0e1530] p-6">
            <h2 id="delete-title" className="text-lg font-bold text-white">
              Delete this project?
            </h2>
            <p className="text-sm text-slate-300">
              <span className="font-semibold text-white">{projectName}</span>{" "}
              and all of its feedback, AI analysis, decisions, prototypes and
              uploaded screenshots will be permanently deleted. This cannot be
              undone.
            </p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={loading}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={loading}
                onClick={confirmDelete}
              >
                {loading ? "Deleting..." : "Delete permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}