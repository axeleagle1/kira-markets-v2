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
      <div
        className="absolute inset-0 transition-opacity"
        style={{ background: "var(--bg-overlay)" }}
        onClick={handleClose}
      />

      <div
        className="relative w-full max-w-sm mx-4 rounded-xl overflow-hidden"
        style={{
          background: "var(--bg-raised)",
          boxShadow: "var(--shadow-lg)",
          animation: "modalIn 0.2s ease-out",
        }}
      >
        <button
          className="absolute top-3 right-3 p-1.5 rounded-md transition-colors"
          style={{ color: "var(--fg-dim)" }}
          onClick={handleClose}
        >
          <X size={16} />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-5">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
              style={{ background: "var(--yellow)" }}
            >
              <span className="text-lg font-black" style={{ color: "var(--fg)" }}>
                K
              </span>
            </div>
            <h2 className="text-base font-bold" style={{ color: "var(--fg)" }}>
              {sent
                ? "Check your email"
                : mode === "signin"
                  ? "Welcome back"
                  : "Create account"}
            </h2>
            <p className="text-xs mt-1" style={{ color: "var(--fg-dim)" }}>
              {sent
                ? `We sent a confirmation link to ${email}`
                : mode === "signin"
                  ? "Sign in to continue trading"
                  : "Start trading prediction markets"}
            </p>
          </div>

          {sent ? (
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--green-dim)" }}
              >
                <CheckCircle2 size={24} style={{ color: "var(--green)" }} />
              </div>
              <p className="text-[13px] mb-4" style={{ color: "var(--fg-muted)" }}>
                Click the link in your email to verify your account, then come
                back to sign in.
              </p>
              <button
                className="text-[13px] font-medium"
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
                className="flex rounded-lg p-0.5 mb-4"
                style={{ background: "var(--bg-surface)" }}
              >
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    className="flex-1 py-2 text-[13px] font-semibold rounded-md transition-all"
                    style={{
                      background:
                        mode === m ? "var(--bg-raised)" : "transparent",
                      color: mode === m ? "var(--fg)" : "var(--fg-dim)",
                      boxShadow:
                        mode === m ? "var(--shadow-xs)" : "none",
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

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div>
                  <label
                    className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
                    style={{ color: "var(--fg-dim)" }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 text-[13px] rounded-lg outline-none transition-colors"
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
                    className="block text-[11px] font-semibold uppercase tracking-wider mb-1"
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
                    className="w-full px-3 py-2.5 text-[13px] rounded-lg outline-none transition-colors"
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
                    className="p-2.5 rounded-lg text-xs font-medium"
                    style={{
                      background: "var(--red-bg)",
                      color: "var(--red)",
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-[13px] font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                  style={{
                    background: "var(--yellow)",
                    color: "var(--fg)",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      {mode === "signin"
                        ? "Signing in..."
                        : "Creating account..."}
                    </span>
                  ) : mode === "signin" ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              <p
                className="text-center text-xs mt-4"
                style={{ color: "var(--fg-dim)" }}
              >
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
            transform: scale(0.96) translateY(8px);
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
