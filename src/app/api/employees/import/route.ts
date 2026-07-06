import { prisma } from "@/lib/db";
import { ApiError, handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { hashPasswordAsync } from "@/lib/password";
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

    // Cek email yang sudah terdaftar lewat SATU query (bukan findUnique per baris).
    const candidateEmails = [...new Set(rows.map((r) => r.email).filter((e): e is string => !!e))];
    const existing = candidateEmails.length
      ? await prisma.user.findMany({ where: { email: { in: candidateEmails } }, select: { email: true } })
      : [];
    const existingEmails = new Set(existing.map((u) => u.email));

    // Dedup dalam file itu sendiri (baris dengan email duplikat: hanya yang pertama diproses).
    const seen = new Set<string>();
    const toCreate = rows.filter((r) => {
      if (!r.email || existingEmails.has(r.email) || seen.has(r.email)) return false;
      seen.add(r.email);
      return true;
    });

    // Hash password secara konkuren di libuv threadpool (tidak blocking event loop per baris).
    const passwordHashes = await Promise.all(toCreate.map((r) => hashPasswordAsync(defaultPassword(r.tanggalLahir))));

    const created = await Promise.all(
      toCreate.map((r, i) =>
        prisma.user.create({
          data: {
            email: r.email,
            passwordHash: passwordHashes[i],
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
                hakCutiTahunan: calculateHakCuti(r.tanggalMulaiBekerja, r.jabatan),
              },
            },
          },
        })
      )
    );

    const added = created.length;
    return { ok: true, added, message: `Berhasil mengimpor ${added} karyawan. Password default: SCT-DDMMYYYY (tanggal lahir).` };
  });
}
