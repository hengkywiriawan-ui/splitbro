# PRD — SplitBro

**Product Requirements Document**
**Versi:** 1.0
**Tanggal:** 22 Juni 2026
**Tipe Produk:** Progressive Web App (PWA) — mobile-first
**Status:** Draft untuk implementasi (Phase 1)

---

## 1. Ringkasan Produk (Product Overview)

**SplitBro** adalah aplikasi PWA mobile-first untuk membagi tagihan (split bill) secara akurat dalam konteks **trip / kegiatan multi-hari** yang melibatkan banyak restoran dan banyak orang.

Berbeda dari split bill app generik yang hanya menangani satu tagihan, SplitBro dirancang dari dua pola nyata:

- **Equal Split** — tagihan tiap restoran dibagi rata ke semua peserta (referensi: file *Tagihan Kediri*).
- **Item-Based Split** — setiap orang membayar sesuai apa yang ia pesan/makan (referensi: file *Tagihan Gempol*).

Aplikasi mengelola sesi sebagai **1 Trip = 1 Sesi**, menampung biaya bersama (shared cost seperti driver/parkir), sistem deposit opsional, perhitungan PPN per restoran, dan menghasilkan laporan akhir yang bisa di-export serta dibagikan.

### 1.1 Tujuan (Objectives)

| Tujuan | Deskripsi |
|---|---|
| Akurasi hitungan | Menghilangkan hitung manual di Excel yang rawan salah |
| Fleksibilitas mode | Mendukung dua model split tanpa memaksa user belajar ulang |
| Transparansi | Setiap peserta tahu persis nominal yang harus dibayar |
| Portabilitas | Laporan bisa diekspor (Excel/PDF) & dibagikan via link |

### 1.2 Non-Goals (di luar cakup v1.0)

- Tidak ada integrasi payment gateway / transfer otomatis.
- Tidak ada tracking status "sudah bayar / belum".
- Tidak ada multi-currency (hanya IDR).
- Member **tidak** memiliki akun login — hanya Admin yang login.

---

## 2. Tech Stack

| Layer | Teknologi | Catatan |
|---|---|---|
| Frontend | **Next.js (App Router)** | PWA, mobile-first, installable |
| Styling | Tailwind CSS (rekomendasi) | Cepat untuk mobile UI |
| Backend / Database | **Google Cloud Firestore** | NoSQL, real-time |
| Auth | **Firebase Authentication** | Google Sign-In + Email/Password |
| OCR (Scan Struk) | **Tesseract.js** (client-side, gratis) | Jalan di browser, tanpa biaya server |
| File Export | SheetJS (xlsx) + jsPDF / pdfmake | Generate Excel & PDF di client |
| Hosting / Deploy | **Vercel** atau **Firebase Hosting** | Keduanya kompatibel dengan Next.js |
| PWA | next-pwa / Workbox | Service worker, offline shell, install prompt |

> **Catatan arsitektur:** Karena hanya Admin yang login dan semua data tersimpan di Firestore, app bisa berjalan sebagai PWA tanpa server backend terpisah. Logika hitungan dijalankan di sisi client (Next.js), data dipersist ke Firestore.

---

## 3. Aktor & Otorisasi

| Aktor | Deskripsi | Hak Akses |
|---|---|---|
| **Admin / Host** | User yang login (Google / Email). Membuat & mengelola sesi. | Penuh: buat sesi, tambah member, input tagihan, edit, export, share |
| **Member / Peserta** | Orang yang ikut dalam sesi. **Tidak login.** Diinput manual oleh Admin. | Tidak ada akses ke app. Hanya menerima laporan via share (link/PDF/Excel). |

**Aturan kunci:**
- Hanya **Admin** yang boleh menambah/mengedit item & tagihan dalam sebuah sesi.
- Member adalah entitas data manual: nama (wajib), email & no. HP (opsional, untuk distribusi laporan).

---

## 4. Konsep Inti & Hierarki Data

