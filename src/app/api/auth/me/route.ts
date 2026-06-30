import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { serializeUser } from "@/lib/serialize";

export async function GET() {
  return handle(async () => {
    const session = await getSession();
    if (!session) return { user: null };
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    return { user: user ? serializeUser(user) : null };
  });
}
