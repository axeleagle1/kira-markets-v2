"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useQueryClient } from "@tanstack/react-query";

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
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);

      if (authError) {
        setError(authError.message);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      handleClose();
    } else {
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
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity"
        style={{ background: "rgba(0, 0, 0, 0.5)" }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          animation: "modalIn 0.2s ease-out",
        }}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-surface)]"
          onClick={handleClose}
          style={{ color: "var(--fg-dim)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "var(--yellow)" }}
            >
              <span className="text-xl font-bold" style={{ color: "var(--fg)" }}>
                K
              </span>
            </div>
            <h2 className="text-lg font-bold" style={{ color: "var(--fg)" }}>
              {sent ? "Check your email" : mode === "signin" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-xs mt-1" style={{ color: "var(--fg-dim)" }}>
              {sent
                ? `We sent a confirmation link to ${email}`
                : mode === "signin"
                  ? "Sign in to continue trading"
                  : "Start trading prediction markets"}
            </p>
          </div>

          {/* Sent confirmation */}
          {sent ? (
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--green-dim)" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--fg-muted)" }}>
                Click the link in your email to verify your account, then come back to sign in.
              </p>
              <button
                className="text-sm font-medium"
                style={{ color: "var(--green)" }}
                onClick={() => {
                  setSent(false);
                  openSignIn();
                }}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              {/* Mode tabs */}
              <div
                className="flex rounded-xl p-1 mb-5"
                style={{ background: "var(--bg-surface)" }}
              >
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
                    style={{
                      background: mode === m ? "var(--bg)" : "transparent",
                      color: mode === m ? "var(--fg)" : "var(--fg-dim)",
                      boxShadow: mode === m ? "var(--shadow-sm)" : "none",
                    }}
                    onClick={() => {
                      setError(null);
                      if (m === "signin") openSignIn();
                      else openSignUp();
                    }}
                  >
                    {m === "signin" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div>
                  <label
                    className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: "var(--fg-dim)" }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-colors"
                    style={{
                      background: "var(--bg-surface)",
                      color: "var(--fg)",
                      border: "1px solid var(--border)",
                    }}
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label
                    className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: "var(--fg-dim)" }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-colors"
                    style={{
                      background: "var(--bg-surface)",
                      color: "var(--fg)",
                      border: "1px solid var(--border)",
                    }}
                    placeholder="At least 6 characters"
                  />
                </div>

                {error && (
                  <div
                    className="p-3 rounded-xl text-xs font-medium"
                    style={{ background: "var(--red-dim)", color: "var(--red)" }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-sm font-bold rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                  style={{ background: "var(--yellow)", color: "var(--fg)" }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[var(--fg)] border-t-transparent rounded-full animate-spin" />
                      {mode === "signin" ? "Signing in..." : "Creating account..."}
                    </span>
                  ) : mode === "signin" ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* Footer */}
              <p className="text-center text-xs mt-4" style={{ color: "var(--fg-dim)" }}>
                {mode === "signin" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button
                      className="font-semibold"
                      style={{ color: "var(--green)" }}
                      onClick={openSignUp}
                    >
                      Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      className="font-semibold"
                      style={{ color: "var(--green)" }}
                      onClick={openSignIn}
                    >
                      Sign In
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
