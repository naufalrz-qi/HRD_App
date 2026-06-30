# Arunika HRD — Frontend (Next.js)

Refactor frontend aplikasi HRD (sebelumnya Flask + Jinja2) ke **Next.js 16 (App Router) + TypeScript + Tailwind v4**, siap deploy ke **Vercel**.

> **Status: Fase 1 — Frontend only.**
> Semua data berasal dari **mock data** di memori (`src/lib/mock-data.ts`) dengan tipe yang mencerminkan skema DB yang ada (skema **tidak diubah**). Aksi tulis (ajukan/approve/reject cuti, CRUD, dll) memanipulasi state di memori dan menampilkan toast — placeholder yang akan disambung ke API pada **fase backend** (API JSON, Postgres, scheduler/Vercel Cron, WhatsApp).

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build produksi (cek tipe + lint-clean)
npm run lint
```

## Pratinjau per role

Aplikasi default login sebagai **SUPERADMIN**. Gunakan pemilih **"Pratinjau sebagai"** di kanan atas (topbar) untuk berganti antara `SUPERADMIN`, `ADMIN`, dan `PEGAWAI` — sidebar & akses halaman mengikuti role (setara `@role_required` di Flask).

## Struktur

```
src/
  app/
    (auth)/        login, change-password (tanpa sidebar)
    (app)/         dashboard, leave/*, employees, users, holidays, reminders (shell sidebar)
    layout.tsx     root: font Montserrat + init tema (anti-flash)
    providers.tsx  ToastProvider + AppProvider (store mock)
  components/      Sidebar, Topbar, ThemeToggle, DataTable, Toast, RoleGuard, ui.tsx
  lib/             store.tsx (state+aksi mock), mock-data.ts, helpers.ts (porting logika cuti)
  types/           interface mirror skema DB
```

## Pemetaan halaman ↔ rute Flask lama

| Next.js | Flask lama |
|---|---|
| `/login`, `/change-password` | `auth_controller` |
| `/dashboard` (admin & pegawai) | `dashboard_controller` |
| `/leave/request`, `/leave/history` | `leave_controller` (pegawai) |
| `/leave/manage` | `leave_controller.manage_leaves` |
| `/employees` | `employee_controller` |
| `/users` | `user_controller` |
| `/holidays` | `holiday_controller` |
| `/reminders` | `reminder_controller` |
