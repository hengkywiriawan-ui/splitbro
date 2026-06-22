# Rule: Calculation Engine

> IMPORTANT: Ini jantung SplitBro. Implementasikan PERSIS seperti di sini. Selisih hitung = bug kritis.
> Scope: berlaku saat menyentuh file kalkulasi/settlement (mis. `lib/calc/**`, `**/calculation*`, `**/settlement*`).

Semua nominal `number` (IDR, tanpa desimal sen). Pembulatan HANYA di display, tidak di perhitungan antara.

## 1. Normalisasi PPN per restoran

Setiap restoran punya `taxIncluded: boolean` dan `taxRate: number` (persen, mis. 11).

```ts
function applyTax(baseAmount: number, r: { taxIncluded: boolean; taxRate: number }): number {
  if (r.taxIncluded) return baseAmount;            // harga sudah termasuk PPN
  return baseAmount * (1 + r.taxRate / 100);       // tambahkan PPN
}
```

- Mode **equal**: `baseAmount = restaurant.totalAmount`
- Mode **item_based**: `baseAmount = Σ harga semua item di restoran itu` → PPN diterapkan ke subtotal, lalu didistribusikan PROPORSIONAL ke tiap member sesuai porsi konsumsinya.

## 2. Mode EQUAL SPLIT

```
N = jumlah member
consumption = {}  // per memberId, init 0
for each restaurant r:
    effectiveTotal = applyTax(r.totalAmount, r)
    sharePerMember = effectiveTotal / N
    for each member m: consumption[m] += sharePerMember
```

## 3. Mode ITEM-BASED SPLIT

Aturan item: `assignedTo: string[]` boleh berisi 1 orang ATAU banyak orang. Jika banyak → harga item dibagi rata di antara mereka.

```
consumption = {}  // per memberId, init 0
for each restaurant r:
    rawShare = {}   // porsi mentah (pre-PPN) per member di restoran ini
    subtotal = 0
    for each item i in r:
        k = i.assignedTo.length          // wajib >= 1 (validasi sebelum simpan)
        pricePerHead = i.price / k
        for each memberId in i.assignedTo:
            rawShare[memberId] = (rawShare[memberId] ?? 0) + pricePerHead
        subtotal += i.price
    if subtotal > 0:
        effectiveTotal = applyTax(subtotal, r)
        taxMultiplier = effectiveTotal / subtotal   // = 1 jika sudah include PPN
        for each memberId in rawShare:
            consumption[memberId] += rawShare[memberId] * taxMultiplier
```

> Catatan: PPN dibebankan proporsional terhadap konsumsi tiap orang, BUKAN dibagi rata. Yang pesan lebih banyak nanggung PPN lebih besar.

## 4. Shared Cost (berlaku untuk KEDUA mode)

```
N = jumlah member
sharedShare = {}  // per memberId, init 0
for each sharedCost c:
    perMember = c.amount / N
    for each member m: sharedShare[m] += perMember
```

Shared cost SELALU dibagi rata ke seluruh member, terlepas dari mode.

## 5. Settlement akhir (deposit)

```
for each member m:
    totalTagihan[m] = consumption[m] + sharedShare[m]
    netDue[m]       = totalTagihan[m] - m.deposit   // deposit default 0
```

Interpretasi `netDue`:
- `> 0` → member MASIH HARUS BAYAR sebesar nilai itu.
- `< 0` → member KELEBIHAN BAYAR / uang kembali sebesar |nilai|.
- `== 0` → lunas pas.

## 6. Pembulatan (display saja)

- Simpan & hitung tanpa pembulatan.
- Saat menampilkan/eksport, bulatkan ke rupiah terdekat (0 desimal) dengan `Math.round`.
- Tampilkan grand total dari nilai presisi penuh; jika ada selisih ±beberapa rupiah akibat pembulatan baris, tampilkan catatan kecil.

## 7. Kontrak fungsi yang diharapkan

Buat satu fungsi murni (pure function) yang menerima seluruh data sesi dan mengembalikan hasil settlement. Contoh signature:

```ts
type Breakdown = {
  memberId: string;
  name: string;
  consumption: number;
  sharedShare: number;
  totalTagihan: number;
  deposit: number;
  netDue: number;
};

function computeSettlement(session: Session, restaurants: Restaurant[],
  itemsByResto: Record<string, Item[]>, sharedCosts: SharedCost[]): {
    breakdown: Breakdown[];
    grandTotal: number;
    totalDeposit: number;
  }
```

Fungsi ini WAJIB pure (tanpa side effect) supaya gampang dites. Sertakan unit test untuk kedua mode + skenario shared cost + skenario deposit (kurang & lebih bayar).
