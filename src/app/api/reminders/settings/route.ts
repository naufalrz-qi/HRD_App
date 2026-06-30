import { ApiError, handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { getSchedulerSettings, setSchedulerSettings } from "@/lib/settings";

export async function GET() {
  return handle(async () => {
    await requireRole("SUPERADMIN");
    return await getSchedulerSettings();
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    await requireRole("SUPERADMIN");
    const { hour, minute, maxTextLimit } = await req.json();
    const h = Number(hour);
    const m = Number(minute);
    const lim = Number(maxTextLimit);
    if (!Number.isInteger(h) || h < 0 || h > 23 || !Number.isInteger(m) || m < 0 || m > 59 || lim < 1) {
      throw new ApiError(400, "Format jadwal tidak valid.");
    }
    await setSchedulerSettings({ hour: h, minute: m, maxTextLimit: lim });
    return { ok: true };
  });
}
