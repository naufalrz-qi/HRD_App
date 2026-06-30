import { prisma } from "@/lib/db";
import { ApiError, handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { calculateHakCuti, defaultPassword } from "@/lib/employee-logic";
import { parseEmployeeImport } from "@/lib/excel";
import { dateOnly } from "@/lib/serialize";

export const runtime = "nodejs";

// Import massal dari Excel (porting employee_controller.import_excel).
export async function POST(req: Request) {
  return handle(async () => {
    await requireRole("ADMIN", "SUPERADMIN");
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "Tidak ada file yang diunggah.");
    if (!/\.(xlsx|xls)$/i.test(file.name)) throw new ApiError(400, "Format file harus .xlsx atau .xls");

    const rows = await parseEmployeeImport(await file.arrayBuffer());
    let added = 0;

    for (const r of rows) {
      if (!r.email || (await prisma.user.findUnique({ where: { email: r.email } }))) continue;
      const hakCuti = calculateHakCuti(r.tanggalMulaiBekerja, r.jabatan);
      await prisma.user.create({
        data: {
          email: r.email,
          passwordHash: hashPassword(defaultPassword(r.tanggalLahir)),
          role: "PEGAWAI",
          isActive: true,
          mustChangePassword: true,
          employee: {
            create: {
              nama: r.nama,
              divisi: r.divisi || null,
              jabatan: r.jabatan || null,
              jabatan2: r.jabatan2 || null,
              tanggalLahir: dateOnly(r.tanggalLahir),
              tanggalMulaiBekerja: dateOnly(r.tanggalMulaiBekerja),
              hakCutiTahunan: hakCuti,
            },
          },
        },
      });
      added += 1;
    }

    return { ok: true, added, message: `Berhasil mengimpor ${added} karyawan. Password default: SCT-DDMMYYYY (tanggal lahir).` };
  });
}
