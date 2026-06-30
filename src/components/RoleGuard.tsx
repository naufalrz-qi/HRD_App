"use client";

import { ShieldAlert } from "lucide-react";
import type { Role } from "@/types";
import { useApp } from "@/lib/store";
import { Card } from "./ui";

/** Setara dekorator @role_required di Flask. Untuk preview role di fase frontend. */
export function RoleGuard({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const { currentUser } = useApp();
  if (!currentUser) return null;
  if (!allow.includes(currentUser.role)) {
    return (
      <Card className="mx-auto mt-10 max-w-md text-center">
        <ShieldAlert className="mx-auto mb-3 text-danger" size={40} />
        <h3 className="mb-1 text-lg font-bold text-text-heading">Tidak Berwenang</h3>
        <p className="text-sm text-text-muted">
          Halaman ini hanya untuk: {allow.join(", ")}.
        </p>
      </Card>
    );
  }
  return <>{children}</>;
}
