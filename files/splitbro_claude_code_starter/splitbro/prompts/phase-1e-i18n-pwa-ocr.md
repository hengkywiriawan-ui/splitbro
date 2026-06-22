# Phase 1E — Bilingual, PWA & Scan Struk (OCR)

Prasyarat: Phase 1D selesai. Baca `docs/PRD_SplitBro.md` (FR-6.5, FR-10, FR-11).

## Tujuan fase ini
Finalisasi pengalaman: bahasa lengkap, app installable sebagai PWA, dan fitur scan struk untuk mempercepat input item.

## Tugas
1. **Bilingual lengkap (FR-10)**
   - Pastikan SEMUA teks UI lewat i18n (Indonesia + English). Audit string yang masih hardcode.
   - Toggle bahasa di UI; simpan preferensi (localStorage).

2. **PWA (FR-11)**
   - Setup next-pwa / Workbox: service worker, manifest, ikon, splash.
   - Installable (Add to Home Screen) di mobile.
   - App shell tersedia offline (read terbatas). Pastikan tidak merusak auth flow.

3. **Scan Struk OCR (FR-6.5)**
   - Mode item_based: tombol upload/foto struk.
   - Proses dengan **Tesseract.js** di client (gratis, tanpa server).
   - Tampilkan hasil OCR sebagai teks mentah / draft list item (nama + harga terdeteksi).
   - Admin WAJIB merapikan/validasi manual sebelum simpan (jangan asumsikan OCR akurat).
   - Setelah dirapikan, item masuk list normal & bisa di-assign (alur fase 1C).

## Acceptance criteria
- Tidak ada teks UI yang hardcode; switch bahasa berfungsi menyeluruh.
- App bisa di-install di HP & punya app shell offline.
- Scan struk menghasilkan draft item yang bisa diedit lalu disimpan; fallback ke input manual mulus saat OCR jelek.
- Type check lolos. Lighthouse PWA check wajar (installable).

## Catatan
- Tesseract.js berjalan di browser — perhatikan ukuran bundle & loading model (lazy load saat fitur dipakai).
- Tetap free-tier; tidak ada panggilan API berbayar untuk OCR.
- Ini fase terakhir MVP. Setelah ini, fitur Phase 2 (PRD bagian 11) bersifat opsional.
