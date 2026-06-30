// Util murni hasil porting logika dari app/models/employee.py
// dan app/controllers/leave_controller.py (skema & aturan tidak diubah).

import type { Employee } from "@/types";

/** Parse 'YYYY-MM-DD' menjadi Date lokal (tanpa offset timezone). */
export function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** get_total_sisa_cuti(): (hak_cuti_tahunan + sisa_cuti_tambahan) - cuti_terpakai */
export function getTotalSisaCuti(emp: Employee): number {
  return emp.hakCutiTahunan + emp.sisaCutiTambahan - emp.cutiTerpakai;
}

/** Total hak cuti (tahunan + kompensasi). */
export function getTotalHakCuti(emp: Employee): number {
  return emp.hakCutiTahunan + emp.sisaCutiTambahan;
}

/** is_senior_eligible(): sudah bekerja >= 3 tahun. */
export function isSeniorEligible(emp: Employee, today = new Date()): boolean {
  const start = parseDate(emp.tanggalMulaiBekerja);
  if (!start) return false;
  const anniversary = new Date(start);
  anniversary.setFullYear(start.getFullYear() + 3);
  return stripTime(today) >= stripTime(anniversary);
}

/** get_masa_kerja(): string "X Tahun Y Bulan". */
export function getMasaKerja(emp: Employee, today = new Date()): string {
  const start = parseDate(emp.tanggalMulaiBekerja);
  if (!start) return "-";

  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  if (today.getDate() < start.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} Tahun`);
  if (months > 0) parts.push(`${months} Bulan`);
  if (parts.length === 0) return "< 1 Bulan";
  return parts.join(" ");
}

/** Masa kerja dalam tahun (untuk filter). */
export function getYearsWorked(emp: Employee, today = new Date()): number | null {
  const start = parseDate(emp.tanggalMulaiBekerja);
  if (!start) return null;
  const days = (stripTime(today).getTime() - stripTime(start).getTime()) / 86_400_000;
  return days / 365.25;
}

/**
 * Hitung jumlah hari cuti: lewati hari Minggu; lewati hari libur nasional
 * jika karyawan senior (>= 3 tahun). Porting dari leave_controller.request_leave.
 */
export function calcJumlahHari(
  start: Date,
  end: Date,
  isSenior: boolean,
  holidayDates: Set<string>
): number {
  let count = 0;
  const cur = stripTime(start);
  const last = stripTime(end);
  while (cur <= last) {
    const isSunday = cur.getDay() === 0;
    const isHoliday = holidayDates.has(toISODate(cur));
    if (!isSunday && !(isSenior && isHoliday)) count += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// ===== Format tanggal (Bahasa Indonesia) =====
const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const BULAN_SINGKAT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];
const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** dd-mm-yyyy */
export function formatTanggal(value: string | null): string {
  const d = parseDate(value);
  if (!d) return "-";
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

/** dd Mmm yyyy (mis. 09 Jun 2026) */
export function formatTanggalPendek(value: string | null): string {
  const d = parseDate(value);
  if (!d) return "-";
  return `${pad(d.getDate())} ${BULAN_SINGKAT[d.getMonth()]} ${d.getFullYear()}`;
}

/** Hari, dd Bulan yyyy (mis. Selasa, 30 Juni 2026) */
export function formatTanggalPanjang(d: Date): string {
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
