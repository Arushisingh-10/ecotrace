"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase
      .from("projects")
      .insert({ name: name.trim() });

    setLoading(false);
    if (error) return setError(error.message);

    setName("");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Project name (e.g. Pricing Page Feedback)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          className="sm:flex-1"
        />
        <Button
          onClick={handleCreate}
          disabled={loading || !name.trim()}
          className="w-full sm:w-auto"
        >
          {loading ? "Creating..." : "Create project"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}