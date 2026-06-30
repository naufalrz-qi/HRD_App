"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge, Button, Card, FormField, Input, Modal, PageHeader, Select } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import type { Role, User } from "@/types";

export default function UsersPage() {
  return (
    <RoleGuard allow={["SUPERADMIN"]}>
      <Users />
    </RoleGuard>
  );
}

function Users() {
  const { users, employees, saveUser, deleteUser } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const empByUser = useMemo(() => new Map(employees.filter((e) => e.userId).map((e) => [e.userId!, e])), [employees]);

  const columns: Column<User>[] = [
    { key: "email", header: "Email", searchValue: (u) => u.email, sortValue: (u) => u.email, render: (u) => u.email },
    { key: "role", header: "Role", render: (u) => <Badge tone="neutral">{u.role}</Badge>, searchValue: (u) => u.role },
    { key: "status", header: "Status", render: (u) => <Badge tone={u.isActive ? "approved" : "rejected"}>{u.isActive ? "Aktif" : "Nonaktif"}</Badge> },
    { key: "emp", header: "Karyawan Terhubung", render: (u) => empByUser.get(u.id)?.nama ?? "-" },
    {
      key: "aksi", header: "Aksi",
      render: (u) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => setEditUser(u)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => { if (confirm("Yakin ingin menghapus user ini?")) deleteUser(u.id); }}>Hapus</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Data User (Login)" action={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus size={15} /> Tambah User</Button>} />
      <Card noPadding className="p-3"><DataTable columns={columns} rows={users} /></Card>

      <UserFormModal open={createOpen} onClose={() => setCreateOpen(false)} title="Tambah User" onSave={(u) => { saveUser(u); setCreateOpen(false); }} requirePassword />
      <UserFormModal open={editUser !== null} onClose={() => setEditUser(null)} title="Edit User" initial={editUser ?? undefined} onSave={(u) => { saveUser({ ...u, id: editUser!.id }); setEditUser(null); }} />
    </div>
  );
}

function UserFormModal({
  open, onClose, title, initial, onSave, requirePassword = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  initial?: User;
  onSave: (u: Partial<User> & { password?: string }) => void;
  requirePassword?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = e.currentTarget;
          const pwEl = f.elements.namedItem("password") as HTMLInputElement | null;
          onSave({
            email: (f.elements.namedItem("email") as HTMLInputElement).value,
            role: (f.elements.namedItem("role") as HTMLSelectElement).value as Role,
            isActive: (f.elements.namedItem("isActive") as HTMLSelectElement).value === "1",
            password: pwEl?.value || undefined,
          });
        }}
        className="space-y-4"
      >
        <FormField label="Email"><Input name="email" type="email" defaultValue={initial?.email} required /></FormField>
        <FormField label="Password" hint={requirePassword ? "Wajib diisi untuk user baru." : "Kosongkan jika tidak diubah."}>
          <Input name="password" type="password" required={requirePassword} />
        </FormField>
        <FormField label="Role">
          <Select name="role" defaultValue={initial?.role ?? "ADMIN"}>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPERADMIN">SUPERADMIN</option>
            <option value="PEGAWAI">PEGAWAI</option>
          </Select>
        </FormField>
        <FormField label="Status">
          <Select name="isActive" defaultValue={initial ? (initial.isActive ? "1" : "0") : "1"}>
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </Select>
        </FormField>
        <div className="flex gap-2"><Button type="submit">Simpan</Button><Button type="button" variant="outline" onClick={onClose}>Batal</Button></div>
      </form>
    </Modal>
  );
}
