"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2, ClipboardList, FileText, PenSquare, Plus, Users } from "lucide-react";
import { useApp } from "@/lib/store";
import { Badge, Button, Card, StatCard, StatusBadge } from "@/components/ui";
import {
  formatTanggalPanjang,
  getTotalHakCuti,
  getTotalSisaCuti,
  parseDate,
} from "@/lib/helpers";
import type { Employee } from "@/types";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

/** Hari menuju ultah berikutnya (0 = hari ini). */
function daysToBirthday(emp: Employee, today: Date): number | null {
  const d = parseDate(emp.tanggalLahir);
  if (!d) return null;
  const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    next.setFullYear(today.getFullYear() + 1);
  }
  return Math.round((next.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86_400_000);
}

function daysToContractEnd(emp: Employee, today: Date): number | null {
  const d = parseDate(emp.tanggalBerakhirKontrak);
  if (!d) return null;
  return Math.round((d.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86_400_000);
}

export default function DashboardPage() {
  const { currentUser, currentEmployee, employees, leaveRequests } = useApp();
  const today = new Date();
  if (!currentUser) return null;
  const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "SUPERADMIN";

  if (!isAdmin) {
    return <EmployeeDashboard />;
  }

  // ===== Admin dashboard =====
  const pendingLeaves = leaveRequests.filter((l) => l.status === "PENDING");
  const recentDecisions = leaveRequests
    .filter((l) => l.status !== "PENDING")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  const birthdaysThisMonth = employees.filter((e) => {
    const d = parseDate(e.tanggalLahir);
    return d && d.getMonth() === today.getMonth();
  });
  const upcomingBirthdays = employees
    .map((e) => ({ emp: e, days: daysToBirthday(e, today) }))
    .filter((x): x is { emp: Employee; days: number } => x.days !== null && x.days <= 7)
    .sort((a, b) => a.days - b.days);

  const expiringContracts = employees
    .map((e) => ({ emp: e, days: daysToContractEnd(e, today) }))
    .filter((x): x is { emp: Employee; days: number } => x.days !== null && x.days >= 0 && x.days <= 30)
    .sort((a, b) => a.days - b.days);

  const divCounts = employees.reduce<Record<string, number>>((acc, e) => {
    const key = e.divisi ?? "Lainnya";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const maxDiv = Math.max(1, ...Object.values(divCounts));
  const palette = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"];

  const empName = (id: number) => employees.find((e) => e.id === id)?.nama ?? "—";

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-primary via-indigo-500 to-accent p-6 text-white shadow-glow">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative text-2xl font-bold">
          {greeting()}, {currentEmployee?.nama ?? "Admin"}! 👋
        </div>
        <div className="relative text-sm text-white/85">{formatTanggalPanjang(today)} — ringkasan data HR Anda hari ini.</div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Users size={20} />} label="Total Karyawan" value={employees.length} />
        <StatCard icon={<ClipboardList size={20} />} label="Cuti Menunggu" value={pendingLeaves.length} tone="warning" />
        <StatCard icon="🎂" label="Ultah Bulan Ini" value={birthdaysThisMonth.length} tone="info" />
        <StatCard icon={<FileText size={20} />} label="Kontrak Segera Habis" value={expiringContracts.length} tone="danger" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Pending leaves */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-heading">Cuti Menunggu Persetujuan</h3>
            <Link href="/leave/manage">
              <Button variant="outline" size="sm">Lihat Semua</Button>
            </Link>
          </div>
          {pendingLeaves.length ? (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-text-muted">
                <tr><th className="py-2 text-left">Nama</th><th className="text-left">Tanggal</th><th className="text-left">Hari</th><th className="text-left">Status</th></tr>
              </thead>
              <tbody>
                {pendingLeaves.slice(0, 5).map((l) => (
                  <tr key={l.id} className="border-t border-card-border/60">
                    <td className="py-2 font-semibold">{empName(l.employeeId)}</td>
                    <td>{l.tanggalMulai.slice(8)}/{l.tanggalMulai.slice(5, 7)} – {l.tanggalSelesai.slice(8)}/{l.tanggalSelesai.slice(5, 7)}</td>
                    <td>{l.jumlahHari}</td>
                    <td><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-text-muted">Tidak ada pengajuan cuti yang menunggu persetujuan. 🎉</p>
          )}
        </Card>

        {/* Upcoming birthdays */}
        <Card>
          <h3 className="mb-4 text-base font-semibold text-text-heading">🎂 Ulang Tahun Mendatang</h3>
          {upcomingBirthdays.length ? (
            <div className="space-y-2">
              {upcomingBirthdays.slice(0, 6).map(({ emp, days }) => (
                <div key={emp.id} className="flex items-center gap-3 rounded-lg bg-warning-light/40 p-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warning-light">🎉</div>
                  <div className="text-sm">
                    <div className="font-medium text-text-main">{emp.nama}</div>
                    <div className="text-xs text-text-muted">
                      {days === 0 ? <span className="font-semibold text-success">Hari Ini!</span>
                        : days === 1 ? <span className="font-semibold text-warning">Besok</span>
                        : `${days} hari lagi`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Tidak ada ulang tahun dalam 7 hari ke depan.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Expiring contracts */}
        <Card>
          <h3 className="mb-4 text-base font-semibold text-text-heading">📄 Kontrak Segera Habis (30 Hari)</h3>
          {expiringContracts.length ? (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-text-muted">
                <tr><th className="py-2 text-left">Nama</th><th className="text-left">Divisi</th><th className="text-left">Sisa</th></tr>
              </thead>
              <tbody>
                {expiringContracts.slice(0, 6).map(({ emp, days }) => (
                  <tr key={emp.id} className="border-t border-card-border/60">
                    <td className="py-2 font-semibold">{emp.nama}</td>
                    <td>{emp.divisi ?? "-"}</td>
                    <td><Badge tone={days <= 7 ? "rejected" : "pending"}>{days} hari</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-text-muted">Tidak ada kontrak yang akan habis dalam 30 hari ke depan.</p>
          )}
        </Card>

        {/* Division distribution */}
        <Card>
          <h3 className="mb-4 text-base font-semibold text-text-heading">📊 Distribusi Divisi</h3>
          <div className="space-y-3">
            {Object.entries(divCounts).map(([divisi, count], i) => (
              <div key={divisi}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-text-main">{divisi}</span>
                  <span className="text-text-muted">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${(count / maxDiv) * 100}%`, background: palette[i % palette.length] }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent decisions */}
      <Card>
        <h3 className="mb-4 text-base font-semibold text-text-heading">Keputusan Terakhir</h3>
        {recentDecisions.length ? (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-text-muted">
              <tr><th className="py-2 text-left">Nama</th><th className="text-left">Tanggal</th><th className="text-left">Hari</th><th className="text-left">Status</th></tr>
            </thead>
            <tbody>
              {recentDecisions.map((l) => (
                <tr key={l.id} className="border-t border-card-border/60">
                  <td className="py-2 font-semibold">{empName(l.employeeId)}</td>
                  <td>{l.tanggalMulai} – {l.tanggalSelesai}</td>
                  <td>{l.jumlahHari}</td>
                  <td><StatusBadge status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-text-muted">Belum ada keputusan cuti.</p>
        )}
      </Card>

      {/* Quick actions */}
      <Card>
        <h3 className="mb-3 text-base font-semibold text-text-heading">⚡ Akses Cepat</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <QuickAction href="/employees" icon={<Plus size={18} />} tone="bg-primary-light text-primary" label="Tambah Karyawan" desc="Input data karyawan baru" />
          <QuickAction href="/employees" icon={<Users size={18} />} tone="bg-info-light text-info" label="Lihat Data" desc="Seluruh data karyawan" />
          <QuickAction href="/leave/manage" icon={<CheckCircle2 size={18} />} tone="bg-warning-light text-warning" label="Kelola Cuti" desc="Setujui / tolak pengajuan" />
          <QuickAction href="/holidays" icon={<CalendarDays size={18} />} tone="bg-success-light text-success" label="Tanggal Merah" desc="Kelola hari libur" />
        </div>
      </Card>
    </div>
  );
}

function QuickAction({ href, icon, tone, label, desc }: { href: string; icon: React.ReactNode; tone: string; label: string; desc: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg border border-card-border p-3 transition hover:shadow-card">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>{icon}</div>
      <div>
        <div className="text-sm font-semibold text-text-heading">{label}</div>
        <div className="text-xs text-text-muted">{desc}</div>
      </div>
    </Link>
  );
}

function EmployeeDashboard() {
  const { currentEmployee, leaveRequests } = useApp();

  if (!currentEmployee) {
    return <Card>Anda tidak memiliki data karyawan terkait.</Card>;
  }

  const total = getTotalHakCuti(currentEmployee);
  const sisa = getTotalSisaCuti(currentEmployee);
  const terpakai = currentEmployee.cutiTerpakai;
  const pct = total > 0 ? Math.round((sisa / total) * 100) : 0;
  const recent = leaveRequests
    .filter((l) => l.employeeId === currentEmployee.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-primary via-indigo-500 to-accent p-6 text-white shadow-glow">
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
        <div className="relative text-2xl font-bold">{greeting()}, {currentEmployee.nama}! 👋</div>
        <div className="relative text-sm text-white/85">Berikut ringkasan cuti Anda.</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard icon="📊" label="Total Hak Cuti" value={total}>
          <div className="mt-1 text-xs text-text-muted">Termasuk cuti kompensasi</div>
        </StatCard>
        <StatCard icon={<PenSquare size={20} />} label="Cuti Terpakai" value={terpakai} tone="warning" />
        <StatCard icon={<CheckCircle2 size={20} />} label="Sisa Cuti" value={sisa} tone="success">
          {total > 0 && (
            <>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 text-xs text-text-muted">{pct}% tersisa</div>
            </>
          )}
        </StatCard>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-heading">Pengajuan Cuti Terakhir</h3>
          <Link href="/leave/request"><Button size="sm">+ Ajukan Cuti Baru</Button></Link>
        </div>
        {recent.length ? (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-text-muted">
              <tr><th className="py-2 text-left">Mulai</th><th className="text-left">Selesai</th><th className="text-left">Hari</th><th className="text-left">Alasan</th><th className="text-left">Status</th></tr>
            </thead>
            <tbody>
              {recent.map((l) => (
                <tr key={l.id} className="border-t border-card-border/60">
                  <td className="py-2">{l.tanggalMulai}</td>
                  <td>{l.tanggalSelesai}</td>
                  <td>{l.jumlahHari} hari</td>
                  <td>
                    {l.alasan}
                    {l.status === "REJECTED" && l.alasanTolak && (
                      <div className="text-xs font-semibold text-danger">Ditolak: {l.alasanTolak}</div>
                    )}
                  </td>
                  <td><StatusBadge status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-text-muted">Belum ada riwayat pengajuan cuti.</p>
        )}
      </Card>
    </div>
  );
}
