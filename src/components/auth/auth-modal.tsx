"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useQueryClient } from "@tanstack/react-query";
import { X, CheckCircle2, Loader2 } from "lucide-react";

export function AuthModal() {
  const { isOpen, mode, close, openSignIn, openSignUp } = useAuthModal();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const resetForm = useCallback(() => {
    setEmail("");
    setPassword("");
    setError(null);
    setLoading(false);
    setSent(false);
  }, []);

  const handleClose = useCallback(() => {
    close();
    resetForm();
  }, [close, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "signin") {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (authError) { setError(authError.message); return; }
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      handleClose();
    } else {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/markets` },
      });
      setLoading(false);
      if (authError) { setError(authError.message); return; }
      setSent(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0" style={{ background: "var(--bg-overlay)" }} onClick={handleClose} />

      <div
        className="relative w-full max-w-xs mx-4 rounded overflow-hidden"
        style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-lg)",
          animation: "modalIn 0.15s ease-out",
        }}
      >
        <button className="absolute top-2.5 right-2.5 p-1 rounded" style={{ color: "var(--fg-dim)" }} onClick={handleClose}>
          <X size={14} />
        </button>

        <div className="p-5">
          <div className="text-center mb-4">
            <div className="w-8 h-8 rounded flex items-center justify-center mx-auto mb-2" style={{ background: "var(--yellow)" }}>
              <span className="text-sm font-black" style={{ color: "var(--bg)" }}>K</span>
            </div>
            <h2 className="text-sm font-bold" style={{ color: "var(--fg)" }}>
              {sent ? "Check your email" : mode === "signin" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--fg-dim)" }}>
              {sent ? `Confirmation sent to ${email}` : mode === "signin" ? "Sign in to continue trading" : "Start trading prediction markets"}
            </p>
          </div>

          {sent ? (
            <div className="text-center">
              <CheckCircle2 size={28} className="mx-auto mb-3" style={{ color: "var(--green)" }} />
              <p className="text-xs mb-3" style={{ color: "var(--fg-muted)" }}>Click the link in your email to verify, then come back to sign in.</p>
              <button className="text-xs font-medium" style={{ color: "var(--green)" }} onClick={() => { setSent(false); openSignIn(); }}>Back to Sign In</button>
            </div>
          ) : (
            <>
              <div className="flex rounded p-0.5 mb-3" style={{ background: "var(--bg-surface)" }}>
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    className="flex-1 py-1.5 text-[11px] font-bold rounded transition-all"
                    style={{
                      background: mode === m ? "var(--bg-raised)" : "transparent",
                      color: mode === m ? "var(--fg)" : "var(--fg-dim)",
                      boxShadow: mode === m ? "var(--shadow-xs)" : "none",
                    }}
                    onClick={() => { setError(null); m === "signin" ? openSignIn() : openSignUp(); }}
                  >
                    {m === "signin" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--fg-dim)" }}>Email</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full px-2.5 py-2 text-xs rounded outline-none transition-colors"
                    style={{ background: "var(--bg-surface)", color: "var(--fg)", border: "1px solid var(--border)" }}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--fg-dim)" }}>Password</label>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                    className="w-full px-2.5 py-2 text-xs rounded outline-none transition-colors"
                    style={{ background: "var(--bg-surface)", color: "var(--fg)", border: "1px solid var(--border)" }}
                    placeholder="At least 6 characters"
                  />
                </div>

                {error && (
                  <div className="p-2 rounded text-[11px] font-medium" style={{ background: "var(--red-bg)", color: "var(--red)" }}>{error}</div>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full py-2 text-xs font-bold rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: "var(--yellow)", color: "var(--bg)" }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 size={14} className="animate-spin" />
                      {mode === "signin" ? "Signing in..." : "Creating account..."}
                    </span>
                  ) : mode === "signin" ? "Sign In" : "Create Account"}
                </button>
              </form>

              <p className="text-center text-[10px] mt-3" style={{ color: "var(--fg-dim)" }}>
                {mode === "signin" ? (
                  <>Don&apos;t have an account? <button className="font-semibold" style={{ color: "var(--green)" }} onClick={openSignUp}>Sign Up</button></>
                ) : (
                  <>Already have an account? <button className="font-semibold" style={{ color: "var(--green)" }} onClick={openSignIn}>Sign In</button></>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
