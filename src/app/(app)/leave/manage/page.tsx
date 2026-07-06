"use client";

import { useCallback, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { useApp } from "@/lib/store";
import { RoleGuard } from "@/components/RoleGuard";
import { Button, Card, FormField, Modal, Select, StatusBadge, Textarea } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { formatTanggal, formatTanggalPendek, getYearsWorked } from "@/lib/helpers";
import type { Employee, LeaveRequest } from "@/types";

export default function ManageLeavesPage() {
  return (
    <RoleGuard allow={["ADMIN", "SUPERADMIN"]}>
      <ManageLeaves />
    </RoleGuard>
  );
}

function ManageLeaves() {
  const { leaveRequests, employees, jabatanList, approveLeave, rejectLeave } = useApp();
  const [jabatan, setJabatan] = useState("");
  const [masaKerja, setMasaKerja] = useState("");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const empById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const matches = useCallback(
    (emp: Employee | undefined) => {
      if (!emp) return false;
      if (jabatan && emp.jabatan !== jabatan) return false;
      if (masaKerja) {
        const years = getYearsWorked(emp);
        if (years === null) return false;
        if (masaKerja === "<1" && years >= 1) return false;
        if (masaKerja === "1-3" && (years < 1 || years > 3)) return false;
        if (masaKerja === ">3" && years <= 3) return false;
      }
      return true;
    },
    [jabatan, masaKerja]
  );

  const filtered = useMemo(
    () => leaveRequests.filter((l) => matches(empById.get(l.employeeId))),
    [leaveRequests, empById, matches]
  );
  const pending = useMemo(
    () => filtered.filter((l) => l.status === "PENDING").sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [filtered]
  );
  const history = useMemo(
    () => filtered.filter((l) => l.status !== "PENDING").sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [filtered]
  );

  const historyColumns: Column<LeaveRequest>[] = [
    {
      key: "nama", header: "Karyawan", searchValue: (r) => empById.get(r.employeeId)?.nama ?? "",
      render: (r) => {
        const e = empById.get(r.employeeId);
        return <div><div className="font-semibold">{e?.nama}</div><div className="text-xs text-text-muted">{e?.jabatan} - {e?.divisi}</div></div>;
      },
    },
    { key: "mulai", header: "Mulai", render: (r) => formatTanggal(r.tanggalMulai), sortValue: (r) => r.tanggalMulai },
    { key: "selesai", header: "Selesai", render: (r) => formatTanggal(r.tanggalSelesai) },
    { key: "hari", header: "Hari", render: (r) => r.jumlahHari, sortValue: (r) => r.jumlahHari },
    {
      key: "alasan", header: "Alasan", searchValue: (r) => r.alasan,
      render: (r) => (
        <div>{r.alasan}{r.status === "REJECTED" && r.alasanTolak && <div className="text-xs font-semibold text-danger">Ditolak: {r.alasanTolak}</div>}</div>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  const confirmReject = () => {
    if (rejectId && rejectReason.trim()) {
      rejectLeave(rejectId, rejectReason.trim());
      setRejectId(null);
      setRejectReason("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <Card>
        <details>
          <summary className="cursor-pointer font-semibold text-text-heading">Filter Pengajuan Cuti</summary>
          <div className="mt-4 grid max-w-xl grid-cols-2 gap-4">
            <FormField label="Jabatan">
              <Select value={jabatan} onChange={(e) => setJabatan(e.target.value)}>
                <option value="">Semua Jabatan</option>
                {jabatanList.map((j) => <option key={j} value={j}>{j}</option>)}
              </Select>
            </FormField>
            <FormField label="Masa Kerja">
              <Select value={masaKerja} onChange={(e) => setMasaKerja(e.target.value)}>
                <option value="">Semua Masa Kerja</option>
                <option value="<1">Kurang dari 1 Tahun</option>
                <option value="1-3">1 - 3 Tahun</option>
                <option value=">3">Lebih dari 3 Tahun</option>
              </Select>
            </FormField>
          </div>
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={() => { setJabatan(""); setMasaKerja(""); }}>Reset</Button>
          </div>
        </details>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-heading">Menunggu Tanggapan</h2>
            <p className="text-sm text-text-muted">Daftar pengajuan cuti yang perlu ditinjau.</p>
          </div>
          <Button variant="outline" onClick={() => setHistoryOpen(true)}>Lihat Riwayat</Button>
        </div>

        {pending.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pending.map((l) => {
              const e = empById.get(l.employeeId);
              return (
                <div key={l.id} className="rounded-card border border-card-border p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-white">
                      {e?.nama.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-text-heading">{e?.nama}</div>
                      <div className="text-xs text-text-muted">{e?.jabatan} - {e?.divisi}</div>
                    </div>
                    <StatusBadge status={l.status} />
                  </div>
                  <div className="mb-3 flex items-center justify-between rounded-lg bg-black/[0.02] p-3 text-sm dark:bg-white/[0.03]">
                    <div><div className="text-xs text-text-muted">Mulai</div><strong>{formatTanggalPendek(l.tanggalMulai)}</strong></div>
                    <span className="text-text-muted">→</span>
                    <div className="text-right"><div className="text-xs text-text-muted">Selesai</div><strong>{formatTanggalPendek(l.tanggalSelesai)}</strong></div>
                  </div>
                  <div className="mb-2 flex items-center gap-2 text-sm text-text-main">
                    <Clock size={14} /> <strong>{l.jumlahHari}</strong> Hari Cuti
                  </div>
                  <div className="mb-4 text-sm text-text-main"><strong>Alasan:</strong> {l.alasan}</div>
                  <div className="flex gap-2">
                    <Button variant="success" className="flex-1" onClick={() => approveLeave(l.id)}>Setujui</Button>
                    <Button variant="danger" className="flex-1" onClick={() => setRejectId(l.id)}>Tolak</Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted">Tidak ada pengajuan cuti yang menunggu tanggapan.</p>
        )}
      </Card>

      {/* Reject modal */}
      <Modal open={rejectId !== null} onClose={() => setRejectId(null)} title="Tolak Pengajuan Cuti">
        <p className="mb-3 text-sm text-text-muted">
          Untuk: <strong className="text-text-main">{empById.get(leaveRequests.find((l) => l.id === rejectId)?.employeeId ?? -1)?.nama}</strong>
        </p>
        <FormField label="Alasan Penolakan">
          <Textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Wajib diisi..." required />
        </FormField>
        <div className="mt-4 flex gap-2">
          <Button variant="danger" onClick={confirmReject} disabled={!rejectReason.trim()}>Tolak Cuti</Button>
          <Button variant="outline" onClick={() => setRejectId(null)}>Batal</Button>
        </div>
      </Modal>

      {/* History modal */}
      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Riwayat Tanggapan" width="max-w-3xl">
        {history.length ? (
          <DataTable columns={historyColumns} rows={history} />
        ) : (
          <p className="text-sm text-text-muted">Belum ada riwayat tanggapan.</p>
        )}
      </Modal>
    </div>
  );
}
