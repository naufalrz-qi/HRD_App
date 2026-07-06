"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  CompensationHistory,
  Employee,
  LeaveRequest,
  PublicHoliday,
  ReminderContact,
  SchedulerSettings,
  User,
} from "@/types";
import { DIVISI_LIST, JABATAN_LIST } from "./constants";
import { useToast } from "@/components/Toast";

interface BootstrapData {
  currentUser: User | null;
  employees: Employee[];
  users: User[];
  leaveRequests: LeaveRequest[];
  holidays: PublicHoliday[];
  reminderContacts: ReminderContact[];
  compensationHistories: CompensationHistory[];
  schedulerSettings: SchedulerSettings | null;
  divisiList: string[];
  jabatanList: string[];
}

const EMPTY: BootstrapData = {
  currentUser: null,
  employees: [],
  users: [],
  leaveRequests: [],
  holidays: [],
  reminderContacts: [],
  compensationHistories: [],
  schedulerSettings: null,
  divisiList: DIVISI_LIST,
  jabatanList: JABATAN_LIST,
};

const DEFAULT_SETTINGS: SchedulerSettings = { hour: 7, minute: 0, maxTextLimit: 10 };

interface AppState {
  loading: boolean;
  currentUser: User | null;
  currentEmployee: Employee | null;
  users: User[];
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  holidays: PublicHoliday[];
  reminderContacts: ReminderContact[];
  compensationHistories: CompensationHistory[];
  schedulerSettings: SchedulerSettings;
  divisiList: string[];
  jabatanList: string[];

  refresh: () => Promise<void>;
  logout: () => Promise<void>;

  requestLeave: (input: {
    employeeId: number;
    tanggalMulai: string;
    tanggalSelesai: string;
    alasan: string;
  }) => Promise<{ ok: boolean; message: string }>;
  approveLeave: (id: number) => Promise<void>;
  rejectLeave: (id: number, alasanTolak: string) => Promise<void>;
  adjustLeave: (employeeId: number, jumlahHari: number, alasan: string) => Promise<void>;

