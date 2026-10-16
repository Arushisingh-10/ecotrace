"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) return setMessage(error.message);
    setMessage("Account ban gaya. Ab Log in dabao.");
  }

  async function handleLogin() {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setMessage(error.message);
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto mt-12 w-full max-w-sm space-y-4 p-4 sm:mt-24 sm:p-6">
      <h1 className="text-2xl font-bold text-slate-900">EchoTrace Login</h1>
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Password (min 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={handleLogin} disabled={loading}>
          Log in
        </Button>
        <Button variant="outline" onClick={handleSignUp} disabled={loading}>
          Sign up
        </Button>
      </div>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </main>
  );
}