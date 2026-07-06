import { prisma } from "@/lib/db";
import { ApiError, handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { serializeEmployee } from "@/lib/employee-logic";
import { serializeCompensation } from "@/lib/serialize";

export async function POST(req: Request) {
  return handle(async () => {
    await requireRole("ADMIN", "SUPERADMIN");
    const { employeeId, jumlahHari, alasan } = await req.json();
    const days = Number(jumlahHari);
    if (!employeeId || !days || days < 1) throw new ApiError(400, "Jumlah hari tidak valid.");
    if (!alasan || !String(alasan).trim()) throw new ApiError(400, "Alasan kompensasi wajib diisi.");

    const { employee, compensation } = await prisma.$transaction(async (tx) => {
      const updatedEmployee = await tx.employee.update({
        where: { id: Number(employeeId) },
        data: { sisaCutiTambahan: { increment: days } },
      });
      const createdCompensation = await tx.compensationHistory.create({
        data: { employeeId: Number(employeeId), jumlahHari: days, alasan },
      });
      return { employee: updatedEmployee, compensation: createdCompensation };
    });

    return { employee: serializeEmployee(employee), compensation: serializeCompensation(compensation) };
  });
}
