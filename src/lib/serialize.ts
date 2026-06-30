// Konversi row Prisma (Date) → tipe API (string ISO). Employee ada di employee-logic.ts.
import type { CompensationHistory, LeaveRequest, PublicHoliday, ReminderContact, User } from "@/types";
import { toISO } from "./employee-logic";

export function serializeUser(u: {
  id: number;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
}): User {
  return {
    id: u.id,
    email: u.email,
    role: u.role as User["role"],
    isActive: u.isActive,
    mustChangePassword: u.mustChangePassword,
  };
}

export function serializeLeave(l: {
  id: number;
  employeeId: number;
  requesterUserId: number;
  tanggalMulai: Date;
  tanggalSelesai: Date;
  jumlahHari: number;
  alasan: string;
  alasanTolak: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): LeaveRequest {
  return {
    id: l.id,
    employeeId: l.employeeId,
    requesterUserId: l.requesterUserId,
    tanggalMulai: toISO(l.tanggalMulai)!,
    tanggalSelesai: toISO(l.tanggalSelesai)!,
    jumlahHari: l.jumlahHari,
    alasan: l.alasan,
    alasanTolak: l.alasanTolak,
    status: l.status as LeaveRequest["status"],
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

export function serializeHoliday(h: { id: number; tanggal: Date; keterangan: string }): PublicHoliday {
  return { id: h.id, tanggal: toISO(h.tanggal)!, keterangan: h.keterangan };
}

export function serializeReminder(c: {
  id: number;
  nama: string | null;
  nomorTelepon: string;
  kategori: string | null;
  isActive: boolean;
  employeeId: number | null;
}): ReminderContact {
  return {
    id: c.id,
    nama: c.nama,
    nomorTelepon: c.nomorTelepon,
    kategori: c.kategori,
    isActive: c.isActive,
    employeeId: c.employeeId,
  };
}

export function serializeCompensation(c: {
  id: number;
  employeeId: number;
  jumlahHari: number;
  alasan: string;
  createdAt: Date;
}): CompensationHistory {
  return {
    id: c.id,
    employeeId: c.employeeId,
    jumlahHari: c.jumlahHari,
    alasan: c.alasan,
    createdAt: c.createdAt.toISOString(),
  };
}

/** Parse 'YYYY-MM-DD' (dari form) ke Date UTC midnight untuk kolom @db.Date. */
export function dateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}
