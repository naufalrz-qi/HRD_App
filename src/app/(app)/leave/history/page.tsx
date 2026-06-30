"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";
import { Button, Card, StatusBadge } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { formatTanggal } from "@/lib/helpers";
import type { LeaveRequest } from "@/types";

export default function LeaveHistoryPage() {
  const { currentEmployee, leaveRequests } = useApp();

  if (!currentEmployee) {
    return <Card>Anda tidak memiliki data karyawan terkait.</Card>;
  }

  const rows = leaveRequests
    .filter((l) => l.employeeId === currentEmployee.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const columns: Column<LeaveRequest>[] = [
    { key: "created", header: "Tanggal Pengajuan", render: (r) => formatTanggal(r.createdAt.slice(0, 10)), sortValue: (r) => r.createdAt, searchValue: (r) => r.createdAt },
    { key: "mulai", header: "Mulai", render: (r) => formatTanggal(r.tanggalMulai), sortValue: (r) => r.tanggalMulai },
    { key: "selesai", header: "Selesai", render: (r) => formatTanggal(r.tanggalSelesai) },
    { key: "hari", header: "Jumlah Hari", render: (r) => `${r.jumlahHari} hari`, sortValue: (r) => r.jumlahHari },
    {
      key: "alasan", header: "Alasan", searchValue: (r) => r.alasan,
      render: (r) => (
        <div>
          {r.alasan}
          {r.status === "REJECTED" && r.alasanTolak && (
            <div className="text-xs font-semibold text-danger">Ditolak: {r.alasanTolak}</div>
          )}
        </div>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} />, searchValue: (r) => r.status },
  ];

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-heading">Riwayat Pengajuan Cuti</h2>
        <Link href="/leave/request"><Button size="sm">Ajukan Cuti Baru</Button></Link>
      </div>
      <DataTable columns={columns} rows={rows} emptyText="Belum ada riwayat pengajuan cuti." />
    </Card>
  );
}
