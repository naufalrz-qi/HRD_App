"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, FormField, Input } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useApp } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { notify } = useToast();
  const { refresh } = useApp();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal masuk.");
      await refresh();
      router.push(data.mustChangePassword ? "/change-password" : "/dashboard");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Gagal masuk.", "danger");
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Hero */}
      <div className="relative hidden flex-col justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-12 text-white lg:flex">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:40px_40px]" />

        <div className="relative max-w-md">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-3xl shadow-glow">
            💼
          </div>
          <h1 className="mb-4 text-5xl font-extrabold tracking-tight">Arunika</h1>
          <p className="text-lg leading-relaxed text-slate-300">
            Sistem manajemen sumber daya manusia terpadu untuk pengelolaan karyawan, cuti, dan reminder kontrak.
          </p>
          <div className="mt-10 flex gap-6 text-sm text-slate-400">
            <div><div className="text-2xl font-bold text-white">3</div>Tingkat Akses</div>
            <div><div className="text-2xl font-bold text-white">⚡</div>Reminder Otomatis</div>
            <div><div className="text-2xl font-bold text-white">📊</div>Dashboard HR</div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-glow lg:hidden">
            💼
          </div>
          <h2 className="text-3xl font-extrabold text-text-heading">Masuk ke Akun</h2>
          <p className="mb-6 text-sm text-text-muted">Masukkan kredensial Anda untuk melanjutkan.</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField label="Email">
              <Input name="email" type="email" placeholder="nama@perusahaan.com" required />
            </FormField>
            <FormField label="Password">
              <Input name="password" type="password" placeholder="••••••••" required />
            </FormField>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memuat..." : "Masuk"}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-text-muted">
            © {new Date().getFullYear()} Arunika HR Suite
          </p>
        </div>
      </div>
    </div>
  );
}
