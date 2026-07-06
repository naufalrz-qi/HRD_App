-- Index tambahan untuk kolom FK/filter/sort yang sebelumnya tidak diindeks.
-- Proyek ini tidak memakai riwayat `prisma migrate` (lihat: tidak ada folder prisma/migrations,
-- dan skema di-sync ke DB lewat `npm run db:push` / `prisma db push`). Jalankan salah satu:
--   1) `npx prisma db push` di environment dengan DATABASE_URL/DIRECT_URL asli — akan menerapkan
--      index yang ditambahkan di schema.prisma secara otomatis (paling direkomendasikan), ATAU
--   2) Jalankan file SQL ini langsung (mis. lewat Supabase SQL editor / psql) jika ingin kontrol
--      penuh atas kapan index dibuat (CONCURRENTLY agar tidak mengunci tabel saat proses berjalan).
--
-- CREATE INDEX CONCURRENTLY tidak bisa dijalankan di dalam blok transaksi — jalankan tiap
-- statement secara individual (default psql/Supabase SQL editor sudah begitu).

CREATE INDEX CONCURRENTLY IF NOT EXISTS "leave_requests_employee_id_idx"
  ON "leave_requests" ("employee_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "leave_requests_requester_user_id_idx"
  ON "leave_requests" ("requester_user_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "leave_requests_status_idx"
  ON "leave_requests" ("status");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "leave_requests_created_at_idx"
  ON "leave_requests" ("created_at");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "compensation_histories_employee_id_idx"
  ON "compensation_histories" ("employee_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "compensation_histories_created_at_idx"
  ON "compensation_histories" ("created_at");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "reminder_contacts_employee_id_idx"
  ON "reminder_contacts" ("employee_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "reminder_contacts_is_active_kategori_idx"
  ON "reminder_contacts" ("is_active", "kategori");
