import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireRole("ADMIN", "SUPERADMIN");
    const id = Number((await ctx.params).id);

    await prisma.$transaction(async (tx) => {
      const leave = await tx.leaveRequest.findUnique({ where: { id } });
      if (leave && leave.status === "PENDING") {
        await tx.leaveRequest.update({ where: { id }, data: { status: "APPROVED" } });
        await tx.employee.update({
          where: { id: leave.employeeId },
          data: { cutiTerpakai: { increment: leave.jumlahHari } },
        });
      }
    });

    return { ok: true };
  });
}
