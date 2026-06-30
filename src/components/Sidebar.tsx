"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Home,
  KeyRound,
  LogOut,
  PenSquare,
  Settings,
  Users,
} from "lucide-react";
import type { Role } from "@/types";
import { useApp } from "@/lib/store";
import { ThemeToggle } from "./ThemeToggle";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
}
interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "Menu Utama",
    items: [{ href: "/dashboard", label: "Dashboard", icon: <Home size={18} />, roles: ["SUPERADMIN", "ADMIN", "PEGAWAI"] }],
  },
  {
    title: "Data Master",
    items: [
      { href: "/employees", label: "Data Karyawan", icon: <Users size={18} />, roles: ["SUPERADMIN", "ADMIN"] },
      { href: "/users", label: "Data User", icon: <KeyRound size={18} />, roles: ["SUPERADMIN"] },
      { href: "/holidays", label: "Tanggal Merah", icon: <CalendarDays size={18} />, roles: ["SUPERADMIN", "ADMIN"] },
    ],
  },
  {
    title: "Kelola",
    items: [
      { href: "/leave/manage", label: "Kelola Cuti", icon: <ClipboardList size={18} />, roles: ["SUPERADMIN", "ADMIN"] },
      { href: "/reminders", label: "Kontak Reminder", icon: <Bell size={18} />, roles: ["SUPERADMIN"] },
    ],
  },
  {
    title: "Menu Cuti",
    items: [
      { href: "/leave/request", label: "Ajukan Cuti", icon: <PenSquare size={18} />, roles: ["PEGAWAI"] },
      { href: "/leave/history", label: "Riwayat Cuti", icon: <ClipboardList size={18} />, roles: ["PEGAWAI"] },
    ],
  },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { currentUser, currentEmployee, logout } = useApp();
  const role = currentUser?.role ?? "PEGAWAI";
  const displayName = currentEmployee?.nama ?? currentUser?.email ?? "User";

  return (
    <>
      {/* Overlay (mobile) */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/5 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-300 transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
            <Briefcase size={18} />
          </div>
          <div>
            <div className="text-lg font-extrabold leading-none text-white">Arunika</div>
            <div className="text-[0.65rem] uppercase tracking-widest text-slate-500">HR Suite</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {SECTIONS.map((section) => {
            const items = section.items.filter((i) => i.roles.includes(role));
            if (items.length === 0) return null;
            return (
              <div key={section.title} className="mb-4">
                <div className="px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">
                  {section.title}
                </div>
                {items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`group relative mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? "bg-gradient-to-r from-primary/25 to-accent/10 text-white shadow-sm"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-accent" />
                      )}
                      <span className={active ? "text-primary" : "opacity-90 transition group-hover:scale-110"}>{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-semibold text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{displayName}</div>
              <div className="text-xs text-slate-400">{role}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 text-xs">
            <ThemeToggle className="justify-center rounded-md bg-white/5 px-2 py-2 text-slate-300 hover:bg-white/10" />
            <Link
              href="/change-password"
              onClick={onClose}
              className="flex items-center justify-center gap-1 rounded-md bg-white/5 px-2 py-2 text-slate-300 hover:bg-white/10"
            >
              <Settings size={14} /> Sandi
            </Link>
            <button
              onClick={() => void logout()}
              className="flex items-center justify-center gap-1 rounded-md bg-white/5 px-2 py-2 text-danger hover:bg-white/10"
            >
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
