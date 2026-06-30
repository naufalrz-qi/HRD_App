"use client";

import { ToastProvider } from "@/components/Toast";
import { AppProvider } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppProvider>{children}</AppProvider>
    </ToastProvider>
  );
}
