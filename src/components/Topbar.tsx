"use client";

import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { useApp } from "@/lib/store";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/employees": "Data Karyawan",
  "/users": "Data User",
  "/holidays": "Tanggal Merah",
  "/leave/manage": "Kelola Cuti",
  "/leave/request": "Ajukan Cuti",
  "/leave/history": "Riwayat Cuti",
  "/reminders": "Kontak Reminder",
};

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const { currentUser, currentEmployee, logout } = useApp();
  const title =
    Object.entries(TITLES).find(([href]) => pathname === href || pathname.startsWith(href + "/"))?.[1] ?? "Arunika";
  const displayName = currentEmployee?.nama ?? currentUser?.email ?? "";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-card-border bg-card/80 px-4 py-3 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="text-text-muted lg:hidden" aria-label="Menu">
          <Menu size={22} />
        </button>
        <span className="font-semibold text-text-heading">{title}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <div className="text-sm font-medium text-text-main">{displayName}</div>
          <div className="text-xs text-text-muted">{currentUser?.role}</div>
        </div>
        <button
          onClick={() => void logout()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-card/60 px-3 py-1.5 text-xs font-medium text-text-main transition hover:border-danger/40 hover:text-danger"
        >
          <LogOut size={14} /> Keluar
        </button>
      </div>
    </header>
  );
}
