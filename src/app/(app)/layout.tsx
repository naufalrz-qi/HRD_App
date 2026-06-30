"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useApp } from "@/lib/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { loading, currentUser, refresh } = useApp();

  // Muat data saat masuk area app (mis. setelah login dari halaman publik).
  useEffect(() => {
    if (!currentUser) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 lg:p-6">
          <div key={pathname} className="animate-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