```
Admin (User, login)
  └── Session (1 Trip = 1 Sesi)
        ├── mode: "equal" | "item_based"   ← dipilih di awal, tidak bisa mix
        ├── Members[] (input manual: nama, email?, hp?, deposit?)
        ├── PaymentInfo (rekening/e-wallet admin)
        ├── Restaurants[]
        │     ├── tax config (include/exclude PPN, rate)
        │     ├── [equal mode] totalAmount
        │     └── [item mode] Items[] (nama, harga, assignedTo[])
        └── SharedCosts[] (driver, parkir, dll → dibagi rata)
```

### 4.1 Aturan Mode (PENTING)

- Mode dipilih **saat membuat sesi** dan **bersifat tetap** untuk sesi tersebut.
- **1 sesi = 1 mode.** Tidak ada pencampuran Equal & Item-Based dalam satu sesi.
- Mode menentukan tampilan form input restoran dan logika perhitungan.

---

## 5. Model Data Firestore

### 5.1 Collection: `users`
```
users/{userId}
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string | null,
  createdAt: timestamp
}
```

### 5.2 Collection: `sessions`
```
sessions/{sessionId}
{
  name: string,                  // "Trip Kediri 5 Hari"
  adminId: string,               // ref users/{uid}
  mode: "equal" | "item_based",
  currency: "IDR",
  defaultTaxRate: number,        // default 11
  status: "active" | "closed",
  shareToken: string,            // token unik untuk laporan publik read-only
  paymentInfo: {
    bankName: string | null,     // "BCA"
    accountNumber: string | null,// "5270273353"
    accountName: string | null,  // "Hengky Wiriawan"
    ewallet: string | null,      // "GoPay 08xx", opsional
    note: string | null
  },
  members: [
    {
      memberId: string,          // generated
      name: string,              // wajib
      email: string | null,      // opsional
      phone: string | null,      // opsional
      deposit: number            // default 0
    }
  ],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

> **Catatan desain:** `members` di-embed sebagai array di dokumen sesi (jumlah peserta umumnya < 20, sehinga aman dari batas dokumen Firestore 1 MB). Ini menyederhanakan kalkulasi karena seluruh member tersedia dalam satu read.

### 5.3 Subcollection: `restaurants`
```
sessions/{sessionId}/restaurants/{restaurantId}
{
  name: string,                  // "Sate Kambing Pak Kuwat"
  date: string,                  // ISO date, opsional
  order: number,                 // urutan tampil
  taxIncluded: boolean,          // true = harga sudah termasuk PPN
  taxRate: number,               // contoh 11 (% PPN), dipakai jika taxIncluded=false
  totalAmount: number | null,    // HANYA mode equal
  createdAt: timestamp
}
```

### 5.4 Subcollection: `items` (HANYA mode item_based)
```
sessions/{sessionId}/restaurants/{restaurantId}/items/{itemId}
{
  name: string,                  // "Nasi Bebek"
  price: number,                 // harga TOTAL item (bukan per orang)
  assignedTo: string[],          // [memberId] — 1 orang ATAU banyak
  createdAt: timestamp
}
```

### 5.5 Subcollection: `sharedCosts`
```
sessions/{sessionId}/sharedCosts/{costId}
{
  name: string,                  // "Driver", "Parkir", "Bensin"
  amount: number,                // total biaya
  createdAt: timestamp
}
```

---

## 6. Logika Perhitungan (Calculation Engine)

> Bagian ini adalah jantung aplikasi. Harus diimplementasikan persis untuk menghindari selisih.

### 6.1 Normalisasi PPN per Restoran

Untuk setiap restoran, hitung **`effectiveTotal`** (nilai final termasuk PPN):

```
if (taxIncluded == true):
    effectiveTotal = baseAmount          // harga sudah termasuk PPN
else:
    effectiveTotal = baseAmount * (1 + taxRate / 100)
