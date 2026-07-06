import { prisma } from "@/lib/db";
import { ApiError, handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { serializeEmployee } from "@/lib/employee-logic";
import { serializeLeave } from "@/lib/serialize";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireRole("ADMIN", "SUPERADMIN");
    const id = Number((await ctx.params).id);

    const { leave, employee } = await prisma.$transaction(async (tx) => {
      const current = await tx.leaveRequest.findUnique({ where: { id } });
      if (!current) throw new ApiError(404, "Pengajuan cuti tidak ditemukan.");

      if (current.status !== "PENDING") {
        const emp = await tx.employee.findUnique({ where: { id: current.employeeId } });
        return { leave: current, employee: emp! };
      }

      const updatedLeave = await tx.leaveRequest.update({ where: { id }, data: { status: "APPROVED" } });
      const updatedEmployee = await tx.employee.update({
        where: { id: current.employeeId },
        data: { cutiTerpakai: { increment: current.jumlahHari } },
      });
      return { leave: updatedLeave, employee: updatedEmployee };
    });

    return { leave: serializeLeave(leave), employee: serializeEmployee(employee) };
  });
}
