// Konfigurasi scheduler disimpan di tabel app_settings (FS ephemeral di Vercel).
import { prisma } from "./db";
import type { SchedulerSettings } from "@/types";

const KEY = "scheduler";
const DEFAULT: SchedulerSettings = { hour: 7, minute: 0, maxTextLimit: 10 };

export async function getSchedulerSettings(): Promise<SchedulerSettings> {
  const row = await prisma.appSetting.findUnique({ where: { key: KEY } });
  if (!row) return DEFAULT;
  try {
    return { ...DEFAULT, ...JSON.parse(row.value) };
  } catch {
    return DEFAULT;
  }
}

export async function setSchedulerSettings(s: SchedulerSettings): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: KEY },
    update: { value: JSON.stringify(s) },
    create: { key: KEY, value: JSON.stringify(s) },
  });
}
