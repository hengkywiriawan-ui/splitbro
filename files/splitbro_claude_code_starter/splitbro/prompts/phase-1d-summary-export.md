# Phase 1D — Ringkasan, Export & Share

Prasyarat: Phase 1C selesai. Baca `docs/PRD_SplitBro.md` (FR-8, FR-9).

## Tujuan fase ini
Menampilkan hasil settlement dan membagikannya: ringkasan, export Excel & PDF, share link read-only.

## Tugas
1. **Halaman ringkasan (FR-8)**
   - Per member tampilkan: konsumsi, shared cost share, total tagihan, deposit, net (harus bayar / kembali).
   - Tampilkan grand total & total deposit.
   - Recalculation real-time saat data berubah (gunakan `computeSettlement` dari 1C).
   - Beda warna/penanda untuk net positif (harus bayar) vs negatif (uang kembali).

2. **Export Excel (FR-9.1)**
   - Pakai SheetJS (xlsx). Rekap per restoran + ringkasan per orang (mirip layout file referensi).
   - Sertakan info pembayaran.

3. **Export PDF (FR-9.2)**
   - Pakai pdfmake. Laporan rapi siap kirim, termasuk info pembayaran (rekening/e-wallet).
   - Mobile-friendly, mudah dibaca.

4. **Share link read-only (FR-9.3)**
   - Route Next.js publik berbasis `shareToken` (server-side validasi token), TANPA login.
   - Tampilkan rincian tagihan tiap member + info pembayaran.
   - JANGAN ekspos Firestore langsung ke publik (lihat security rules di rule schema).
   - Halaman ini read-only.

5. **(Opsional) Share WhatsApp (FR-9.4)**
   - Tombol kirim via WA pakai no. HP member (link `wa.me`), isi ringkasan tagihan + link.

## Acceptance criteria
- Ringkasan menampilkan angka yang konsisten dengan engine, update real-time.
- File Excel & PDF ter-generate & bisa diunduh, isi benar & rapi.
- Share link bisa dibuka tanpa login dan hanya read-only.
- Type check lolos.

## Catatan
- Pembulatan display ikuti aturan di calculation rule.
- Format rupiah pakai helper tunggal.
- Bilingual tetap berlaku di halaman ringkasan & PDF/Excel header.
