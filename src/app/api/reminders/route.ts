import { prisma } from "@/lib/db";
import { ApiError, handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";

// Tambah kontak reminder (porting reminder_controller.add_reminder).
export async function POST(req: Request) {
  return handle(async () => {
    await requireRole("SUPERADMIN");
    const { nama, nomorTelepon, kategori, employeeId, isActive } = await req.json();
    if (!nomorTelepon) throw new ApiError(400, "Nomor WhatsApp wajib diisi.");

    await prisma.reminderContact.create({
      data: {
        nama: employeeId ? null : nama || null,
        nomorTelepon,
        kategori: kategori || null,
        isActive: isActive ?? true,
        employeeId: employeeId ? Number(employeeId) : null,
      },
    });
    return { ok: true };
  });
}
