import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { error } = await supabase.from("projects").select("*").limit(1);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-slate-900">EchoTrace</h1>
      <p className="mt-2 text-slate-600">The Human Intent Graph System</p>
      <p className="mt-4 text-sm">
        Database status: {error ? `Error: ${error.message}` : "Connected ✅"}
      </p>
    </main>
  );
}