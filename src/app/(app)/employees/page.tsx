"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Filter, Plus, Upload } from "lucide-react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge, Button, Card, FormField, Input, Modal, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import {
  formatTanggal,
  getMasaKerja,
  getTotalHakCuti,
  getTotalSisaCuti,
  getYearsWorked,
  isSeniorEligible,
} from "@/lib/helpers";
import type { Employee } from "@/types";

export default function EmployeesPage() {
  return (
    <RoleGuard allow={["ADMIN", "SUPERADMIN"]}>
      <Employees />
    </RoleGuard>
  );
}

type EmpForm = Partial<Employee> & { email?: string };

function Employees() {
  const { employees, users, leaveRequests, compensationHistories, divisiList, jabatanList, saveEmployee, deleteEmployee, adjustLeave, refresh } = useApp();
  const { notify } = useToast();

  const onImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement;
    if (!input.files?.[0]) {
      notify("Pilih file Excel terlebih dahulu.", "danger");
      return;
    }
    const fd = new FormData();
    fd.append("file", input.files[0]);
    try {
      const res = await fetch("/api/employees/import", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal import.");
      notify(data.message ?? "Import selesai.", "success");
      form.reset();
      await refresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Gagal import.", "danger");
    }
  };

  const [fDivisi, setFDivisi] = useState("");
  const [fJabatan, setFJabatan] = useState("");
  const [fMasaKerja, setFMasaKerja] = useState("");
  const [fPunyaCuti, setFPunyaCuti] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [detailEmp, setDetailEmp] = useState<Employee | null>(null);
  const [adjustEmp, setAdjustEmp] = useState<Employee | null>(null);

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const rows = employees.filter((e) => {
    if (fDivisi && e.divisi !== fDivisi) return false;
    if (fJabatan && e.jabatan !== fJabatan) return false;
    if (fPunyaCuti === "1" && getTotalSisaCuti(e) <= 0) return false;
    if (fPunyaCuti === "0" && getTotalSisaCuti(e) > 0) return false;
    if (fMasaKerja) {
      const y = getYearsWorked(e);
      if (y === null) return false;
      if (fMasaKerja === "<1" && y >= 1) return false;
      if (fMasaKerja === "1-3" && (y < 1 || y > 3)) return false;
      if (fMasaKerja === ">3" && y <= 3) return false;
    }
    return true;
  });

  const columns: Column<Employee>[] = [
    { key: "nama", header: "Nama", searchValue: (e) => e.nama, sortValue: (e) => e.nama, render: (e) => <span className="font-semibold">{e.nama}</span> },
    { key: "email", header: "Email", searchValue: (e) => (e.userId ? userById.get(e.userId)?.email ?? "" : ""), render: (e) => (e.userId ? userById.get(e.userId)?.email ?? "-" : "-") },
    {
      key: "role", header: "Role / Status",
      render: (e) => {
        const u = e.userId ? userById.get(e.userId) : null;
        if (!u) return "-";
        return <div className="space-y-1"><Badge tone="neutral">{u.role}</Badge><div><Badge tone={u.isActive ? "approved" : "rejected"}>{u.isActive ? "Aktif" : "Nonaktif"}</Badge></div></div>;
      },
    },
    { key: "divisi", header: "Divisi", render: (e) => e.divisi ?? "-", searchValue: (e) => e.divisi ?? "" },
    { key: "jabatan", header: "Jabatan", render: (e) => <div>{e.jabatan ?? "-"}{e.jabatan2 && <div className="text-xs text-text-muted">{e.jabatan2}</div>}</div>, searchValue: (e) => `${e.jabatan} ${e.jabatan2}` },
    { key: "masuk", header: "Tanggal Masuk", render: (e) => formatTanggal(e.tanggalMulaiBekerja), sortValue: (e) => e.tanggalMulaiBekerja ?? "" },
    { key: "masa", header: "Masa Kerja", render: (e) => <Badge tone="neutral">{getMasaKerja(e)}</Badge> },
    { key: "cuti", header: "Hak Cuti", render: (e) => `${getTotalSisaCuti(e)} / ${getTotalHakCuti(e)}`, sortValue: (e) => getTotalSisaCuti(e) },
    {
      key: "aksi", header: "Aksi",
      render: (e) => (
        <div className="flex flex-wrap gap-1">
          <Button size="sm" onClick={() => setDetailEmp(e)}>Detail</Button>
          <Button size="sm" variant="outline" onClick={() => setEditEmp(e)}>Edit</Button>
          <Button size="sm" variant="info" onClick={() => setAdjustEmp(e)}>+ Cuti</Button>
          <Button size="sm" variant="danger" onClick={() => { if (confirm("Yakin ingin menghapus karyawan ini?")) deleteEmployee(e.id); }}>Hapus</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Data Karyawan"
        action={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus size={15} /> Tambah Karyawan</Button>}
      />

      <Card>
        <details>
          <summary className="flex cursor-pointer items-center gap-2 font-semibold text-text-heading"><Upload size={16} /> Import Data Excel</summary>
          <form className="mt-4 flex flex-wrap items-center gap-3" onSubmit={onImport}>
            <Input name="file" type="file" accept=".xlsx,.xls" className="max-w-xs" />
            <Button size="sm" variant="success" type="submit">Import</Button>
            <small className="text-text-muted">Kolom: E-MAIL, NAMA, DIVISI, JABATAN, JABATAN 2, TANGGAL LAHIR, TANGGAL MULAI BEKERJA.</small>
          </form>
        </details>
      </Card>

      <Card>
        <details>
          <summary className="flex cursor-pointer items-center gap-2 font-semibold text-text-heading"><Filter size={16} /> Filter &amp; Export Data</summary>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <FormField label="Divisi">
              <Select value={fDivisi} onChange={(e) => setFDivisi(e.target.value)}>
                <option value="">Semua Divisi</option>
                {divisiList.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </FormField>
            <FormField label="Jabatan">
              <Select value={fJabatan} onChange={(e) => setFJabatan(e.target.value)}>
                <option value="">Semua Jabatan</option>
                {jabatanList.map((j) => <option key={j} value={j}>{j}</option>)}
              </Select>
            </FormField>
            <FormField label="Masa Kerja">
              <Select value={fMasaKerja} onChange={(e) => setFMasaKerja(e.target.value)}>
                <option value="">Semua Masa Kerja</option>
                <option value="<1">Kurang dari 1 Tahun</option>
                <option value="1-3">1 - 3 Tahun</option>
                <option value=">3">Lebih dari 3 Tahun</option>
              </Select>
            </FormField>
            <FormField label="Sisa Cuti">
              <Select value={fPunyaCuti} onChange={(e) => setFPunyaCuti(e.target.value)}>
                <option value="">Semua</option>
                <option value="1">Punya Sisa</option>
                <option value="0">Habis</option>
              </Select>
            </FormField>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setFDivisi(""); setFJabatan(""); setFMasaKerja(""); setFPunyaCuti(""); }}>Reset</Button>
            <Button size="sm" variant="success" onClick={() => { window.location.href = "/api/employees/export"; }}><FileSpreadsheet size={14} /> Export Excel</Button>
          </div>
        </details>
      </Card>

      <Card noPadding className="p-3">
        <DataTable columns={columns} rows={rows} />
      </Card>

      {/* Create / Edit */}
      <EmployeeFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tambah Karyawan Baru"
        divisiList={divisiList}
        jabatanList={jabatanList}
        onSave={(form) => { saveEmployee(form); setCreateOpen(false); }}
        requireEmail
      />
      <EmployeeFormModal
        open={editEmp !== null}
        onClose={() => setEditEmp(null)}
        title="Edit Data Karyawan"
        divisiList={divisiList}
        jabatanList={jabatanList}
        initial={editEmp ?? undefined}
        onSave={(form) => { saveEmployee({ ...form, id: editEmp!.id }); setEditEmp(null); }}
      />

      {/* Adjust compensation */}
      <Modal open={adjustEmp !== null} onClose={() => setAdjustEmp(null)} title="Tambah Cuti Kompensasi">
        {adjustEmp && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = e.currentTarget;
              const jumlah = Number((f.elements.namedItem("jumlah") as HTMLInputElement).value);
              const alasan = (f.elements.namedItem("alasan") as HTMLTextAreaElement).value;
              adjustLeave(adjustEmp.id, jumlah, alasan);
              setAdjustEmp(null);
            }}
            className="space-y-4"
          >
            <p className="text-sm text-text-muted">Untuk: <strong className="text-text-main">{adjustEmp.nama}</strong></p>
            <FormField label="Jumlah Hari"><Input name="jumlah" type="number" min={1} defaultValue={1} required /></FormField>
            <FormField label="Alasan Kompensasi"><Textarea name="alasan" rows={3} placeholder="Wajib diisi..." required /></FormField>
            <div className="flex gap-2"><Button variant="success" type="submit">Simpan</Button><Button variant="outline" type="button" onClick={() => setAdjustEmp(null)}>Batal</Button></div>
          </form>
        )}
      </Modal>

      {/* Detail */}
      <Modal open={detailEmp !== null} onClose={() => setDetailEmp(null)} title={`Detail: ${detailEmp?.nama ?? ""}`} width="max-w-2xl">
        {detailEmp && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <Info label="Divisi" value={detailEmp.divisi ?? "-"} />
              <Info label="Jabatan" value={detailEmp.jabatan ?? "-"} />
              <Info label="Sisa Cuti" value={`${getTotalSisaCuti(detailEmp)} Hari (Kompensasi: ${detailEmp.sisaCutiTambahan})`} />
              <Info label="Status Akun" value={detailEmp.userId ? `Aktif (${userById.get(detailEmp.userId)?.email})` : "Tanpa Akun"} />
            </div>
            <div>
              <div className="mb-1 text-xs text-text-muted">Hak Libur Nasional (Syarat: 3 Tahun)</div>
              {isSeniorEligible(detailEmp) ? <Badge tone="approved">✓ Eligible</Badge> : <Badge tone="pending">Belum Eligible</Badge>}
            </div>
            <hr className="border-card-border" />
            <div>
              <h4 className="mb-2 font-semibold text-text-heading">Riwayat Pengajuan Cuti</h4>
              {leaveRequests.filter((l) => l.employeeId === detailEmp.id).length ? (
                <table className="w-full text-xs">
                  <thead className="text-text-muted"><tr><th className="text-left">Tanggal</th><th className="text-left">Hari</th><th className="text-left">Status</th></tr></thead>
                  <tbody>
                    {leaveRequests.filter((l) => l.employeeId === detailEmp.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((l) => (
                      <tr key={l.id} className="border-t border-card-border/60"><td className="py-1">{formatTanggal(l.tanggalMulai)} s/d {formatTanggal(l.tanggalSelesai)}</td><td>{l.jumlahHari}</td><td><StatusBadge status={l.status} /></td></tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-text-muted">Belum ada riwayat.</p>}
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-text-heading">Riwayat Cuti Kompensasi</h4>
              {compensationHistories.filter((c) => c.employeeId === detailEmp.id).length ? (
                <table className="w-full text-xs">
                  <thead className="text-text-muted"><tr><th className="text-left">Tanggal</th><th className="text-left">Hari</th><th className="text-left">Alasan</th></tr></thead>
                  <tbody>
                    {compensationHistories.filter((c) => c.employeeId === detailEmp.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((c) => (
                      <tr key={c.id} className="border-t border-card-border/60"><td className="py-1">{formatTanggal(c.createdAt.slice(0, 10))}</td><td className="font-bold text-success">+{c.jumlahHari}</td><td>{c.alasan}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-text-muted">Belum ada riwayat kompensasi.</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs text-text-muted">{label}</div><strong className="text-text-main">{value}</strong></div>;
}

function EmployeeFormModal({
  open, onClose, title, initial, divisiList, jabatanList, onSave, requireEmail = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  initial?: Employee;
  divisiList: string[];
  jabatanList: string[];
  onSave: (form: EmpForm) => void;
  requireEmail?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = e.currentTarget;
          const get = (n: string) => (f.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement)?.value || null;
          onSave({
            nama: get("nama") ?? "",
            ...(requireEmail ? { email: get("email") ?? "" } : {}),
            divisi: get("divisi"),
            jabatan: get("jabatan"),
            jabatan2: get("jabatan2"),
            tanggalLahir: get("tanggalLahir"),
            tanggalMulaiBekerja: get("tanggalMulaiBekerja"),
          });
        }}
        className="grid grid-cols-2 gap-4"
      >
        <div className="col-span-2"><FormField label="Nama Lengkap"><Input name="nama" defaultValue={initial?.nama} required /></FormField></div>
        {requireEmail && <div className="col-span-2"><FormField label="Email (Untuk Login)" hint="Akun login dibuat otomatis di fase backend."><Input name="email" type="email" required /></FormField></div>}
        <FormField label="Divisi">
          <Select name="divisi" defaultValue={initial?.divisi ?? ""}>
            <option value="">-- Pilih Divisi --</option>
            {divisiList.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </FormField>
        <FormField label="Jabatan">
          <Select name="jabatan" defaultValue={initial?.jabatan ?? ""}>
            <option value="">-- Pilih Jabatan --</option>
            {jabatanList.map((j) => <option key={j} value={j}>{j}</option>)}
          </Select>
        </FormField>
        <FormField label="Jabatan 2 (Posisi Kerja)"><Input name="jabatan2" defaultValue={initial?.jabatan2 ?? ""} /></FormField>
        <FormField label="Tanggal Lahir"><Input name="tanggalLahir" type="date" defaultValue={initial?.tanggalLahir ?? ""} /></FormField>
        <FormField label="Tanggal Mulai Bekerja"><Input name="tanggalMulaiBekerja" type="date" defaultValue={initial?.tanggalMulaiBekerja ?? ""} /></FormField>
        <div className="col-span-2 flex gap-2"><Button type="submit">Simpan</Button><Button type="button" variant="outline" onClick={onClose}>Batal</Button></div>
      </form>
    </Modal>
  );
}
