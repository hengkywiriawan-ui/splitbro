# Rule: Conventions

## Bahasa & i18n
- UI bilingual: **Bahasa Indonesia + English**, bisa di-switch, preferensi tersimpan (localStorage).
- JANGAN hardcode teks UI. Semua string lewat layer i18n (mis. `next-intl` atau dictionary sederhana `lib/i18n/`).
- Key i18n deskriptif: `session.create.title`, bukan `text1`.

## Penamaan
- Komponen React: `PascalCase` (mis. `MemberList.tsx`).
- Fungsi & variabel: `camelCase`.
- Type/Interface: `PascalCase` (mis. `Session`, `Restaurant`).
- File util/logika: `kebab-case` atau `camelCase` konsisten dalam satu folder.
- Konstanta global: `UPPER_SNAKE_CASE`.

## Struktur folder (saran)
```
app/                 # Next.js App Router (routes)
components/          # UI components
lib/
  ├── firebase/      # init, auth, firestore helpers
  ├── calc/          # calculation engine (pure functions)
  ├── i18n/          # dictionaries / setup
  ├── export/        # excel & pdf generators
  └── types.ts       # shared TypeScript types
```

## Kode
- TypeScript strict mode ON.
- Logika hitung HARUS pure function (testable), pisahkan dari komponen UI.
- IMPORTANT: jalankan type check setiap selesai ubah kode.
- Buat perubahan minimal — jangan refactor file yang tidak diminta.
- Commit terpisah per perubahan logis, bukan satu commit raksasa.

## Mobile-first / PWA
- Desain untuk layar HP dulu; nyaman dipakai satu tangan.
- Target free-tier: hindari dependency berat & operasi yang boros read/write Firestore.
- Format angka pakai locale ID untuk display (mis. `Rp 1.486.400`).

## Currency display
- Helper tunggal untuk format rupiah, dipakai di seluruh app. Contoh: `formatIDR(amount)` → `"Rp 1.486.400"`.
- Internal selalu number; format hanya saat render/eksport.