  saveEmployee: (emp: Partial<Employee> & { id?: number; email?: string }) => Promise<void>;
  deleteEmployee: (id: number) => Promise<void>;
  saveUser: (u: Partial<User> & { id?: number; password?: string }) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  saveHoliday: (h: { tanggal: string; keterangan: string }) => Promise<void>;
  deleteHoliday: (id: number) => Promise<void>;
  generateHolidays: (year: number) => Promise<void>;
  saveReminder: (c: Partial<ReminderContact> & { id?: number }) => Promise<void>;
  deleteReminder: (id: number) => Promise<void>;
  updateScheduler: (s: SchedulerSettings) => Promise<void>;
  triggerReminder: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

async function api(url: string, method = "POST", body?: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Terjadi kesalahan.");
  return data;
}

/** Sisipkan/ganti item berdasarkan id, tanpa refetch seluruh dataset. */
function upsert<T extends { id: number }>(arr: T[], item: T): T[] {
  const idx = arr.findIndex((x) => x.id === item.id);
  if (idx === -1) return [...arr, item];
  const copy = arr.slice();
  copy[idx] = item;
  return copy;
}

function removeById<T extends { id: number }>(arr: T[], id: number): T[] {
  return arr.filter((x) => x.id !== id);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { notify } = useToast();
  const [data, setData] = useState<BootstrapData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/bootstrap");
      if (!res.ok) {
        setData(EMPTY);
        return;
      }
      const json = (await res.json()) as BootstrapData;
      setData({ ...EMPTY, ...json });
    } catch {
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // refresh() hanya memanggil setState setelah await fetch (asinkron), bukan sinkron.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const value = useMemo<AppState>(() => {
    const currentUser = data.currentUser;
    const currentEmployee = currentUser
      ? data.employees.find((e) => e.userId === currentUser.id) ?? null
      : null;

    // Bungkus aksi: jalankan API (yang menempel hasilnya ke state lokal), lalu toast hasil.
    // Tidak lagi refetch seluruh bootstrap tiap aksi — hasil mutasi ditempel langsung dari response API.
    const run = async (fn: () => Promise<void>, successMsg?: string) => {
      try {
        await fn();
        if (successMsg) notify(successMsg, "success");
      } catch (e) {
        notify(e instanceof Error ? e.message : "Terjadi kesalahan.", "danger");
      }
    };

    return {
      loading,
      currentUser,
      currentEmployee,
      users: data.users,
      employees: data.employees,
      leaveRequests: data.leaveRequests,
      holidays: data.holidays,
      reminderContacts: data.reminderContacts,
      compensationHistories: data.compensationHistories,
      schedulerSettings: data.schedulerSettings ?? DEFAULT_SETTINGS,
      divisiList: data.divisiList?.length ? data.divisiList : DIVISI_LIST,
      jabatanList: data.jabatanList?.length ? data.jabatanList : JABATAN_LIST,

      refresh,

      logout: async () => {
        try {
          await api("/api/auth/logout");
        } finally {
          window.location.href = "/login";
        }
      },

      requestLeave: async (input) => {
        try {
          const res = (await api("/api/leave/request", "POST", input)) as {
            message?: string;
            leave: LeaveRequest;
            employee: Employee | null;
          };
          setData((d) => ({
            ...d,
            leaveRequests: upsert(d.leaveRequests, res.leave),
            employees: res.employee ? upsert(d.employees, res.employee) : d.employees,
          }));
          return { ok: true, message: res.message ?? "Pengajuan cuti tersimpan." };
        } catch (e) {
          return { ok: false, message: e instanceof Error ? e.message : "Terjadi kesalahan." };
        }
      },

      approveLeave: (id) =>
        run(async () => {
          const res = (await api(`/api/leave/${id}/approve`)) as { leave: LeaveRequest; employee: Employee };
          setData((d) => ({
            ...d,
            leaveRequests: upsert(d.leaveRequests, res.leave),
            employees: upsert(d.employees, res.employee),
          }));
        }, "Cuti berhasil disetujui."),

      rejectLeave: (id, alasanTolak) =>
        run(async () => {
          const res = (await api(`/api/leave/${id}/reject`, "POST", { alasanTolak })) as { leave: LeaveRequest };
          setData((d) => ({ ...d, leaveRequests: upsert(d.leaveRequests, res.leave) }));
        }, "Cuti ditolak."),

      adjustLeave: (employeeId, jumlahHari, alasan) =>
        run(async () => {
          const res = (await api("/api/leave/adjust", "POST", { employeeId, jumlahHari, alasan })) as {
            employee: Employee;
            compensation: CompensationHistory;
          };
          setData((d) => ({
            ...d,
            employees: upsert(d.employees, res.employee),
            compensationHistories: [res.compensation, ...d.compensationHistories],
          }));
        }, "Cuti kompensasi ditambahkan."),

      saveEmployee: (emp) =>
        run(async () => {
          const res = (await (emp.id
            ? api(`/api/employees/${emp.id}`, "PUT", emp)
            : api("/api/employees", "POST", emp))) as { employee: Employee; user?: User };
          setData((d) => ({
            ...d,
            employees: upsert(d.employees, res.employee),
            users: res.user ? upsert(d.users, res.user) : d.users,
          }));
        }, emp.id ? "Data karyawan diperbarui." : "Karyawan baru ditambahkan."),

      deleteEmployee: (id) =>
        run(async () => {
          await api(`/api/employees/${id}`, "DELETE");
          setData((d) => ({
            ...d,
            employees: removeById(d.employees, id),
            leaveRequests: d.leaveRequests.filter((l) => l.employeeId !== id),
            compensationHistories: d.compensationHistories.filter((c) => c.employeeId !== id),
            reminderContacts: d.reminderContacts.map((r) => (r.employeeId === id ? { ...r, employeeId: null } : r)),
          }));
        }, "Karyawan dihapus."),

      saveUser: (u) =>
        run(async () => {
          const res = (await (u.id ? api(`/api/users/${u.id}`, "PUT", u) : api("/api/users", "POST", u))) as {
            user: User;
          };
          setData((d) => ({ ...d, users: upsert(d.users, res.user) }));
        }, u.id ? "User diperbarui." : "User baru ditambahkan."),

      deleteUser: (id) =>
        run(async () => {
          await api(`/api/users/${id}`, "DELETE");
          setData((d) => ({ ...d, users: removeById(d.users, id) }));
        }, "User dihapus."),

      saveHoliday: (h) =>
        run(async () => {
          const res = (await api("/api/holidays", "POST", h)) as { holiday: PublicHoliday };
          setData((d) => ({ ...d, holidays: upsert(d.holidays, res.holiday) }));
        }, "Tanggal merah ditambahkan."),

      deleteHoliday: (id) =>
        run(async () => {
          await api(`/api/holidays/${id}`, "DELETE");
          setData((d) => ({ ...d, holidays: removeById(d.holidays, id) }));
        }, "Tanggal merah dihapus."),

      generateHolidays: async (year) => {
        try {
          const res = (await api("/api/holidays/generate", "POST", { year })) as {
            message?: string;
            holidays: PublicHoliday[];
          };
          setData((d) => ({
            ...d,
            holidays: res.holidays.reduce((acc, h) => upsert(acc, h), d.holidays),
          }));
          notify(res.message ?? "Selesai menarik hari libur.", "success");
        } catch (e) {
          notify(e instanceof Error ? e.message : "Gagal menarik data.", "danger");
        }
      },

      saveReminder: (c) =>
        run(async () => {
          const res = (await (c.id ? api(`/api/reminders/${c.id}`, "PUT", c) : api("/api/reminders", "POST", c))) as {
            reminder: ReminderContact;
          };
          setData((d) => ({ ...d, reminderContacts: upsert(d.reminderContacts, res.reminder) }));
        }, c.id ? "Kontak reminder diperbarui." : "Kontak reminder ditambahkan."),

      deleteReminder: (id) =>
        run(async () => {
          await api(`/api/reminders/${id}`, "DELETE");
          setData((d) => ({ ...d, reminderContacts: removeById(d.reminderContacts, id) }));
        }, "Kontak reminder dihapus."),

      updateScheduler: (s) =>
        run(async () => {
          const res = (await api("/api/reminders/settings", "POST", s)) as { settings: SchedulerSettings };
          setData((d) => ({ ...d, schedulerSettings: res.settings }));
        }, "Pengaturan jadwal disimpan."),

      triggerReminder: async () => {
        try {
          await api("/api/reminders/trigger");
          notify("Reminder dijalankan. Cek WhatsApp penerima.", "success");
        } catch (e) {
          notify(e instanceof Error ? e.message : "Gagal menjalankan reminder.", "danger");
        }
      },
    };
  }, [data, loading, refresh, notify]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
