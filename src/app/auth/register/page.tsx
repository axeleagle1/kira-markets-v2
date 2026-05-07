"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/markets`,
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center">
          <h1 className="text-lg font-bold mb-2" style={{ color: "var(--fg)" }}>
            Check your email
          </h1>
          <p className="text-xs" style={{ color: "var(--fg-dim)" }}>
            We sent a confirmation link to {email}
          </p>
          <Link href="/auth/login" className="text-xs font-medium mt-3 inline-block" style={{ color: "var(--green)" }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold" style={{ color: "var(--fg)" }}>
            Create Account
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--fg-dim)" }}>
            Start trading on prediction markets
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-[10px] font-medium mb-1" style={{ color: "var(--fg-dim)" }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded outline-none transition-colors placeholder:text-[var(--fg-dim)]"
              style={{
                background: "var(--bg-raised)",
                color: "var(--fg)",
                border: "1px solid var(--border)",
              }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium mb-1" style={{ color: "var(--fg-dim)" }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 text-sm rounded outline-none transition-colors placeholder:text-[var(--fg-dim)]"
              style={{
                background: "var(--bg-raised)",
                color: "var(--fg)",
                border: "1px solid var(--border)",
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-xs px-3 py-2 rounded" style={{ background: "var(--red-dim)", color: "var(--red)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-bold rounded transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--green)", color: "var(--bg)" }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="text-center mt-4">
          <span className="text-xs" style={{ color: "var(--fg-dim)" }}>
            Already have an account?{" "}
          </span>
          <Link href="/auth/login" className="text-xs font-medium" style={{ color: "var(--green)" }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
