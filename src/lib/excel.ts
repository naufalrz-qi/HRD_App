// Import/export Excel pakai exceljs — porting employee_controller import/export.
import ExcelJS from "exceljs";

export interface ImportedRow {
  email: string;
  nama: string;
  divisi: string;
  jabatan: string;
  jabatan2: string;
  tanggalLahir: string | null; // 'YYYY-MM-DD'
  tanggalMulaiBekerja: string | null;
}

function cellToDate(v: ExcelJS.CellValue): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function cellToStr(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "object" && "text" in v) return String((v as { text: string }).text).trim();
  return String(v).trim();
}

/** Baca file Excel (buffer) → daftar baris karyawan. Kolom sesuai template lama. */
export async function parseEmployeeImport(buffer: ArrayBuffer): Promise<ImportedRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  // Petakan nama header → index kolom.
  const header: Record<string, number> = {};
  ws.getRow(1).eachCell((cell, col) => {
    header[cellToStr(cell.value).toUpperCase()] = col;
  });
  const get = (row: ExcelJS.Row, name: string): ExcelJS.CellValue =>
    header[name] ? row.getCell(header[name]).value : null;

  const rows: ImportedRow[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const email = cellToStr(get(row, "E-MAIL"));
    if (!email) return;
    rows.push({
      email,
      nama: cellToStr(get(row, "NAMA")),
      divisi: cellToStr(get(row, "DIVISI")),
      jabatan: cellToStr(get(row, "JABATAN")),
      jabatan2: cellToStr(get(row, "JABATAN 2")),
      tanggalLahir: cellToDate(get(row, "TANGGAL LAHIR")),
      tanggalMulaiBekerja: cellToDate(get(row, "TANGGAL MULAI BEKERJA")),
    });
  });
  return rows;
}

export interface ExportRow {
  Nama: string;
  Email: string;
  Role: string;
  Status: string;
  Divisi: string;
  "Jabatan 1": string;
  "Jabatan 2": string;
  "Tanggal Lahir": string;
  "Tanggal Mulai Bekerja": string;
  "Sisa Cuti": number;
  "Status Kontrak": string;
}

/** Bangun file Excel data karyawan (buffer). Kolom sesuai export lama. */
export async function buildEmployeeExport(rows: ExportRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Data Karyawan");
  const columns = [
    "Nama", "Email", "Role", "Status", "Divisi", "Jabatan 1", "Jabatan 2",
    "Tanggal Lahir", "Tanggal Mulai Bekerja", "Sisa Cuti", "Status Kontrak",
  ] as const;
  ws.addRow([...columns]);
  for (const r of rows) ws.addRow(columns.map((c) => r[c]));
  ws.getRow(1).font = { bold: true };
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
