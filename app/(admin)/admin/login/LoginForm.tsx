"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError("Identifiants incorrects. Vérifiez votre email et mot de passe.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm outline-none focus:border-leaf-500"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm outline-none focus:border-leaf-500"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-leaf-600 px-6 py-3 text-sm font-semibold text-mist-50 transition-colors hover:bg-leaf-700 disabled:opacity-60"
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
