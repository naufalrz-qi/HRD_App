// Logika domain karyawan — porting dari employee_controller.py.
import type { Employee } from "@/types";
import { parseDate, stripTime } from "./helpers";

/** calculate_hak_cuti: >=1 tahun → HO=12, selain itu 6; <1 tahun → 0. */
export function calculateHakCuti(tanggalMulai: string | null, jabatan: string | null): number {
  const start = parseDate(tanggalMulai);
  if (!start) return 0;
  const daysWorked = (Date.now() - start.getTime()) / 86_400_000;
  const yearsWorked = daysWorked / 365.25;
  if (yearsWorked >= 1) {
    return jabatan && jabatan.toUpperCase() === "HO" ? 12 : 6;
  }
  return 0;
}

export type StatusKontrak = "Aman" | "Habis Masa Training" | "Perpanjangan Kontrak" | "-";

/** Klasifikasi status kontrak berdasarkan masa kerja (porting persis). */
export function getStatusKontrak(tanggalMulai: string | null, today = new Date()): StatusKontrak {
  const start = parseDate(tanggalMulai);
  if (!start) return "-";
  const daysWorked = Math.floor((stripTime(today).getTime() - stripTime(start).getTime()) / 86_400_000);
  let tipe: StatusKontrak = "Aman";
  if (daysWorked >= 60 && daysWorked <= 90) {
    tipe = "Habis Masa Training";
  } else if (daysWorked > 90) {
    const daysAfterTraining = daysWorked - 90;
    const daysInCurrentYear = daysAfterTraining % 365;
    if (daysInCurrentYear >= 335) tipe = "Perpanjangan Kontrak";
  }
  return tipe;
}

/** Password default: 'SCT-DDMMYYYY' dari tanggal lahir, fallback 'SCT-123456'. */
export function defaultPassword(tanggalLahir: string | null): string {
  const d = parseDate(tanggalLahir);
  if (!d) return "SCT-123456";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `SCT-${dd}${mm}${d.getFullYear()}`;
}

/** Konversi row Prisma (Date objek) ke tipe Employee (string ISO) untuk API. */
export function serializeEmployee(e: {
  id: number;
  userId: number | null;
  nama: string;
  divisi: string | null;
  jabatan: string | null;
  jabatan2: string | null;
  tanggalLahir: Date | null;
  tanggalMulaiBekerja: Date | null;
  statusKaryawan: string | null;
  tanggalBerakhirKontrak: Date | null;
  hakCutiTahunan: number;
  cutiTerpakai: number;
  sisaCutiTambahan: number;
}): Employee {
  return {
    id: e.id,
    userId: e.userId,
    nama: e.nama,
    divisi: e.divisi,
    jabatan: e.jabatan,
    jabatan2: e.jabatan2,
    tanggalLahir: toISO(e.tanggalLahir),
    tanggalMulaiBekerja: toISO(e.tanggalMulaiBekerja),
    statusKaryawan: e.statusKaryawan ?? "Kontrak",
    tanggalBerakhirKontrak: toISO(e.tanggalBerakhirKontrak),
    hakCutiTahunan: e.hakCutiTahunan,
    cutiTerpakai: e.cutiTerpakai,
    sisaCutiTambahan: e.sisaCutiTambahan,
  };
}

/** Date → 'YYYY-MM-DD' (UTC date column). */
export function toISO(d: Date | null): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}
