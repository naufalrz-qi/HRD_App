import { prisma } from "@/lib/db";
import { ApiError, handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

// Tambah user login (porting user_controller.create).
export async function POST(req: Request) {
  return handle(async () => {
    await requireRole("SUPERADMIN");
    const { email, role, password } = await req.json();
    if (!email || !role || !password) throw new ApiError(400, "Email, role, dan password wajib diisi.");
    if (await prisma.user.findUnique({ where: { email } })) throw new ApiError(409, "Email sudah terdaftar.");

    await prisma.user.create({
      data: { email, role, passwordHash: hashPassword(password), isActive: true, mustChangePassword: true },
    });
    return { ok: true };
  });
}
