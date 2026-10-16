"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/png", "image/jpeg"];

export function FeedbackForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setError("");
    if (f && !ALLOWED.includes(f.type)) {
      setError("Only PNG or JPEG images are allowed.");
      e.target.value = "";
      return setFile(null);
    }
    if (f && f.size > MAX_SIZE) {
      setError("Image must be smaller than 5 MB.");
      e.target.value = "";
      return setFile(null);
    }
    setFile(f);
  }

  async function handleSubmit() {
    if (!text.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return setError("Your session has expired. Please log in again.");
    }

    let imagePath: string | null = null;

    if (file) {
      const ext = file.type === "image/png" ? "png" : "jpg";
      imagePath = `${user.id}/${projectId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("feedback-images")
        .upload(imagePath, file, { contentType: file.type });
      if (upErr) {
        setLoading(false);
        return setError("Image upload failed: " + upErr.message);
      }
    }

    const { error: insErr } = await supabase.from("graph_nodes").insert({
      project_id: projectId,
      type: "feedback",
      content: { text: text.trim(), image_path: imagePath },
      is_human_authored: true,
      created_by: user.id,
    });

    setLoading(false);
    if (insErr) return setError(insErr.message);

    setText("");
    setFile(null);
    (document.getElementById("feedback-file") as HTMLInputElement).value = "";
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Paste customer feedback here (e.g. The pricing page is confusing, I don't know which plan fits my team.)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
      />
      <Input
        id="feedback-file"
        type="file"
        accept="image/png,image/jpeg"
        onChange={handleFile}
      />
      <p className="text-xs text-slate-400">
        Optional screenshot. PNG or JPEG, up to 5 MB.
      </p>
      <Button
        onClick={handleSubmit}
        disabled={loading || !text.trim()}
        className="w-full sm:w-auto"
      >
        {loading ? "Saving..." : "Save feedback"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}