```

- Mode **equal**: `baseAmount = restaurant.totalAmount`
- Mode **item_based**: `baseAmount = Σ(price semua item di restoran itu)` → PPN diterapkan ke subtotal restoran, lalu didistribusikan proporsional ke tiap member berdasarkan porsi konsumsi mereka di restoran tersebut.

### 6.2 Mode EQUAL SPLIT

```
N = jumlah member
for each restaurant r:
    effectiveTotal_r = applyTax(r.totalAmount, r)
    sharePerMember_r = effectiveTotal_r / N
    untuk setiap member: consumption[member] += sharePerMember_r
```

### 6.3 Mode ITEM-BASED SPLIT

```
for each restaurant r:
    subtotal_r = 0
    rawShare = {}   // porsi mentah (sebelum PPN) per member di restoran ini

    for each item i in r:
        k = jumlah member di i.assignedTo
        pricePerHead = i.price / k
        for each memberId in i.assignedTo:
            rawShare[memberId] += pricePerHead
        subtotal_r += i.price

    effectiveTotal_r = applyTax(subtotal_r, r)
    taxMultiplier = effectiveTotal_r / subtotal_r   // = 1 jika sudah include PPN

    for each member m in rawShare:
        consumption[m] += rawShare[m] * taxMultiplier
```

> **Catatan:** Pendekatan ini memastikan PPN dibebankan **proporsional** terhadap apa yang dipesan tiap orang — bukan dibagi rata. Orang yang pesan lebih banyak menanggung PPN lebih besar.

### 6.4 Shared Cost (berlaku untuk KEDUA mode)

```
N = jumlah member
for each sharedCost c:
    sharePerMember = c.amount / N
    untuk setiap member: sharedShare[member] += sharePerMember
```

> Shared cost **selalu dibagi rata** ke seluruh member, terlepas dari mode sesi.

### 6.5 Settlement Akhir (Deposit)

```
for each member m:
    totalTagihan[m] = consumption[m] + sharedShare[m]
    netDue[m]       = totalTagihan[m] - deposit[m]
