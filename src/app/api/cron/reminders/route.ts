import { NextResponse } from "next/server";
import { checkAndSendReminders } from "@/lib/reminders";
import { getSchedulerSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Dipanggil Vercel Cron tiap jam (vercel.json). Karena jadwal Vercel statis,
 * handler hanya menjalankan reminder bila JAM WIB cocok dengan setting pengguna.
 * Dilindungi header Authorization: Bearer $CRON_SECRET.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  // Vercel Cron mengirim header ini otomatis bila CRON_SECRET di-set.
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hour } = await getSchedulerSettings();
  const wibHour = new Date(Date.now() + 7 * 3600 * 1000).getUTCHours();

  if (wibHour !== hour) {
    return NextResponse.json({ ok: true, skipped: true, wibHour, scheduledHour: hour });
  }

  const summary = await checkAndSendReminders();
  return NextResponse.json({ ok: true, ran: true, summary });
}
