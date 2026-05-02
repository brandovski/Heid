"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.refresh();
    router.push("/dashboard");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface rounded-panel shadow-card border border-brand-700/20 p-8 space-y-5"
    >
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-brand-700 mb-1"
        >
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-brand-700/30 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-transparent"
          placeholder="seu@email.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-brand-700 mb-1"
        >
          Senha
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-brand-700/30 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-transparent"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-brand-600 text-white text-sm font-medium
                   rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2
                   focus:ring-brand-700/30 focus:ring-offset-2 disabled:opacity-60
                   disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
