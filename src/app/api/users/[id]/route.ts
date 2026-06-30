import { prisma } from "@/lib/db";
import { ApiError, handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

// Edit user (porting user_controller.edit).
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireRole("SUPERADMIN");
    const id = Number((await ctx.params).id);
    const { email, role, isActive, password } = await req.json();

    await prisma.user.update({
      where: { id },
      data: {
        email,
        role,
        isActive: Boolean(isActive),
        ...(password ? { passwordHash: hashPassword(password), mustChangePassword: true } : {}),
      },
    });
    return { ok: true };
  });
}

// Hapus user (porting user_controller.delete): cegah hapus diri & user ber-employee.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireRole("SUPERADMIN");
    const id = Number((await ctx.params).id);
    if (id === session.userId) throw new ApiError(400, "Tidak bisa menghapus akun sendiri.");

    const user = await prisma.user.findUnique({ where: { id }, include: { employee: true } });
    if (!user) throw new ApiError(404, "User tidak ditemukan.");
    if (user.employee) throw new ApiError(400, "User terhubung dengan data karyawan. Hapus/lepas karyawan dulu.");

    await prisma.user.delete({ where: { id } });
    return { ok: true };
  });
}
