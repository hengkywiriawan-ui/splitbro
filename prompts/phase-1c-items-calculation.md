# Phase 1C — Item, Shared Cost & Calculation Engine

Prasyarat: Phase 1B selesai. Baca `docs/PRD_SplitBro.md` (FR-6, FR-7, bagian 6) dan WAJIB ikuti `.claude/rules/calculation-engine.md` PERSIS.

## Tujuan fase ini
Inti aplikasi: input item (mode item-based), shared cost, dan engine perhitungan yang akurat.

## Tugas
1. **Item per restoran — mode item_based (FR-6)**
   - Subcollection `items` di bawah restoran.
   - Tambah item manual: nama menu + harga (harga TOTAL item).
   - Assign item ke member: pilih 1 orang ATAU beberapa orang (multi-select). Validasi: `assignedTo` minimal 1.
   - Jika multi-assign → tampilkan info bahwa harga dibagi rata di antara yang dipilih (dibagi saat kalkulasi, simpan harga total apa adanya).
   - Edit & hapus item.
   - (Scan struk OCR ditunda ke fase 1E — sekarang fokus input manual.)

2. **Shared cost (FR-7)**
   - Subcollection `sharedCosts` per sesi.
   - Tambah: nama + jumlah. Edit & hapus.
   - Berlaku untuk kedua mode.

3. **Calculation Engine (bagian 6 PRD + rule)**
   - Implementasikan `computeSettlement(...)` sebagai PURE FUNCTION di `lib/calc/`.
   - Tangani: normalisasi PPN, mode equal, mode item_based (PPN proporsional), shared cost (bagi rata), settlement deposit.
   - JANGAN bulatkan di perhitungan internal; pembulatan hanya saat display.
   - Ikuti signature & aturan di `.claude/rules/calculation-engine.md`.

4. **Unit tests (WAJIB)**
   - Test mode equal (dengan & tanpa PPN include).
   - Test mode item_based termasuk item yang di-share beberapa orang + PPN proporsional.
   - Test shared cost dibagi rata.
   - Test settlement deposit: kasus kurang bayar (netDue > 0) & lebih bayar (netDue < 0).

## Acceptance criteria
- Item bisa ditambah & di-assign ke 1/banyak member; validasi assignee jalan.
- Shared cost dibagi rata ke semua member.
- `computeSettlement` menghasilkan angka yang benar untuk semua skenario test.
- Semua unit test hijau. Type check lolos.

## Validasi penting (PRD bagian 9)
- Sesi tanpa member: blokir input tagihan.
- Item tanpa assignee: tolak simpan.
- Ubah tarif PPN: recalculate restoran terdampak.

## Catatan
- Engine harus terpisah total dari UI agar mudah dites.
- Jelaskan singkat bagaimana PPN proporsional diterapkan agar saya bisa verifikasi.
