"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge, Button, Card, FormField, Input, Modal, PageHeader, Select } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import type { ReminderContact } from "@/types";

export default function RemindersPage() {
  return (
    <RoleGuard allow={["SUPERADMIN"]}>
      <Reminders />
    </RoleGuard>
  );
}

function Reminders() {
  const { reminderContacts, schedulerSettings, saveReminder, deleteReminder, updateScheduler, triggerReminder } = useApp();
  const { notify } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editContact, setEditContact] = useState<ReminderContact | null>(null);

  const pad = (n: number) => String(n).padStart(2, "0");
  const currentTime = `${pad(schedulerSettings.hour)}:${pad(schedulerSettings.minute)}`;

  const columns: Column<ReminderContact>[] = [
    { key: "nama", header: "Nama", render: (c) => c.nama ?? "-", searchValue: (c) => c.nama ?? "", sortValue: (c) => c.nama ?? "" },
    { key: "nomor", header: "Nomor WhatsApp", render: (c) => c.nomorTelepon, searchValue: (c) => c.nomorTelepon },
    { key: "kategori", header: "Kategori", render: (c) => c.kategori ?? "-", searchValue: (c) => c.kategori ?? "" },
    { key: "status", header: "Status", render: (c) => <Badge tone={c.isActive ? "approved" : "rejected"}>{c.isActive ? "Aktif" : "Non-Aktif"}</Badge> },
    {
      key: "aksi", header: "Aksi",
      render: (c) => (
        <div className="flex gap-1">
          <Button size="sm" variant="warning" onClick={() => setEditContact(c)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => { if (confirm("Yakin ingin menghapus kontak ini?")) deleteReminder(c.id); }}>Hapus</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kelola Kontak Reminder"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="success" onClick={() => { if (confirm("Jalankan pengecekan & kirim reminder sekarang?")) triggerReminder(); }}>Test Jalankan Reminder</Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}><Plus size={15} /> Tambah Kontak</Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-semibold text-text-heading">Pengaturan Jadwal Harian</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = e.currentTarget;
              const [h, m] = (f.elements.namedItem("time") as HTMLInputElement).value.split(":").map(Number);
              const limit = Number((f.elements.namedItem("limit") as HTMLInputElement).value);
              updateScheduler({ hour: h, minute: m, maxTextLimit: limit });
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <FormField label="Waktu Eksekusi Harian"><Input name="time" type="time" defaultValue={currentTime} required /></FormField>
            <div className="w-36"><FormField label="Batas Teks (Orang)"><Input name="limit" type="number" min={1} max={100} defaultValue={schedulerSettings.maxTextLimit} required /></FormField></div>
            <Button type="submit">Simpan Pengaturan</Button>
          </form>
          <small className="mt-2 block text-text-muted">Jika daftar peringatan lebih panjang dari batas ini, akan dikirim dalam format Excel.</small>
        </Card>

        <Card className="border-info/40">
          <h3 className="mb-3 font-semibold text-info">Test Jadwal (Sekali Saja)</h3>
          <form onSubmit={(e) => { e.preventDefault(); notify("Di serverless (Vercel Cron), jadwal harian utama yang dipakai. Gunakan \"Test Jalankan Reminder\" untuk uji manual.", "info"); }} className="flex items-end gap-3">
            <FormField label="Jadwalkan Test Pada Jam"><Input type="time" required /></FormField>
            <Button type="submit" variant="info">Jadwalkan Test</Button>
          </form>
          <small className="mt-2 block text-text-muted">Menjadwalkan 1x eksekusi tanpa mengubah jadwal harian utama.</small>
        </Card>
      </div>

      <Card noPadding className="p-3"><DataTable columns={columns} rows={reminderContacts} emptyText="Belum ada kontak reminder." /></Card>

      <ReminderFormModal open={createOpen} onClose={() => setCreateOpen(false)} title="Tambah Kontak" onSave={(c) => { saveReminder(c); setCreateOpen(false); }} />
      <ReminderFormModal open={editContact !== null} onClose={() => setEditContact(null)} title="Edit Kontak" initial={editContact ?? undefined} onSave={(c) => { saveReminder({ ...c, id: editContact!.id }); setEditContact(null); }} />
    </div>
  );
}

function ReminderFormModal({
  open, onClose, title, initial, onSave,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  initial?: ReminderContact;
  onSave: (c: Partial<ReminderContact>) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = e.currentTarget;
          onSave({
            nama: (f.elements.namedItem("nama") as HTMLInputElement).value || null,
            nomorTelepon: (f.elements.namedItem("nomor") as HTMLInputElement).value,
            kategori: (f.elements.namedItem("kategori") as HTMLSelectElement).value || null,
            isActive: (f.elements.namedItem("isActive") as HTMLSelectElement).value === "1",
          });
        }}
        className="space-y-4"
      >
        <FormField label="Nama"><Input name="nama" defaultValue={initial?.nama ?? ""} /></FormField>
        <FormField label="Nomor WhatsApp" hint="Format: +628xxx"><Input name="nomor" defaultValue={initial?.nomorTelepon} placeholder="+628..." required /></FormField>
        <FormField label="Kategori">
          <Select name="kategori" defaultValue={initial?.kategori ?? "HRD"}>
            <option value="HRD">HRD</option>
            <option value="Admin">Admin</option>
            <option value="Karyawan">Karyawan</option>
          </Select>
        </FormField>
        <FormField label="Status">
          <Select name="isActive" defaultValue={initial ? (initial.isActive ? "1" : "0") : "1"}>
            <option value="1">Aktif</option>
            <option value="0">Non-Aktif</option>
          </Select>
        </FormField>
        <div className="flex gap-2"><Button type="submit">Simpan</Button><Button type="button" variant="outline" onClick={onClose}>Batal</Button></div>
      </form>
    </Modal>
  );
}
