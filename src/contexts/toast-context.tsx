"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 3;
const EXIT_ANIMATION_MS = 300;
const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    // Start exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Remove after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_ANIMATION_MS);
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

      setToasts((prev) => {
        const next = [...prev, { id, message, type }];
        // If over limit, mark oldest for exit
        if (next.length > MAX_TOASTS) {
          const oldest = next[0];
          next[0] = { ...oldest, exiting: true };
          setTimeout(() => {
            setToasts((p) => p.filter((t) => t.id !== oldest.id));
          }, EXIT_ANIMATION_MS);
        }
        return next;
      });

      // Auto-dismiss after timeout
      setTimeout(() => {
        removeToast(id);
      }, AUTO_DISMISS_MS);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
