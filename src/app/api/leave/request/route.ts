import { prisma } from "@/lib/db";
import { ApiError, handle } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { serializeEmployee } from "@/lib/employee-logic";
import { dateOnly, serializeLeave } from "@/lib/serialize";
import { calcJumlahHari, isSeniorEligible, parseDate } from "@/lib/helpers";

export async function POST(req: Request) {
  return handle(async () => {
    const session = await requireSession();
    const body = await req.json();
    const isSuperadmin = session.role === "SUPERADMIN";

    // Tentukan karyawan target.
    let targetId: number | undefined;
    if (isSuperadmin) {
      targetId = Number(body.employeeId);
    } else {
      const emp = await prisma.employee.findUnique({ where: { userId: session.userId } });
      if (!emp) throw new ApiError(400, "Anda tidak memiliki data karyawan terkait.");
      targetId = emp.id;
    }

    const row = await prisma.employee.findUnique({ where: { id: targetId } });
    if (!row) throw new ApiError(404, "Karyawan tidak ditemukan.");
    const emp = serializeEmployee(row);

    const start = parseDate(body.tanggalMulai);
    const end = parseDate(body.tanggalSelesai);
    if (!start || !end || end < start) throw new ApiError(400, "Tanggal tidak valid.");

    // Hari libur dalam rentang (untuk karyawan senior).
    const holidayRows = await prisma.publicHoliday.findMany({
      where: { tanggal: { gte: dateOnly(body.tanggalMulai)!, lte: dateOnly(body.tanggalSelesai)! } },
    });
    const holidaySet = new Set(holidayRows.map((h) => h.tanggal.toISOString().slice(0, 10)));

    const senior = isSeniorEligible(emp);
    const jumlahHari = calcJumlahHari(start, end, senior, holidaySet);
    if (jumlahHari <= 0) throw new ApiError(400, "Tanggal tidak valid.");

    const sisa = emp.hakCutiTahunan + emp.sisaCutiTambahan - emp.cutiTerpakai;
    if (jumlahHari > sisa) throw new ApiError(400, `Sisa cuti tidak cukup. Sisa cuti: ${sisa} hari.`);

    const startWork = parseDate(emp.tanggalMulaiBekerja);
    if (startWork) {
      const daysWorked = (Date.now() - startWork.getTime()) / 86_400_000;
      if (daysWorked < 90) throw new ApiError(400, "Karyawan belum memenuhi syarat masa kerja (minimal 3 bulan).");
    }

    const { leave, employee } = await prisma.$transaction(async (tx) => {
      const createdLeave = await tx.leaveRequest.create({
        data: {
          employeeId: emp.id,
          requesterUserId: session.userId,
          tanggalMulai: dateOnly(body.tanggalMulai)!,
          tanggalSelesai: dateOnly(body.tanggalSelesai)!,
          jumlahHari,
          alasan: body.alasan ?? "",
          status: isSuperadmin ? "APPROVED" : "PENDING",
        },
      });
      const updatedEmployee = isSuperadmin
        ? await tx.employee.update({ where: { id: emp.id }, data: { cutiTerpakai: { increment: jumlahHari } } })
        : null;
      return { leave: createdLeave, employee: updatedEmployee };
    });

    return {
      ok: true,
      leave: serializeLeave(leave),
      employee: employee ? serializeEmployee(employee) : null,
      message: isSuperadmin
        ? "Cuti berhasil ditambahkan secara instan."
        : "Pengajuan cuti berhasil dikirim dan menunggu persetujuan.",
    };
  });
}
