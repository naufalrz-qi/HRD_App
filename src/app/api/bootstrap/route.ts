import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { serializeEmployee } from "@/lib/employee-logic";
import {
  serializeCompensation,
  serializeHoliday,
  serializeLeave,
  serializeReminder,
  serializeUser,
} from "@/lib/serialize";
import { getSchedulerSettings } from "@/lib/settings";
import { DIVISI_LIST, JABATAN_LIST } from "@/lib/constants";

/** Data awal untuk store frontend, di-scope sesuai role. */
export async function GET() {
  return handle(async () => {
    const session = await requireSession();
    const isAdmin = session.role === "ADMIN" || session.role === "SUPERADMIN";

    const currentUserRow = await prisma.user.findUnique({ where: { id: session.userId } });
    const currentUser = currentUserRow ? serializeUser(currentUserRow) : null;

    if (!isAdmin) {
      // PEGAWAI: hanya data miliknya.
      const employee = await prisma.employee.findUnique({ where: { userId: session.userId } });
      const leaves = employee
        ? await prisma.leaveRequest.findMany({ where: { employeeId: employee.id }, orderBy: { createdAt: "desc" } })
        : [];
      return {
        currentUser,
        employees: employee ? [serializeEmployee(employee)] : [],
        users: currentUser ? [currentUser] : [],
        leaveRequests: leaves.map(serializeLeave),
        holidays: [],
        reminderContacts: [],
        compensationHistories: [],
        schedulerSettings: null,
        divisiList: DIVISI_LIST,
        jabatanList: JABATAN_LIST,
      };
    }

    // ADMIN / SUPERADMIN
    const [employees, users, leaves, holidays, comps] = await Promise.all([
      prisma.employee.findMany({ orderBy: { nama: "asc" } }),
      prisma.user.findMany({ orderBy: { email: "asc" } }),
      prisma.leaveRequest.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.publicHoliday.findMany({ orderBy: { tanggal: "asc" } }),
      prisma.compensationHistory.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    const reminders = session.role === "SUPERADMIN" ? await prisma.reminderContact.findMany() : [];
    const schedulerSettings = session.role === "SUPERADMIN" ? await getSchedulerSettings() : null;

    return {
      currentUser,
      employees: employees.map(serializeEmployee),
      users: users.map(serializeUser),
      leaveRequests: leaves.map(serializeLeave),
      holidays: holidays.map(serializeHoliday),
      reminderContacts: reminders.map(serializeReminder),
      compensationHistories: comps.map(serializeCompensation),
      schedulerSettings,
      divisiList: DIVISI_LIST,
      jabatanList: JABATAN_LIST,
    };
  });
}
