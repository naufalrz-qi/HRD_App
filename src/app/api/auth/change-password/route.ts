import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { ApiError, handle } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export async function POST(req: Request) {
  return handle(async () => {
    const session = await requireSession();
    const { newPassword, confirmPassword } = await req.json();

    if (!newPassword || newPassword !== confirmPassword) {
      throw new ApiError(400, "Konfirmasi password tidak cocok.");
    }
    if (newPassword.length < 6) throw new ApiError(400, "Password minimal 6 karakter.");

    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: hashPassword(newPassword), mustChangePassword: false },
    });

    // Perbarui cookie agar mustChangePassword=false (lepas kunci change-password).
    const token = await createSessionToken({ ...session, mustChangePassword: false });
    (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);

    return { ok: true };
  });
}
