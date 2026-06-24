# Rule: Firestore Schema

> Scope: berlaku saat menyentuh akses data Firestore (mis. `lib/firebase/**`, `lib/db/**`, model/type definitions).
> Jangan ubah bentuk dokumen tanpa update file ini DAN `docs/PRD_SplitBro.md`.

## Collection: `users`
```
users/{userId}
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string | null,
  approved: boolean,                  // admin harus set true sebelum akun bisa login
  createdAt: Timestamp
}
```

## Collection: `sessions`
```
sessions/{sessionId}
{
  name: string,                       // "Trip Kediri 5 Hari"
  adminId: string,                    // ref users/{uid}
  mode: "equal" | "item_based",       // TERKUNCI setelah dibuat
  currency: "IDR",
  defaultTaxRate: number,             // default 11
  status: "active" | "closed",
  shareToken: string,                 // token unik untuk laporan publik read-only
  shareExpiresAt: number,             // epoch ms; laporan publik diblokir setelah ini (10 hari sejak link di-share)
  paymentInfo: {
    bankName: string | null,
    accountNumber: string | null,
    accountName: string | null,
    ewallet: string | null,
    note: string | null
  },
  members: [                          // di-embed (umumnya < 20 orang)
    {
      memberId: string,
      name: string,                   // wajib
      email: string | null,           // opsional (distribusi laporan)
      phone: string | null,           // opsional (distribusi laporan)
      deposit: number,                // default 0
      isDriver: boolean               // driver makan gratis; konsumsinya dibagi rata ke peserta non-driver
    }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Subcollection: `restaurants`
```
sessions/{sessionId}/restaurants/{restaurantId}
{
  name: string,
  date: string | null,                // ISO date, opsional
  order: number,                      // urutan tampil
  taxIncluded: boolean,               // true = harga sudah termasuk PPN
  taxRate: number,                    // % PPN, dipakai jika taxIncluded=false
  totalAmount: number | null,         // HANYA mode equal
  participantIds: string[],           // HANYA mode equal: member yang ikut; kosong = semua
  createdAt: Timestamp
}
```

## Subcollection: `items` (HANYA mode item_based)
```
sessions/{sessionId}/restaurants/{restaurantId}/items/{itemId}
{
  name: string,
  price: number,                      // harga TOTAL item (bukan per orang)
  assignedTo: string[],               // [memberId], minimal 1 (validasi)
  createdAt: Timestamp
}
```

## Subcollection: `sharedCosts`
```
sessions/{sessionId}/sharedCosts/{costId}
{
  name: string,                       // "Driver", "Parkir", "Bensin"
  amount: number,
  createdAt: Timestamp
}
```

## Security Rules (garis besar)
- `users/{uid}`: read/write hanya jika `request.auth.uid == uid`.
- `sessions/{id}` + semua subcollection: read/write hanya jika `request.auth.uid == resource.data.adminId` (untuk subcollection, cek parent).
- Akses publik laporan TIDAK lewat Firestore client langsung. Gunakan route Next.js (server) yang memvalidasi `shareToken` lalu mengembalikan data read-only. Jangan ekspos koleksi ke `read: true` untuk publik.

## Catatan implementasi
- Pakai TypeScript types/interfaces yang mirror skema ini di satu tempat (mis. `lib/types.ts`).
- `members` di-embed array → update member = update dokumen sesi. Hati-hati race condition; gunakan transaction bila perlu.
- Jangan menaruh data sensitif member (email/HP) di URL/query string.
