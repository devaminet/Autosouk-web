import { QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import type { ReactNode } from "react";
import "../lib/i18n";
import { queryClient } from "../lib/queryClient";

type AppProvidersProps = {
  children: ReactNode;
};

// The fallback has no text, because translations are what it waits for.
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div className="min-h-dvh bg-paper" />}>
        {children}
      </Suspense>
    </QueryClientProvider>
  );
}
