import { prisma } from "@/lib/db";
import { ApiError, handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { dateOnly, serializeHoliday } from "@/lib/serialize";

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

    const items = data.map((item) => ({ tanggal: dateOnly(item.date)!, keterangan: item.localName }));
    const existing = await prisma.publicHoliday.findMany({
      where: { tanggal: { in: items.map((i) => i.tanggal) } },
      select: { tanggal: true },
    });
    const existingSet = new Set(existing.map((h) => h.tanggal.toISOString().slice(0, 10)));
    const newItems = items.filter((i) => !existingSet.has(i.tanggal.toISOString().slice(0, 10)));

    if (newItems.length > 0) {
      await prisma.publicHoliday.createMany({ data: newItems, skipDuplicates: true });
    }

    const created = newItems.length
      ? await prisma.publicHoliday.findMany({
          where: { tanggal: { in: newItems.map((i) => i.tanggal) } },
          orderBy: { tanggal: "asc" },
        })
      : [];

    return {
      count: created.length,
      holidays: created.map(serializeHoliday),
      message:
        created.length > 0
          ? `Berhasil menambahkan ${created.length} hari libur nasional tahun ${y}.`
          : `Tidak ada tanggal baru (semua libur ${y} sudah ada).`,
    };
  });
}
