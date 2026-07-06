import { prisma } from "@/lib/db";
import { ApiError, handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { calculateHakCuti, defaultPassword, serializeEmployee } from "@/lib/employee-logic";
import { dateOnly, serializeUser } from "@/lib/serialize";

// Tambah karyawan + buat akun login PEGAWAI (porting employee_controller.create).
export async function POST(req: Request) {
  return handle(async () => {
    await requireRole("ADMIN", "SUPERADMIN");
    const b = await req.json();
    const email: string = (b.email ?? "").trim();
    if (!b.nama || !email) throw new ApiError(400, "Nama dan email wajib diisi.");

    if (await prisma.user.findUnique({ where: { email } })) {
      throw new ApiError(409, "Email sudah terdaftar.");
    }

    const hakCuti = calculateHakCuti(b.tanggalMulaiBekerja ?? null, b.jabatan ?? null);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(defaultPassword(b.tanggalLahir ?? null)),
        role: "PEGAWAI",
        isActive: true,
        mustChangePassword: true,
        employee: {
          create: {
            nama: b.nama,
            divisi: b.divisi || null,
            jabatan: b.jabatan || null,
            jabatan2: b.jabatan2 || null,
            tanggalLahir: dateOnly(b.tanggalLahir),
            tanggalMulaiBekerja: dateOnly(b.tanggalMulaiBekerja),
            hakCutiTahunan: hakCuti,
          },
        },
      },
      include: { employee: true },
    });

    return { employee: serializeEmployee(user.employee!), user: serializeUser(user) };
  });
}
