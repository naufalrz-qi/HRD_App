import { handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { checkAndSendReminders } from "@/lib/reminders";

export const runtime = "nodejs";
export const maxDuration = 60;

// Jalankan reminder manual ("Test Jalankan Reminder").
export async function POST() {
  return handle(async () => {
    await requireRole("SUPERADMIN");
    const summary = await checkAndSendReminders();
    return { ok: true, summary, message: "Pengecekan & pengiriman reminder dijalankan." };
  });
}
