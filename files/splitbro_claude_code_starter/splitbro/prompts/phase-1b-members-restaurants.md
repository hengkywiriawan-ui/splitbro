# Phase 1B — Member, Info Pembayaran & Restoran

Prasyarat: Phase 1A selesai. Baca `docs/PRD_SplitBro.md` (FR-3, FR-4, FR-5) dan `.claude/rules/firestore-schema.md`.

## Tujuan fase ini
Admin bisa mengelola peserta, info pembayaran, dan daftar restoran (dengan setting PPN) dalam sebuah sesi.

## Tugas
1. **Manajemen member (FR-3)**
   - Tambah member: nama (wajib), email & no. HP (opsional), deposit (default 0).
   - Member di-embed sebagai array di dokumen sesi (lihat skema).
   - Edit & hapus member. Beri peringatan jika member sudah punya item/tagihan (cek di fase berikutnya; untuk sekarang siapkan struktur agar aman).
   - Generate `memberId` unik per member.

2. **Info pembayaran (FR-4)**
   - Form edit `paymentInfo`: bankName, accountNumber, accountName, ewallet, note.
   - Simpan ke dokumen sesi.

3. **Manajemen restoran (FR-5)**
   - Subcollection `restaurants` per sesi.
   - Tambah restoran: nama, tanggal (opsional), `order`.
   - **Setting PPN per restoran:** toggle `taxIncluded` (harga sudah termasuk PPN?) + field `taxRate` (default ikut `session.defaultTaxRate`).
   - [Mode equal] field input `totalAmount`.
   - [Mode item_based] tombol/area menuju pengelolaan item (implement di fase 1C — sekarang cukup placeholder/navigasi).
   - Edit & hapus restoran.

4. **Types**
   - Tambahkan type `Restaurant` & update type `Session` (members, paymentInfo) di `lib/types.ts`.

## Acceptance criteria
- Admin bisa tambah/edit/hapus member dengan field lengkap.
- Admin bisa isi info pembayaran dan tersimpan.
- Admin bisa tambah restoran dengan setting PPN; tampilan input berbeda sesuai mode sesi (equal vs item_based).
- Type check lolos.

## Catatan
- UI tetap mobile-first & bilingual (i18n).
- Belum ada perhitungan — itu fase 1C.
- Buat perubahan minimal; jangan sentuh kode auth/sesi dari 1A kecuali perlu.
