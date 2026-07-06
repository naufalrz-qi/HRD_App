import { prisma } from "@/lib/db";
import { ApiError, handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { serializeLeave } from "@/lib/serialize";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireRole("ADMIN", "SUPERADMIN");
    const id = Number((await ctx.params).id);
    const { alasanTolak } = await req.json();
    if (!alasanTolak || !String(alasanTolak).trim()) throw new ApiError(400, "Alasan penolakan wajib diisi.");

    const current = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!current) throw new ApiError(404, "Pengajuan cuti tidak ditemukan.");

    const leave =
      current.status === "PENDING"
        ? await prisma.leaveRequest.update({ where: { id }, data: { status: "REJECTED", alasanTolak } })
        : current;

    return { leave: serializeLeave(leave) };
  });
}
