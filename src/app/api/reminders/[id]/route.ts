import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { serializeReminder } from "@/lib/serialize";

// Edit kontak reminder.
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireRole("SUPERADMIN");
    const id = Number((await ctx.params).id);
    const { nama, nomorTelepon, kategori, isActive, employeeId } = await req.json();

    const updated = await prisma.reminderContact.update({
      where: { id },
      data: {
        nama: nama || null,
        nomorTelepon,
        kategori: kategori || null,
        isActive: Boolean(isActive),
        employeeId: employeeId ? Number(employeeId) : null,
      },
    });
    return { reminder: serializeReminder(updated) };
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireRole("SUPERADMIN");
    const id = Number((await ctx.params).id);
    await prisma.reminderContact.delete({ where: { id } });
    return { reminderId: id };
  });
}
