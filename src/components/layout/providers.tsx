"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthModalProvider } from "@/contexts/auth-modal-context";
import { AuthModal } from "@/components/auth/auth-modal";
import { ToastProvider } from "@/contexts/toast-context";
import { ToastContainer } from "@/components/ui/toast-container";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthModalProvider>
        <ToastProvider>
          {children}
          <AuthModal />
          <ToastContainer />
        </ToastProvider>
      </AuthModalProvider>
    </QueryClientProvider>
  );
}
