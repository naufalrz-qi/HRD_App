"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { Button, Card, FormField, Input, Select, Textarea } from "@/components/ui";
import { getTotalSisaCuti } from "@/lib/helpers";

export default function RequestLeavePage() {
  const router = useRouter();
  const { notify } = useToast();
  const { currentUser, currentEmployee, employees, requestLeave } = useApp();
  const isSuperadmin = currentUser?.role === "SUPERADMIN";

  const [employeeId, setEmployeeId] = useState<number | "">(isSuperadmin ? "" : currentEmployee?.id ?? "");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [alasan, setAlasan] = useState("");

  if (!isSuperadmin && !currentEmployee) {
    return <Card>Anda tidak memiliki data karyawan terkait. Tidak dapat mengajukan cuti.</Card>;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const empId = isSuperadmin ? Number(employeeId) : currentEmployee?.id;
    if (!empId) {
      notify("Pilih karyawan terlebih dahulu.", "danger");
      return;
    }
    const res = await requestLeave({ employeeId: empId, tanggalMulai, tanggalSelesai, alasan });
    notify(res.message, res.ok ? "success" : "danger");
    if (res.ok) router.push(isSuperadmin ? "/leave/manage" : "/dashboard");
  };

  return (
    <Card className="mx-auto max-w-xl">
      <h2 className="mb-5 text-xl font-bold text-text-heading">Form Pengajuan Cuti</h2>

      {isSuperadmin ? (
        <div className="mb-5 rounded-md border border-warning/30 bg-warning-light p-3 text-sm text-warning">
          <strong>Mode Superadmin:</strong> Anda dapat menginputkan cuti untuk karyawan manapun. Status cuti akan
          otomatis <strong>Disetujui</strong>.
        </div>
      ) : (
        currentEmployee && (
          <div className="mb-5 rounded-md border border-info/30 bg-info-light p-3 text-sm text-info">
            Sisa Cuti Anda: <strong>{getTotalSisaCuti(currentEmployee)} Hari</strong>
          </div>
        )
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {isSuperadmin && (
          <FormField label="Karyawan">
            <Select value={employeeId} onChange={(e) => setEmployeeId(Number(e.target.value))} required>
              <option value="" disabled>Pilih Karyawan</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nama} (Sisa Cuti: {getTotalSisaCuti(emp)})
                </option>
              ))}
            </Select>
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tanggal Mulai">
            <Input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} required />
          </FormField>
          <FormField label="Tanggal Selesai">
            <Input type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} required />
          </FormField>
        </div>

        <FormField label="Alasan Cuti">
          <Textarea rows={4} value={alasan} onChange={(e) => setAlasan(e.target.value)} required />
        </FormField>

        <div className="flex gap-2">
          <Button type="submit">Simpan Cuti</Button>
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>Batal</Button>
        </div>
      </form>
    </Card>
  );
}
