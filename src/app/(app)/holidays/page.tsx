"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { RoleGuard } from "@/components/RoleGuard";
import { Button, Card, FormField, Input } from "@/components/ui";
import { formatTanggalPendek, parseDate } from "@/lib/helpers";

export default function HolidaysPage() {
  return (
    <RoleGuard allow={["ADMIN", "SUPERADMIN"]}>
      <Holidays />
    </RoleGuard>
  );
}

function Holidays() {
  const { holidays, saveHoliday, deleteHoliday, generateHolidays } = useApp();

  const grouped = useMemo(() => {
    const map = new Map<number, typeof holidays>();
    for (const h of holidays) {
      const year = parseDate(h.tanggal)?.getFullYear() ?? 0;
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(h);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [holidays]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-text-heading">Data Tanggal Merah (Libur Nasional)</h2>
      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Forms */}
        <div className="space-y-5">
          <Card>
            <h3 className="mb-4 font-semibold text-text-heading">Tambah Manual</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = e.currentTarget;
                const tanggal = (f.elements.namedItem("tanggal") as HTMLInputElement).value;
                const keterangan = (f.elements.namedItem("keterangan") as HTMLInputElement).value;
                saveHoliday({ tanggal, keterangan });
                f.reset();
              }}
              className="space-y-4"
            >
              <FormField label="Tanggal"><Input name="tanggal" type="date" required /></FormField>
              <FormField label="Keterangan (Nama Hari Libur)"><Input name="keterangan" placeholder="Cth: Tahun Baru 2026" required /></FormField>
              <Button type="submit" className="w-full">Simpan Manual</Button>
            </form>
          </Card>

          <Card>
            <h3 className="mb-1 font-semibold text-text-heading">Tarik Otomatis (API)</h3>
            <p className="mb-4 text-sm text-text-muted">Dapatkan jadwal hari libur nasional secara otomatis menggunakan Nager.Date API.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const year = Number((e.currentTarget.elements.namedItem("year") as HTMLInputElement).value);
                void generateHolidays(year);
              }}
              className="space-y-4"
            >
              <FormField label="Pilih Tahun"><Input name="year" type="number" defaultValue={2026} required /></FormField>
              <Button type="submit" variant="success" className="w-full">Tarik dari API</Button>
            </form>
          </Card>
        </div>

        {/* List */}
        <div className="space-y-5">
          {grouped.length ? (
            grouped.map(([year, list]) => (
              <Card key={year}>
                <h3 className="mb-3 inline-block border-b-2 border-primary pb-1 font-semibold text-text-heading">Tahun {year}</h3>
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-text-muted"><tr><th className="w-36 py-2 text-left">Tanggal</th><th className="text-left">Keterangan</th><th className="w-24 text-center">Aksi</th></tr></thead>
                  <tbody>
                    {[...list].sort((a, b) => a.tanggal.localeCompare(b.tanggal)).map((h) => (
                      <tr key={h.id} className="border-t border-card-border/60">
                        <td className="py-2 font-semibold text-danger">{formatTanggalPendek(h.tanggal)}</td>
                        <td>{h.keterangan}</td>
                        <td className="text-center">
                          <Button size="sm" variant="outline" className="!text-danger !border-danger/50" onClick={() => { if (confirm("Yakin ingin menghapus tanggal merah ini?")) deleteHoliday(h.id); }}>Hapus</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ))
          ) : (
            <Card className="py-12 text-center">
              <h4 className="text-text-muted">Belum ada data tanggal merah</h4>
              <p className="text-sm text-text-muted">Gunakan form di sebelah kiri untuk menambah data.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