```

Interpretasi `netDue`:
- **`netDue > 0`** → member **masih harus membayar** sebesar nilai itu.
- **`netDue < 0`** → member **kelebihan bayar / uang dikembalikan** sebesar |nilai|.
- **`netDue == 0`** → lunas pas.

> **Catatan terhadap file referensi Kediri:** Kolom "Saldo Akhir" pada file Excel asli memuat formula non-standar yang tidak konsisten dengan logika deposit lurus (kemungkinan formula custom/galat). SplitBro menstandarkan settlement menjadi rumus lurus di atas: **Total Tagihan − Deposit**. Ini lebih transparan dan dapat diaudit. (Mohon konfirmasi jika ada logika redistribusi khusus yang harus dipertahankan.)

### 6.6 Pembulatan

- Semua nominal disimpan sebagai number (IDR, tanpa desimal sen).
- **Pembulatan hanya dilakukan pada tampilan akhir** (display), bukan pada perhitungan antara, untuk menghindari akumulasi error.
- Tampilan akhir dibulatkan ke **rupiah terdekat (0 desimal)**.
- Tampilkan catatan kecil bila total pembulatan menyebabkan selisih ±beberapa rupiah dari grand total.

---

## 7. Functional Requirements

### FR-1 — Autentikasi Admin
- FR-1.1 Admin login via **Google Sign-In**.
- FR-1.2 Admin login via **Email + Password**.
- FR-1.3 Sesi yang dibuat terikat ke `adminId`; Admin hanya melihat sesinya sendiri.
- FR-1.4 Logout.

### FR-2 — Manajemen Sesi
- FR-2.1 Buat sesi baru: input **nama sesi** + pilih **mode** (Equal / Item-Based).
- FR-2.2 Mode terkunci setelah sesi dibuat.
- FR-2.3 Daftar sesi (list) milik Admin, dengan status active/closed.
- FR-2.4 Edit nama sesi; ubah status (close/reopen); hapus sesi (dengan konfirmasi).
- FR-2.5 Set `defaultTaxRate` untuk sesi (default 11), bisa dioverride per restoran.

### FR-3 — Manajemen Member
- FR-3.1 Tambah member: input **nama** (wajib).
- FR-3.2 Field opsional per member: **email**, **no. HP** (untuk distribusi laporan).
- FR-3.3 Field **deposit** per member (default 0).
- FR-3.4 Edit & hapus member (peringatkan jika member sudah punya tagihan).

### FR-4 — Info Pembayaran
- FR-4.1 Admin input info rekening/e-wallet (bank, no. rekening, atas nama, e-wallet, catatan).
- FR-4.2 Info ini tampil di laporan akhir & halaman share.

### FR-5 — Manajemen Restoran
- FR-5.1 Tambah restoran: nama, tanggal (opsional).
- FR-5.2 Setting PPN per restoran: toggle **"harga sudah termasuk PPN"** + field **tarif PPN** (default mengikuti sesi).
- FR-5.3 [Mode Equal] Input **total tagihan restoran**.
- FR-5.4 [Mode Item-Based] Masuk ke pengelolaan item (FR-6).
- FR-5.5 Edit & hapus restoran.

### FR-6 — Manajemen Item (Mode Item-Based)
- FR-6.1 Tambah item manual: **nama menu** + **harga**.
- FR-6.2 Assign item ke member: pilih **1 orang** ATAU **beberapa orang** (multi-select).
- FR-6.3 Jika multi-assign → harga item **otomatis dibagi rata** di antara orang yang dipilih.
- FR-6.4 Edit & hapus item.
- FR-6.5 **Scan Struk (OCR):**
  - Admin upload/foto struk → diproses oleh **Tesseract.js** di client.
  - Hasil OCR ditampilkan sebagai teks mentah / draft list item (nama + harga terdeteksi).
  - Admin **wajib merapikan/validasi manual** sebelum simpan (OCR tidak diasumsikan 100% akurat).
  - Setelah dirapikan, item masuk ke list normal dan bisa di-assign (FR-6.2).

### FR-7 — Shared Cost
- FR-7.1 Tambah shared cost: nama (mis. "Driver", "Parkir") + jumlah.
- FR-7.2 Otomatis dibagi rata ke seluruh member.
- FR-7.3 Edit & hapus.

### FR-8 — Ringkasan & Settlement
- FR-8.1 Halaman ringkasan: per member tampilkan **konsumsi**, **shared cost share**, **total tagihan**, **deposit**, **net (harus bayar / kembali)**.
- FR-8.2 Tampilkan grand total & total deposit.
- FR-8.3 Real-time recalculation saat data berubah.

### FR-9 — Export & Share
- FR-9.1 Export **Excel (.xlsx)** — rekap mirip layout sumber (per restoran + ringkasan per orang).
- FR-9.2 Export **PDF** — laporan rapi siap kirim, termasuk info pembayaran.
- FR-9.3 **Share link** read-only (via `shareToken`) — member buka di browser tanpa login, lihat tagihannya & info rekening.
- FR-9.4 (Opsional) Tombol bagikan via WhatsApp menggunakan no. HP member.

### FR-10 — Bilingual
- FR-10.1 UI mendukung **Bahasa Indonesia** & **English**.
- FR-10.2 Toggle bahasa, preferensi tersimpan (localStorage / profil).

### FR-11 — PWA
- FR-11.1 Installable (Add to Home Screen) di mobile.
- FR-11.2 Service worker untuk app shell & offline-read terbatas.
- FR-11.3 Manifest, ikon, splash sesuai standar PWA.

---

## 8. Alur Pengguna Utama (Key User Flows)

### 8.1 Flow Membuat Sesi & Hitung (Mode Item-Based)
1. Admin login.
2. Buat sesi → "Trip Kediri 5 Hari", pilih mode **Item-Based**.
3. Tambah member: Hengky, Andi, Nazhan, Joseph (+ deposit & email opsional).
4. Set info pembayaran (rekening BCA).
5. Tambah restoran → set PPN config.
6. Tambah item (manual / scan struk) → assign ke member (1 atau banyak).
7. Tambah shared cost (mis. Tips Driver).
8. Buka ringkasan → cek net per orang.
9. Export PDF/Excel atau share link.

### 8.2 Flow Mode Equal Split
Sama seperti 8.1, tapi pada langkah restoran Admin hanya input **total tagihan restoran**; sistem otomatis bagi rata ke semua member.

### 8.3 Flow Member Menerima Laporan
1. Member terima link share / PDF / pesan WhatsApp.
2. Buka link (tanpa login) → lihat rincian tagihannya + info rekening.

---

## 9. Validasi & Edge Cases

| Kasus | Penanganan |
|---|---|
| Sesi tanpa member | Blokir input tagihan; minta tambah member dulu |
| Item tanpa assignee (item mode) | Validasi: item harus di-assign ke ≥1 orang |
| Hapus member yang sudah punya item | Peringatan; item ter-reassign / dihapus dulu |
| Deposit kosong | Diperlakukan sebagai 0 (settlement tetap jalan) |
| OCR gagal/akurasi rendah | Tetap tampilkan teks mentah; fallback ke input manual |
| Pembulatan menimbulkan selisih | Tampilkan catatan; pertahankan presisi di kalkulasi internal |
| Tarif PPN diubah setelah input | Recalculate seluruh restoran terdampak secara real-time |

---

## 10. Non-Functional Requirements

| Aspek | Requirement |
|---|---|
| Performa | Ringkasan terhitung < 300ms untuk sesi normal (< 50 item) |
| Responsif | Mobile-first; nyaman dipakai satu tangan |
| Offline | App shell tersedia offline; sinkron saat online |
| Biaya | Stay di **free-tier** (Firestore Spark, Vercel Hobby, Tesseract client-side) |
| Keamanan | Firestore Security Rules: hanya `adminId` boleh tulis; share link read-only via token |
| Privasi | Data member (email/HP) tidak diekspos di luar laporan yang dibagikan Admin |

### 10.1 Firestore Security Rules (garis besar)
- `users/{uid}`: hanya pemilik uid.
- `sessions/{id}`: read/write hanya jika `request.auth.uid == resource.data.adminId`.
- Laporan publik diakses lewat mekanisme `shareToken` (mis. Cloud Function / route Next.js yang memvalidasi token, bukan akses Firestore langsung dari client publik).

---

## 11. Cakupan Rilis (Scope)

### Phase 1 (MVP — wajib)
Auth Admin, manajemen sesi (1 mode), member manual + deposit, restoran + PPN config, kedua mode split, item multi-assign, shared cost, ringkasan settlement, export Excel & PDF, share link, bilingual, PWA installable.

### Phase 2 (Future / Nice-to-have)
- OCR scan struk dengan auto-parsing lebih pintar.
- Tracking status pembayaran (mark as paid).
- Notifikasi WhatsApp otomatis.
- Multi-currency.
- Template restoran/menu yang sering dipakai.
- Login untuk member (opsional).

---

## 12. Pertanyaan Terbuka / Asumsi yang Perlu Dikonfirmasi

1. **Saldo Akhir (file Kediri):** SplitBro menggunakan rumus lurus *Total − Deposit*. Konfirmasi apakah ada logika redistribusi khusus dari Excel asli yang harus dipertahankan.
2. **Tarif PPN default:** ditetapkan 11% (tarif PPN Indonesia saat ini). Bisa diubah per restoran. Konfirmasi jika ada tarif lain yang umum dipakai.
3. **Share link publik:** apakah perlu masa kedaluwarsa/expiry token, atau permanen selama sesi belum dihapus?

---

*Dokumen ini siap dijadikan context untuk Claude Code / Cursor. Setiap FR dapat dipecah menjadi prompt fase implementasi terpisah (Phase 1A: Auth + Sesi, 1B: Member + Restoran, 1C: Calculation Engine, dst).*
