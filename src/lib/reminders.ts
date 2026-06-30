// Logika reminder — porting app/scheduler.py check_and_send_reminders.
// Dipakai oleh endpoint cron (terjadwal) & trigger manual.
import ExcelJS from "exceljs";
import type { Employee as PrismaEmployee } from "@prisma/client";
import { prisma } from "./db";
import { sendWhatsappMessage, sendWhatsappDocument } from "./whatsapp";
import { getSchedulerSettings } from "./settings";

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** Tanggal sekarang dalam WIB (UTC+7) sebagai wall-clock pada objek Date (baca via getUTC*). */
function nowWIB(): Date {
  return new Date(Date.now() + 7 * 3600 * 1000);
}

function utcMidnight(y: number, m: number, d: number): number {
  return Date.UTC(y, m, d);
}

interface ReminderSummary {
  birthdays: number;
  contractsH30: number;
  contractsH7: number;
  messagesSent: number;
}

export async function checkAndSendReminders(): Promise<ReminderSummary> {
  const summary: ReminderSummary = { birthdays: 0, contractsH30: 0, contractsH7: 0, messagesSent: 0 };
  const { maxTextLimit } = await getSchedulerSettings();

  const wib = nowWIB();
  const ty = wib.getUTCFullYear();
  const tm = wib.getUTCMonth();
  const td = wib.getUTCDate();
  const todayMid = utcMidnight(ty, tm, td);

  const tomorrow = new Date(todayMid + 86_400_000);
  const tmoMonth = tomorrow.getUTCMonth();
  const tmoDate = tomorrow.getUTCDate();

  const employees = await prisma.employee.findMany();
  const hrdContacts = await prisma.reminderContact.findMany({ where: { isActive: true, kategori: "HRD" } });

  const send = async (to: string, text: string) => {
    if (await sendWhatsappMessage(to, text)) summary.messagesSent += 1;
  };

  // 1) Ulang tahun H-1.
  const birthdayEmps = employees.filter(
    (e) => e.tanggalLahir && e.tanggalLahir.getUTCMonth() === tmoMonth && e.tanggalLahir.getUTCDate() === tmoDate
  );
  summary.birthdays = birthdayEmps.length;
  if (birthdayEmps.length && hrdContacts.length) {
    for (const emp of birthdayEmps) {
      const jabatanText = emp.jabatan2 && emp.divisi ? `${emp.jabatan2} ${emp.divisi}` : emp.jabatan2 || emp.divisi || "";
      const jd = jabatanText ? ` (${jabatanText})` : "";
      const tglIndo = `${String(tmoDate).padStart(2, "0")} ${BULAN[tmoMonth]}`;
      const msg1 = `Selamat pagi Boss, mau mengingatkan besok tgl ${tglIndo} ultah ${emp.nama}${jd}`;
      const msg2 = `Selamat Ulang Tahun ${emp.nama}${jd}\n\nTuhan memberkati ${emp.nama} panjang umur, bahagia, sehat dan sukses selalu.. 👏🎂🙏`;
      for (const c of hrdContacts) {
        await send(c.nomorTelepon, msg1);
        await send(c.nomorTelepon, msg2);
      }
    }
  }

  // 2) Kontrak H-30 & H-7.
  const expiringH30: PrismaEmployee[] = [];
  const expiringH7: PrismaEmployee[] = [];
  for (const e of employees) {
    if (!e.tanggalBerakhirKontrak) continue;
    const daysLeft = Math.round(
      (utcMidnight(
        e.tanggalBerakhirKontrak.getUTCFullYear(),
        e.tanggalBerakhirKontrak.getUTCMonth(),
        e.tanggalBerakhirKontrak.getUTCDate()
      ) - todayMid) / 86_400_000
    );
    if (daysLeft === 30) expiringH30.push(e);
    else if (daysLeft === 7) expiringH7.push(e);
  }
  summary.contractsH30 = expiringH30.length;
  summary.contractsH7 = expiringH7.length;

  if (!hrdContacts.length) return summary;

  const formatList = (emps: PrismaEmployee[]) =>
    emps
      .map((emp, i) => {
        const k = emp.tanggalBerakhirKontrak!;
        const tgl = `${k.getUTCDate()} ${BULAN[k.getUTCMonth()]} ${k.getUTCFullYear()}`;
        return `${i + 1}. ${emp.nama} (${emp.divisi} - ${emp.jabatan2}) - Habis: ${tgl}`;
      })
      .join("\n");

  // H-30
  if (expiringH30.length) {
    const nextMonth = BULAN[(tm + 1) % 12];
    const header = `⚠️ *Reminder Kontrak Bulan ${nextMonth}*`;
    if (expiringH30.length <= maxTextLimit) {
      const msg = `${header}\n\nTerdapat ${expiringH30.length} karyawan yang kontraknya akan habis bulan depan:\n${formatList(expiringH30)}\n\nMohon segera ditindaklanjuti.`;
      for (const c of hrdContacts) await send(c.nomorTelepon, msg);
    } else {
      const buf = await buildContractExcel(expiringH30);
      const caption = `${header}\n\nBerikut terlampir dokumen daftar ${expiringH30.length} karyawan yang kontraknya akan habis bulan depan. Mohon segera ditindaklanjuti.`;
      const fname = `Reminder_Kontrak_H_30_${ty}${String(tm + 1).padStart(2, "0")}${String(td).padStart(2, "0")}.xlsx`;
      for (const c of hrdContacts) {
        if (await sendWhatsappDocument(c.nomorTelepon, buf, fname, caption)) summary.messagesSent += 1;
      }
    }
  }

  // H-7
  if (expiringH7.length) {
    const thisMonth = BULAN[tm];
    const header = `⚠️ *Reminder Kontrak Bulan ${thisMonth}*`;
    const msg =
      expiringH7.length <= maxTextLimit
        ? `${header}\n\nTerdapat ${expiringH7.length} karyawan yang kontraknya akan habis dalam 7 hari:\n${formatList(expiringH7)}\n\nHarap segera mengambil keputusan dan memproses dokumen perpanjangan.`
        : `${header}\n\nTerdapat ${expiringH7.length} karyawan yang kontraknya akan habis dalam 7 hari. Harap segera mengambil keputusan dan memproses dokumen perpanjangan.`;
    for (const c of hrdContacts) await send(c.nomorTelepon, msg);
  }

  return summary;
}

async function buildContractExcel(emps: PrismaEmployee[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Reminder Kontrak");
  ws.addRow(["Nama", "Divisi", "Jabatan", "Status", "Tanggal Habis Kontrak"]);
  ws.getRow(1).font = { bold: true };
  for (const e of emps) {
    ws.addRow([
      e.nama,
      e.divisi ?? "",
      e.jabatan2 ?? "",
      e.statusKaryawan ?? "",
      e.tanggalBerakhirKontrak ? e.tanggalBerakhirKontrak.toISOString().slice(0, 10) : "",
    ]);
  }
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
