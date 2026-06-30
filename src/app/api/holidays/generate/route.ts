import { prisma } from "@/lib/db";
import { ApiError, handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { dateOnly } from "@/lib/serialize";

interface NagerHoliday {
  date: string;
  localName: string;
}

// Tarik libur nasional dari Nager.Date (porting holiday_controller.generate_api).
export async function POST(req: Request) {
  return handle(async () => {
    await requireRole("ADMIN", "SUPERADMIN");
    const { year } = await req.json();
    const y = Number(year) || new Date().getFullYear();

    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${y}/ID`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) throw new ApiError(502, "Gagal menarik data dari API Nager.Date.");
    const data = (await res.json()) as NagerHoliday[];

    let count = 0;
    for (const item of data) {
      const d = dateOnly(item.date)!;
      if (await prisma.publicHoliday.findUnique({ where: { tanggal: d } })) continue;
      await prisma.publicHoliday.create({ data: { tanggal: d, keterangan: item.localName } });
      count += 1;
    }

    return {
      ok: true,
      count,
      message:
        count > 0
          ? `Berhasil menambahkan ${count} hari libur nasional tahun ${y}.`
          : `Tidak ada tanggal baru (semua libur ${y} sudah ada).`,
    };
  });
}
