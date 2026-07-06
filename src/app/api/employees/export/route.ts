import { prisma } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/auth";
import { buildEmployeeExport, type ExportRow } from "@/lib/excel";
import { getStatusKontrak, serializeEmployee } from "@/lib/employee-logic";
import { getTotalSisaCuti } from "@/lib/helpers";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireRole("ADMIN", "SUPERADMIN");
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 500;
    return new Response(JSON.stringify({ error: "Tidak berwenang." }), { status });
  }

  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      userId: true,
      nama: true,
      divisi: true,
      jabatan: true,
      jabatan2: true,
      tanggalLahir: true,
      tanggalMulaiBekerja: true,
      statusKaryawan: true,
      tanggalBerakhirKontrak: true,
      hakCutiTahunan: true,
      cutiTerpakai: true,
      sisaCutiTambahan: true,
      user: { select: { email: true, role: true, isActive: true } },
    },
    orderBy: { nama: "asc" },
  });

  const rows: ExportRow[] = employees.map((row) => {
    const e = serializeEmployee(row);
    const u = row.user;
    return {
      Nama: e.nama,
      Email: u?.email ?? "-",
      Role: u?.role ?? "-",
      Status: u ? (u.isActive ? "Aktif" : "Nonaktif") : "-",
      Divisi: e.divisi ?? "-",
      "Jabatan 1": e.jabatan ?? "-",
      "Jabatan 2": e.jabatan2 ?? "-",
      "Tanggal Lahir": e.tanggalLahir ?? "-",
      "Tanggal Mulai Bekerja": e.tanggalMulaiBekerja ?? "-",
      "Sisa Cuti": getTotalSisaCuti(e),
      "Status Kontrak": getStatusKontrak(e.tanggalMulaiBekerja),
    };
  });

  const buf = await buildEmployeeExport(rows);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="data_karyawan.xlsx"',
    },
  });
}
