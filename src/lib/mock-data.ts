// Dataset mock untuk fase frontend. Akan diganti panggilan API di fase backend.
import type {
  CompensationHistory,
  Employee,
  LeaveRequest,
  PublicHoliday,
  ReminderContact,
  SchedulerSettings,
  User,
} from "@/types";

export const mockUsers: User[] = [
  { id: 1, email: "superadmin@arunika.com", role: "SUPERADMIN", isActive: true, mustChangePassword: false },
  { id: 2, email: "hrd@arunika.com", role: "ADMIN", isActive: true, mustChangePassword: false },
  { id: 3, email: "rina@arunika.com", role: "PEGAWAI", isActive: true, mustChangePassword: false },
  { id: 4, email: "budi@arunika.com", role: "PEGAWAI", isActive: true, mustChangePassword: false },
  { id: 5, email: "sari@arunika.com", role: "PEGAWAI", isActive: true, mustChangePassword: false },
  { id: 6, email: "agus@arunika.com", role: "PEGAWAI", isActive: false, mustChangePassword: false },
];

export const mockEmployees: Employee[] = [
  {
    id: 1, userId: 2, nama: "Dewi Lestari", divisi: "HRD", jabatan: "Manager", jabatan2: "HR Generalist",
    tanggalLahir: "1988-07-02", tanggalMulaiBekerja: "2019-03-01", statusKaryawan: "Tetap",
    tanggalBerakhirKontrak: null, hakCutiTahunan: 12, cutiTerpakai: 3, sisaCutiTambahan: 2,
  },
  {
    id: 2, userId: 3, nama: "Rina Marlina", divisi: "Keuangan", jabatan: "Staff", jabatan2: "Accounting",
    tanggalLahir: "1995-06-30", tanggalMulaiBekerja: "2022-01-10", statusKaryawan: "Kontrak",
    tanggalBerakhirKontrak: "2026-07-20", hakCutiTahunan: 12, cutiTerpakai: 5, sisaCutiTambahan: 0,
  },
  {
    id: 3, userId: 4, nama: "Budi Santoso", divisi: "IT", jabatan: "Staff", jabatan2: "Backend Developer",
    tanggalLahir: "1993-12-15", tanggalMulaiBekerja: "2021-09-05", statusKaryawan: "Kontrak",
    tanggalBerakhirKontrak: "2026-07-12", hakCutiTahunan: 12, cutiTerpakai: 0, sisaCutiTambahan: 1,
  },
  {
    id: 4, userId: 5, nama: "Sari Indah", divisi: "Marketing", jabatan: "Staff", jabatan2: "Social Media",
    tanggalLahir: "1998-03-22", tanggalMulaiBekerja: "2024-02-01", statusKaryawan: "Kontrak",
    tanggalBerakhirKontrak: "2026-08-01", hakCutiTahunan: 12, cutiTerpakai: 8, sisaCutiTambahan: 0,
  },
  {
    id: 5, userId: 6, nama: "Agus Wijaya", divisi: "IT", jabatan: "Staff", jabatan2: "QA",
    tanggalLahir: "1990-11-10", tanggalMulaiBekerja: "2020-06-15", statusKaryawan: "Tetap",
    tanggalBerakhirKontrak: null, hakCutiTahunan: 12, cutiTerpakai: 12, sisaCutiTambahan: 0,
  },
  {
    id: 6, userId: null, nama: "Maya Putri", divisi: "Marketing", jabatan: "Staff", jabatan2: "Content Writer",
    tanggalLahir: "1996-07-05", tanggalMulaiBekerja: "2023-05-02", statusKaryawan: "Kontrak",
    tanggalBerakhirKontrak: "2026-07-05", hakCutiTahunan: 12, cutiTerpakai: 2, sisaCutiTambahan: 0,
  },
];

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 1, employeeId: 2, requesterUserId: 3, tanggalMulai: "2026-07-06", tanggalSelesai: "2026-07-08",
    jumlahHari: 3, alasan: "Acara keluarga", alasanTolak: null, status: "PENDING",
    createdAt: "2026-06-28T09:00:00", updatedAt: "2026-06-28T09:00:00",
  },
  {
    id: 2, employeeId: 3, requesterUserId: 4, tanggalMulai: "2026-07-10", tanggalSelesai: "2026-07-10",
    jumlahHari: 1, alasan: "Keperluan pribadi", alasanTolak: null, status: "PENDING",
    createdAt: "2026-06-29T14:30:00", updatedAt: "2026-06-29T14:30:00",
  },
  {
    id: 3, employeeId: 4, requesterUserId: 5, tanggalMulai: "2026-05-12", tanggalSelesai: "2026-05-16",
    jumlahHari: 4, alasan: "Liburan", alasanTolak: null, status: "APPROVED",
    createdAt: "2026-05-01T10:00:00", updatedAt: "2026-05-02T08:00:00",
  },
  {
    id: 4, employeeId: 2, requesterUserId: 3, tanggalMulai: "2026-04-02", tanggalSelesai: "2026-04-03",
    jumlahHari: 2, alasan: "Sakit", alasanTolak: "Surat keterangan tidak dilampirkan", status: "REJECTED",
    createdAt: "2026-03-28T11:00:00", updatedAt: "2026-03-29T09:00:00",
  },
];

export const mockHolidays: PublicHoliday[] = [
  { id: 1, tanggal: "2026-01-01", keterangan: "Tahun Baru 2026" },
  { id: 2, tanggal: "2026-03-19", keterangan: "Hari Raya Nyepi" },
  { id: 3, tanggal: "2026-05-01", keterangan: "Hari Buruh Internasional" },
  { id: 4, tanggal: "2026-05-14", keterangan: "Kenaikan Isa Almasih" },
  { id: 5, tanggal: "2026-08-17", keterangan: "Hari Kemerdekaan RI" },
  { id: 6, tanggal: "2026-12-25", keterangan: "Hari Raya Natal" },
];

export const mockReminderContacts: ReminderContact[] = [
  { id: 1, nama: "Dewi Lestari", nomorTelepon: "+6281234567890", kategori: "HRD", isActive: true, employeeId: 1 },
  { id: 2, nama: "Admin Operasional", nomorTelepon: "+6281298765432", kategori: "Admin", isActive: true, employeeId: null },
  { id: 3, nama: "Grup HR", nomorTelepon: "+6281211112222", kategori: "HRD", isActive: false, employeeId: null },
];

export const mockCompensationHistories: CompensationHistory[] = [
  { id: 1, employeeId: 1, jumlahHari: 2, alasan: "Lembur akhir tahun", createdAt: "2026-01-15T10:00:00" },
  { id: 2, employeeId: 3, jumlahHari: 1, alasan: "Pengganti hari libur", createdAt: "2026-03-10T10:00:00" },
];

export const mockSchedulerSettings: SchedulerSettings = {
  hour: 7,
  minute: 0,
  maxTextLimit: 10,
};

/** Daftar divisi & jabatan untuk dropdown filter (distinct dari data). */
export const divisiList = ["HRD", "Keuangan", "IT", "Marketing", "Operasional"];
export const jabatanList = ["Manager", "Supervisor", "Staff", "Magang"];
