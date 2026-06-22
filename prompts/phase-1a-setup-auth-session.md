# Phase 1A — Setup, Auth Admin & Manajemen Sesi

Baca `docs/PRD_SplitBro.md` (bagian 2, 3, FR-1, FR-2) dan `.claude/rules/` sebelum mulai. Jangan menambah requirement yang tidak ada di PRD; kalau ragu, tanya saya.

## Tujuan fase ini
Scaffold proyek dan menyiapkan fondasi: autentikasi Admin + bisa membuat/mengelola sesi.

## Tugas
1. **Scaffold proyek**
   - Next.js (App Router) + TypeScript + Tailwind CSS.
   - Struktur folder sesuai `.claude/rules/conventions.md`.
   - Setup TypeScript strict mode.

2. **Firebase setup**
   - Init Firebase (Auth + Firestore) di `lib/firebase/`.
   - Pakai env vars untuk config (jangan hardcode). Sediakan `.env.example`.
   - Buat helper auth: Google Sign-In + Email/Password (FR-1).

3. **Auth flow**
   - Halaman login (Google + Email/Password).
   - Proteksi route: hanya Admin login yang bisa akses dashboard.
   - Logout.
   - Saat pertama login, buat dokumen `users/{uid}` jika belum ada (lihat skema).

4. **Manajemen sesi (FR-2)**
   - Buat sesi: input nama + pilih mode (equal / item_based). Mode TERKUNCI setelah dibuat.
   - List sesi milik Admin (filter by `adminId`), tampilkan status active/closed.
   - Edit nama sesi; ubah status; hapus sesi (dengan konfirmasi).
   - Set `defaultTaxRate` (default 11).
   - Generate `shareToken` unik saat sesi dibuat.

5. **Types**
   - Definisikan TypeScript types untuk `User` & `Session` di `lib/types.ts` sesuai `.claude/rules/firestore-schema.md`.

## Acceptance criteria
- Admin bisa login (Google & Email) dan logout.
- Admin bisa membuat sesi dengan memilih mode; mode tidak bisa diubah setelahnya.
- Admin hanya melihat sesinya sendiri.
- Type check lolos tanpa error.

## Catatan
- UI mobile-first. Teks lewat i18n (boleh dictionary sederhana dulu, ID + EN).
- Belum perlu fitur member/restoran/hitung — itu fase berikutnya.
- Jelaskan setiap keputusan teknis penting secara singkat. Buat perubahan minimal.
