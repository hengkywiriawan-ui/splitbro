# SplitBro

PWA mobile-first untuk split bill trip multi-hari & multi-restoran. Dua mode: **Equal Split** & **Item-Based Split**.

## Untuk siapa paket ini
Repo starter yang dioptimalkan untuk development dengan **Claude Code**. Berisi project memory, rule modular, spesifikasi, dan prompt fase.

## Isi repo
```
splitbro/
├── CLAUDE.md                 ← project memory (otomatis dibaca Claude Code)
├── README.md                 ← file ini
├── .env.example              ← template env Firebase
├── docs/
│   └── PRD_SplitBro.md        ← spesifikasi lengkap (referensi)
├── .claude/
│   └── rules/                 ← rule modular (dimuat per kebutuhan)
│       ├── calculation-engine.md
│       ├── firestore-schema.md
│       └── conventions.md
└── prompts/                   ← prompt fase, jalankan satu per satu
    ├── README.md
    ├── phase-1a-setup-auth-session.md
    ├── phase-1b-members-restaurants.md
    ├── phase-1c-items-calculation.md
    ├── phase-1d-summary-export.md
    └── phase-1e-i18n-pwa-ocr.md
```

## Mulai
1. Unzip ke folder repo kosong.
2. (Opsional) `git init`.
3. Salin `.env.example` → `.env.local`, isi config Firebase kamu.
4. Jalankan `claude` di folder repo. Claude Code akan membaca `CLAUDE.md` + rules otomatis.
5. Ikuti `prompts/README.md` — kerjakan fase 1A → 1E berurutan.

## Tech stack
Next.js (App Router) + TypeScript + Tailwind · Firestore · Firebase Auth · Tesseract.js (OCR) · SheetJS + pdfmake (export) · Deploy Vercel/Firebase Hosting · PWA via next-pwa. Semua free-tier.
