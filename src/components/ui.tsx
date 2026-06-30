"use client";

import { useEffect } from "react";
import type { LeaveStatus } from "@/types";

// ===== Card =====
export function Card({
  children,
  className = "",
  noPadding = false,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-card border border-card-border bg-card/90 shadow-card backdrop-blur-sm transition duration-300 ${
        hover ? "hover:-translate-y-0.5 hover:shadow-card-lg" : ""
      } ${noPadding ? "" : "p-5"} ${className}`}
    >
      {children}
    </div>
  );
}

// ===== Button =====
type Variant = "primary" | "outline" | "success" | "danger" | "info" | "warning";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-gradient-to-br from-primary to-accent text-white shadow-sm hover:shadow-glow hover:brightness-110",
  success: "bg-success text-white shadow-sm hover:brightness-105",
  danger: "bg-danger text-white shadow-sm hover:brightness-105",
  info: "bg-info text-white shadow-sm hover:brightness-105",
  warning: "bg-warning text-white shadow-sm hover:brightness-105",
  outline:
    "border border-card-border bg-card/60 text-text-main hover:border-primary/40 hover:bg-primary-light hover:text-primary",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }) {
  const sizeCls = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${sizeCls} ${VARIANTS[variant]} ${className}`}
    />
  );
}

// ===== Badge =====
export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "approved" | "rejected" | "pending" | "neutral";
  className?: string;
}) {
  const tones: Record<string, string> = {
    approved: "bg-success-light text-success",
    rejected: "bg-danger-light text-danger",
    pending: "bg-warning-light text-warning",
    neutral: "bg-primary-light text-primary",
  };
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: LeaveStatus }) {
  if (status === "APPROVED") return <Badge tone="approved">Disetujui</Badge>;
  if (status === "REJECTED") return <Badge tone="rejected">Ditolak</Badge>;
  return <Badge tone="pending">Menunggu</Badge>;
}

// ===== StatCard =====
export function StatCard({
  icon,
  label,
  value,
  tone = "primary",
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "primary" | "success" | "danger" | "warning" | "info";
  children?: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    primary: "from-indigo-500 to-violet-500 shadow-indigo-500/30",
    success: "from-emerald-500 to-teal-500 shadow-emerald-500/30",
    danger: "from-rose-500 to-red-500 shadow-rose-500/30",
    warning: "from-amber-500 to-orange-500 shadow-amber-500/30",
    info: "from-sky-500 to-blue-500 shadow-sky-500/30",
  };
  return (
    <Card hover>
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xl text-white shadow-lg ${tones[tone]}`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium text-text-muted">{label}</div>
          <div className="text-2xl font-bold text-text-heading">{value}</div>
          {children}
        </div>
      </div>
    </Card>
  );
}

// ===== Form fields =====
export function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text-main">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-text-muted">{hint}</span>}
    </label>
  );
}

const FIELD_CLS =
  "w-full rounded-md border border-card-border bg-card px-3 py-2.5 text-sm text-text-main outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${FIELD_CLS} ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${FIELD_CLS} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${FIELD_CLS} ${props.className ?? ""}`} />;
}

// ===== Modal =====
export function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className={`max-h-[90vh] w-full ${width} overflow-y-auto rounded-card border border-card-border bg-card p-5 shadow-card-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-heading">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main" aria-label="Tutup">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ===== Section heading =====
export function PageHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-xl font-bold text-text-heading">{title}</h2>
      {action}
    </div>
  );
}
