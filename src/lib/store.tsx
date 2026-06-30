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

    // Bungkus aksi: jalankan API, toast hasil, lalu refresh data.
    const run = async (fn: () => Promise<unknown>, successMsg?: string) => {
      try {
        await fn();
        await refresh();
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
          const res = (await api("/api/leave/request", "POST", input)) as { message?: string };
          await refresh();
          return { ok: true, message: res.message ?? "Pengajuan cuti tersimpan." };
        } catch (e) {
          return { ok: false, message: e instanceof Error ? e.message : "Terjadi kesalahan." };
        }
      },

      approveLeave: (id) => run(() => api(`/api/leave/${id}/approve`), "Cuti berhasil disetujui."),
      rejectLeave: (id, alasanTolak) => run(() => api(`/api/leave/${id}/reject`, "POST", { alasanTolak }), "Cuti ditolak."),
      adjustLeave: (employeeId, jumlahHari, alasan) =>
        run(() => api("/api/leave/adjust", "POST", { employeeId, jumlahHari, alasan }), "Cuti kompensasi ditambahkan."),

      saveEmployee: (emp) =>
        run(
          () =>
            emp.id
              ? api(`/api/employees/${emp.id}`, "PUT", emp)
              : api("/api/employees", "POST", emp),
          emp.id ? "Data karyawan diperbarui." : "Karyawan baru ditambahkan."
        ),
      deleteEmployee: (id) => run(() => api(`/api/employees/${id}`, "DELETE"), "Karyawan dihapus."),

      saveUser: (u) =>
        run(
          () => (u.id ? api(`/api/users/${u.id}`, "PUT", u) : api("/api/users", "POST", u)),
          u.id ? "User diperbarui." : "User baru ditambahkan."
        ),
      deleteUser: (id) => run(() => api(`/api/users/${id}`, "DELETE"), "User dihapus."),

      saveHoliday: (h) => run(() => api("/api/holidays", "POST", h), "Tanggal merah ditambahkan."),
      deleteHoliday: (id) => run(() => api(`/api/holidays/${id}`, "DELETE"), "Tanggal merah dihapus."),
      generateHolidays: async (year) => {
        try {
          const res = (await api("/api/holidays/generate", "POST", { year })) as { message?: string };
          await refresh();
          notify(res.message ?? "Selesai menarik hari libur.", "success");
        } catch (e) {
          notify(e instanceof Error ? e.message : "Gagal menarik data.", "danger");
        }
      },

      saveReminder: (c) =>
        run(
          () => (c.id ? api(`/api/reminders/${c.id}`, "PUT", c) : api("/api/reminders", "POST", c)),
          c.id ? "Kontak reminder diperbarui." : "Kontak reminder ditambahkan."
        ),
      deleteReminder: (id) => run(() => api(`/api/reminders/${id}`, "DELETE"), "Kontak reminder dihapus."),
      updateScheduler: (s) => run(() => api("/api/reminders/settings", "POST", s), "Pengaturan jadwal disimpan."),
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
