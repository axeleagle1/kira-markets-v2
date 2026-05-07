"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface AuthModalContextValue {
  isOpen: boolean;
  mode: "signin" | "signup";
  openSignIn: () => void;
  openSignUp: () => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const openSignIn = useCallback(() => {
    setMode("signin");
    setIsOpen(true);
  }, []);

  const openSignUp = useCallback(() => {
    setMode("signup");
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <AuthModalContext.Provider value={{ isOpen, mode, openSignIn, openSignUp, close }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
