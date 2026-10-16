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
    setMessage("Account created. You can now log in.");
  }

  async function handleLogin() {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) return setMessage(error.message);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b17] p-4">
      <main className="w-full max-w-sm space-y-5 rounded-xl border border-white/10 bg-[#0e1530]/80 p-6 sm:p-8">
        <div>
          <h1 className="text-2xl font-bold text-white">EchoTrace</h1>
          <p className="mt-1 text-sm text-slate-400">
            Sign in to your workspace
          </p>
        </div>

        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password (minimum 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full sm:flex-1"
          >
            Log in
          </Button>
          <Button
            variant="outline"
            onClick={handleSignUp}
            disabled={loading}
            className="w-full sm:flex-1"
          >
            Sign up
          </Button>
        </div>

        {message && <p className="text-sm text-slate-300">{message}</p>}
      </main>
    </div>
  );
}