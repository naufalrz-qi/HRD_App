import { prisma } from "@/lib/db";
import { ApiError, handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireRole("ADMIN", "SUPERADMIN");
    const id = Number((await ctx.params).id);
    const { alasanTolak } = await req.json();
    if (!alasanTolak || !String(alasanTolak).trim()) throw new ApiError(400, "Alasan penolakan wajib diisi.");

    const leave = await prisma.leaveRequest.findUnique({ where: { id } });
    if (leave && leave.status === "PENDING") {
      await prisma.leaveRequest.update({ where: { id }, data: { status: "REJECTED", alasanTolak } });
    }
    return { ok: true };
  });
}
