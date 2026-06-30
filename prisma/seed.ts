// Seed awal — porting seed.py: superadmin + employee terkait + setting default.
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const email = "superadmin@hrapp.com";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Superadmin already exists.");
  } else {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword("superadmin123"),
        role: "SUPERADMIN",
        isActive: true,
        mustChangePassword: false,
        employee: {
          create: {
            nama: "System Superadmin",
            divisi: "Head Office",
            jabatan: "Head Office",
            tanggalMulaiBekerja: new Date(),
            hakCutiTahunan: 12,
          },
        },
      },
    });
    console.log(`Superadmin created: ${user.email} / superadmin123`);
  }

  // Setting scheduler default (jam 07:00, batas teks 10).
  await prisma.appSetting.upsert({
    where: { key: "scheduler" },
    update: {},
    create: { key: "scheduler", value: JSON.stringify({ hour: 7, minute: 0, maxTextLimit: 10 }) },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
