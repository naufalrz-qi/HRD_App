// Tipe data mencerminkan skema DB yang ada (lihat app/models/*.py).
// Skema TIDAK diubah; nama kolom snake_case dipetakan ke camelCase di sini.

export type Role = "SUPERADMIN" | "ADMIN" | "PEGAWAI";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Tabel: users */
export interface User {
  id: number;
  email: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
}

/** Tabel: employees */
export interface Employee {
  id: number;
  userId: number | null;
  nama: string;
  divisi: string | null;
  jabatan: string | null;
  jabatan2: string | null;
  /** ISO date string (YYYY-MM-DD) */
  tanggalLahir: string | null;
  tanggalMulaiBekerja: string | null;
  statusKaryawan: string; // default 'Kontrak'
  tanggalBerakhirKontrak: string | null;
  hakCutiTahunan: number;
  cutiTerpakai: number;
  sisaCutiTambahan: number;
}

/** Tabel: leave_requests */
export interface LeaveRequest {
  id: number;
  employeeId: number;
  requesterUserId: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  jumlahHari: number;
  alasan: string;
  alasanTolak: string | null;
  status: LeaveStatus;
  createdAt: string;
  updatedAt: string;
}

/** Tabel: public_holidays */
export interface PublicHoliday {
  id: number;
  tanggal: string;
  keterangan: string;
}

/** Tabel: reminder_contacts */
export interface ReminderContact {
  id: number;
  nama: string | null;
  nomorTelepon: string;
  kategori: string | null;
  isActive: boolean;
  employeeId: number | null;
}

/** Tabel: compensation_histories */
export interface CompensationHistory {
  id: number;
  employeeId: number;
  jumlahHari: number;
  alasan: string;
  createdAt: string;
}

/** Pengaturan scheduler reminder (scheduler_settings.json) */
export interface SchedulerSettings {
  hour: number;
  minute: number;
  maxTextLimit: number;
}
