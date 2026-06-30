import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { ApiError, handle } from "@/lib/api";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import type { Role } from "@/types";

export async function POST(req: Request) {
  return handle(async () => {
    const { email, password } = await req.json();
    if (!email || !password) throw new ApiError(400, "Email dan password wajib diisi.");

    const user = await prisma.user.findUnique({ where: { email }, include: { employee: true } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new ApiError(401, "Email atau password salah.");
    }
    if (!user.isActive) throw new ApiError(403, "Akun Anda telah dinonaktifkan.");

    const nama = user.employee?.nama ?? user.email.split("@")[0];
    const token = await createSessionToken({
      userId: user.id,
      role: user.role as Role,
      email: user.email,
      nama,
      mustChangePassword: user.mustChangePassword,
    });
    (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);

    return { ok: true, mustChangePassword: user.mustChangePassword };
  });
}
