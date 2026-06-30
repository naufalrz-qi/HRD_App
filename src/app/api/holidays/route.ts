import { prisma } from "@/lib/db";
import { ApiError, handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { dateOnly } from "@/lib/serialize";

// Tambah tanggal merah manual (porting holiday_controller.create).
export async function POST(req: Request) {
  return handle(async () => {
    await requireRole("ADMIN", "SUPERADMIN");
    const { tanggal, keterangan } = await req.json();
    if (!tanggal || !keterangan) throw new ApiError(400, "Tanggal dan keterangan wajib diisi.");

    const d = dateOnly(tanggal)!;
    if (await prisma.publicHoliday.findUnique({ where: { tanggal: d } })) {
      throw new ApiError(409, `Tanggal merah untuk ${tanggal} sudah ada.`);
    }
    await prisma.publicHoliday.create({ data: { tanggal: d, keterangan } });
    return { ok: true };
  });
}
