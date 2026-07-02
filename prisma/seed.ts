// Seed awal — porting seed.py: superadmin + employee terkait + setting default.
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

const firstNames = ["Budi", "Siti", "Agus", "Dewi", "Andi", "Rini", "Hadi", "Nina", "Eko", "Maya", "Dwi", "Lestari", "Tri", "Sri", "Iwan", "Ayu", "Joko", "Putri", "Rudi", "Dian"];
const lastNames = ["Saputra", "Wijaya", "Kusuma", "Setiawan", "Pratama", "Lestari", "Sari", "Purnama", "Hidayat", "Susanti", "Wahyuni", "Santoso", "Gunawan", "Nugroho", "Wibowo"];
const divisions = ["IT", "HR", "Finance", "Marketing", "Sales", "Operations"];
const positions = ["Staff", "Supervisor", "Manager"];
const statusList = ["Kontrak", "Tetap"];

const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

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
            jabatan: "Head",
            tanggalMulaiBekerja: new Date(),
            hakCutiTahunan: 12,
          },
        },
      },
    });
    console.log(`Superadmin created: ${user.email} / superadmin123`);
  }

  // Setting scheduler default
  await prisma.appSetting.upsert({
    where: { key: "scheduler" },
    update: {},
    create: { key: "scheduler", value: JSON.stringify({ hour: 7, minute: 0, maxTextLimit: 10 }) },
  });

  console.log("Seeding 200 random employees...");
  
  // Hash password once for all generated users to speed up seeding
  const defaultPasswordHash = hashPassword("pegawai123");

  const newUsers = [];
  
  // We use transactions or loop. A loop of 200 is fine.
  for (let i = 1; i <= 200; i++) {
    const fn = getRandom(firstNames);
    const ln = getRandom(lastNames);
    const nama = `${fn} ${ln} ${i}`; // unique name
    const randEmail = `pegawai${i}@hrapp.com`;

    newUsers.push({
      email: randEmail,
      nama,
      divisi: getRandom(divisions),
      jabatan: getRandom(positions),
      statusKaryawan: getRandom(statusList)
    });
  }

  // Upsert all sequentially
  for (const u of newUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash: defaultPasswordHash,
        role: "PEGAWAI",
        isActive: true,
        employee: {
          create: {
            nama: u.nama,
            divisi: u.divisi,
            jabatan: u.jabatan,
            tanggalLahir: randomDate(new Date(1980, 0, 1), new Date(2000, 0, 1)),
            tanggalMulaiBekerja: randomDate(new Date(2020, 0, 1), new Date()),
            statusKaryawan: u.statusKaryawan,
            hakCutiTahunan: 12,
            cutiTerpakai: Math.floor(Math.random() * 5),
          }
        }
      }
    });
  }
  
  console.log("Successfully seeded 200 random employees.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
