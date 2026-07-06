import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { serializeEmployee } from "@/lib/employee-logic";
import { dateOnly } from "@/lib/serialize";

// Edit data karyawan.
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireRole("ADMIN", "SUPERADMIN");
    const id = Number((await ctx.params).id);
    const b = await req.json();

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        nama: b.nama,
        divisi: b.divisi || null,
        jabatan: b.jabatan || null,
        jabatan2: b.jabatan2 || null,
        ...(b.tanggalLahir !== undefined ? { tanggalLahir: dateOnly(b.tanggalLahir) } : {}),
        ...(b.tanggalMulaiBekerja !== undefined ? { tanggalMulaiBekerja: dateOnly(b.tanggalMulaiBekerja) } : {}),
      },
    });

    return { employee: serializeEmployee(updated) };
  });
}

// Hapus data karyawan (akun login TIDAK ikut terhapus). Bersihkan referensi dulu.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireRole("ADMIN", "SUPERADMIN");
    const id = Number((await ctx.params).id);

    await prisma.$transaction([
      prisma.leaveRequest.deleteMany({ where: { employeeId: id } }),
      prisma.compensationHistory.deleteMany({ where: { employeeId: id } }),
      prisma.reminderContact.updateMany({ where: { employeeId: id }, data: { employeeId: null } }),
      prisma.employee.delete({ where: { id } }),
    ]);

    return { employeeId: id };
  });
}
