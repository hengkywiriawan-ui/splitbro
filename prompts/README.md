# Cara Pakai Prompt Fase

Folder ini berisi prompt yang dijalankan **satu per satu** di Claude Code. Jangan jalankan semua sekaligus.

## Langkah awal (sekali saja)
1. Unzip seluruh isi paket ini ke folder repo kosong.
2. Buka terminal di folder itu, jalankan `claude`.
3. Claude Code otomatis membaca `CLAUDE.md` + rule di `.claude/rules/`.
4. (Opsional) Inisialisasi git: `git init`.

## Menjalankan tiap fase
Untuk setiap fase, buka file prompt-nya, **copy seluruh isinya**, paste ke Claude Code. Selesaikan & uji satu fase sebelum lanjut ke fase berikutnya.

Urutan:
1. `phase-1a-setup-auth-session.md` — scaffold project, auth admin, manajemen sesi
2. `phase-1b-members-restaurants.md` — member, info pembayaran, restoran + PPN
3. `phase-1c-items-calculation.md` — item-based + shared cost + calculation engine
4. `phase-1d-summary-export.md` — ringkasan settlement, export Excel/PDF, share link
5. `phase-1e-i18n-pwa-ocr.md` — bilingual, PWA installable, scan struk OCR

## Tips
- Kalau Claude Code mulai "ngarang" requirement, ingatkan: *"cek docs/PRD_SplitBro.md dulu"*.
- Setelah tiap fase, minta Claude Code jalankan type check & rapikan.
- Jangan ragu minta penjelasan keputusan teknis — kamu yang pegang kendali arsitektur.
