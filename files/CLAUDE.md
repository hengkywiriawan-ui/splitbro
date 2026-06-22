# SplitBro — Project Memory

PWA mobile-first untuk split bill trip multi-hari & multi-restoran. Dua mode: Equal Split & Item-Based Split. Dibuat oleh BA (bukan developer) yang nyetir lewat Claude Code — jelaskan keputusan teknis singkat saat relevan.

## Spesifikasi lengkap
Spesifikasi detail ada di `docs/PRD_SplitBro.md`. **Baca file itu sebelum mengimplementasikan fitur apa pun.** Jangan mengarang requirement yang tidak ada di PRD — kalau ragu, tanya.

## Tech Stack (tetap, jangan diganti tanpa persetujuan)
- Frontend: **Next.js (App Router)** + TypeScript + Tailwind CSS
- Database: **Google Cloud Firestore**
- Auth: **Firebase Authentication** (Google Sign-In + Email/Password)
- OCR scan struk: **Tesseract.js** (client-side, gratis)
- Export: **SheetJS (xlsx)** untuk Excel, **pdfmake** untuk PDF
- Deploy: **Vercel** atau **Firebase Hosting**
- PWA: **next-pwa** / Workbox
- Target: free-tier semua (Firestore Spark, Vercel Hobby)

## Aturan inti (selalu berlaku)
- **Hanya Admin yang login.** Member adalah data manual (nama wajib, email/HP opsional), bukan user berakun.
- **1 sesi = 1 mode.** Mode dipilih saat buat sesi dan terkunci. JANGAN buat fitur mix mode.
- UI **bilingual** (Indonesia + English) — semua teks lewat layer i18n, jangan hardcode string.
- Semua nominal **IDR tanpa desimal**. Pembulatan hanya di display, bukan di kalkulasi internal.
- Jangan drop/truncated table database, kecuali kamu meminta ijin saya

## IMPORTANT
- Logika perhitungan ada di `.claude/rules/calculation-engine.md`. Implementasikan PERSIS. Selisih hitung = bug kritis.
- Skema data ada di `.claude/rules/firestore-schema.md`. Jangan ubah bentuk dokumen tanpa update file itu.
- Konvensi kode & penamaan ada di `.claude/rules/conventions.md`.

## Workflow dengan Claude Code
- Kerja per-fase. Prompt fase ada di `prompts/`. Kerjakan satu fase sampai selesai sebelum lanjut.
- **Buat perubahan minimal** — jangan refactor kode yang tidak diminta.
- Jalankan type check setiap selesai ubah kode.
- Kalau ada dua pendekatan, jelaskan keduanya dan biarkan saya yang pilih — jangan ambil keputusan arsitektur sendiri.
