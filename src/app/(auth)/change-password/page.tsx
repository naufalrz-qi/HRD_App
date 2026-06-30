"use client";

import { useRouter } from "next/navigation";
import { Button, Card, FormField, Input } from "@/components/ui";
import { useToast } from "@/components/Toast";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { notify } = useToast();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const newPassword = (form.elements.namedItem("new_password") as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem("confirm_password") as HTMLInputElement).value;
    if (newPassword !== confirmPassword) {
      notify("Konfirmasi password tidak cocok.", "danger");
      return;
    }
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal mengubah password.");
      notify("Password berhasil diperbarui.", "success");
      router.push("/dashboard");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Gagal mengubah password.", "danger");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <h2 className="mb-4 text-2xl font-bold text-primary">Arunika</h2>
        <div className="mb-5 rounded-md border border-warning/30 bg-warning-light p-3 text-sm text-warning">
          Demi keamanan, silakan ganti password default Anda sekarang.
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField label="Password Baru">
            <Input type="password" name="new_password" minLength={6} required />
          </FormField>
          <FormField label="Konfirmasi Password Baru">
            <Input type="password" name="confirm_password" minLength={6} required />
          </FormField>
          <Button type="submit" className="w-full">
            Simpan Password Baru
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/login")}>
            Logout
          </Button>
        </form>
      </Card>
    </div>
  );
}
