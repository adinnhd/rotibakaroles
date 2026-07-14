# PRD — TapOrder (Kiosk F&B Self-Ordering)

> Product Requirements Document. Disusun berdasarkan kondisi kode terkini (lihat `CLAUDE.md` di root repo) dan `docs/scope.md`.

## 1. Ringkasan Eksekutif

TapOrder adalah aplikasi kios self-ordering untuk bisnis F&B. Pelanggan memesan makanan/minuman secara mandiri lewat layar sentuh di kios, dengan dua cara input: menjelajah menu manual atau memesan lewat suara (voice ordering, Bahasa Indonesia). Sistem juga mendeteksi jumlah orang di depan kamera kios untuk merekomendasikan ukuran paket. Admin/staf mengelola menu, kategori, dan status order lewat dashboard terpisah.

## 2. Latar Belakang & Masalah

- Antrean kasir manual memperlambat proses order saat jam ramai.
- Staf harus menjelaskan ulang menu/paket ke tiap pelanggan, termasuk merekomendasikan ukuran paket sesuai jumlah orang dalam satu rombongan.
- Sebagian pelanggan lebih nyaman bicara langsung ("saya mau pesan paket hemat satu") dibanding mengetik/scroll menu di touchscreen.

## 3. Tujuan Produk

1. Memungkinkan pelanggan memesan sendiri tanpa antre ke kasir.
2. Mempercepat proses rekomendasi paket lewat deteksi jumlah orang otomatis (computer vision).
3. Menyediakan cara pesan alternatif lewat suara (speech-to-text) untuk mempercepat input pesanan.
4. Memberi staf/admin kontrol penuh atas data menu, kategori, dan status order secara real-time.

## 4. Aktor / Pengguna

| Aktor | Deskripsi |
| --- | --- |
| Pelanggan (Customer) | Menggunakan kios secara langsung: browsing menu, voice order, checkout, menerima struk |
| Admin / Staf Dapur | Login ke dashboard admin, mengelola kategori & menu (CRUD + upload gambar), memantau order masuk, mengubah status order |

## 5. Lingkup (Scope)

### 5.1 MVP — Sudah Berjalan

- Pelanggan dapat menjelajahi menu (kategori, daftar menu, detail menu, pencarian).
- Pelanggan dapat membuat order dan checkout (pilih metode pembayaran: QRIS, kartu kredit, virtual account — simulasi, belum payment gateway nyata).
- Pelanggan dapat memvalidasi isi keranjang sebelum checkout (cart sheet).
- Admin dapat login (Laravel Sanctum) dan mengakses dashboard.
- Admin dapat CRUD kategori & menu, termasuk upload gambar menu.
- Admin dapat melihat order masuk dan mengubah status order.
- Computer vision service menghitung jumlah orang dari frame kamera browser dan mengembalikan rekomendasi ukuran paket.
- Voice ordering: rekam suara di browser → transkripsi Whisper (Bahasa Indonesia) → cocokkan ke menu → otomatis masuk keranjang.
- Dokumentasi API otomatis (Scramble) untuk backend.

### 5.2 Fitur AI Lanjutan (Rencana / Sebagian Berjalan)

- Wake word ("hai olivia") untuk mengaktifkan mic tanpa tombol — masih tahap rencana (`ai/speech-to-text/docs/wake-word-plan.md`).
- Validasi & edit pesanan suara sebelum checkout (saat ini hasil voice langsung masuk cart, editing manual lewat cart sheet).

### 5.3 Belum Termasuk (Out of Scope MVP)

- Payment gateway produksi (saat ini simulasi checkout).
- Kitchen display system (KDS) khusus dapur.
- Integrasi printer struk fisik.
- Manajemen inventori/stok.
- Sistem loyalti/membership.
- Multi-branch / multi-tenant SaaS.

## 6. Alur Sistem (System Flow)

Alur ini menjelaskan bagaimana komponen teknis saling terhubung — lihat juga diagram arsitektur di `docs/architecture.md`.

```
[Browser Kiosk / Admin]
        |
        | (1) HTTP/HTTPS
        v
[Frontend Next.js — :3000]
   |        |             |
   |(2)     |(3)          |(4)
   v        v             v
[Backend    [CV Service   [STT Service
 Laravel     FastAPI       FastAPI
 :8000/api]  :8010]        :8020]
   |
   |(5)
   v
[PostgreSQL :5432]
```

Detail tiap koneksi:

1. **Browser → Frontend**: pelanggan/admin berinteraksi dengan UI Next.js (kios di `/`, admin di `/admin`).
2. **Frontend → Backend (Laravel API)**: mengambil data kategori/menu, membuat & mengambil order, login/logout admin, CRUD admin. Semua lewat REST JSON, base URL diatur lewat env `NEXT_PUBLIC_API_URL`.
3. **Frontend → CV Service**: frontend mengambil snapshot JPEG dari kamera browser (canvas), POST ke `/detect`, menerima `people_count` + bounding box, lalu menampilkan rekomendasi paket.
4. **Frontend → STT Service**: frontend merekam audio mic (webm/opus), POST ke `/transcribe`, menerima teks transkrip Bahasa Indonesia, lalu `voice-parser.ts` mencocokkan ke item menu dan quantity.
5. **Backend → PostgreSQL**: semua data persisten (users, menu_categories, menus, orders, order_items) disimpan di PostgreSQL lewat Eloquent ORM.

Catatan penting:
- Browser memegang akses kamera & mic langsung; service AI tidak membuka hardware sendiri.
- Backend tidak menjalankan inference AI — inference computer vision & speech-to-text berjalan di service Python terpisah, backend hanya menyimpan/mengonsumsi hasil bisnis (order, menu).
- Tiap service berjalan independen (lihat `docker-compose.yml`) dan bisa dikembangkan/dideploy terpisah.

## 7. Alur Proses Bisnis (Business Process Flow)

### 7.1 Perjalanan Pelanggan (Customer Journey) — Jalur Utama

1. Pelanggan mendekati kios; kamera browser aktif dan mengirim frame ke CV service secara berkala.
2. Sistem mendeteksi jumlah orang di depan kios (`people_count`) dan menampilkan sapaan dari maskot ("Olivia") beserta rekomendasi ukuran paket sesuai jumlah orang (`serving_min_people`/`serving_max_people` pada menu).
3. Pelanggan memilih salah satu jalur input pesanan:
   - **Jalur Manual**: tekan "Jelajahi Menu" → browse kategori → pilih item → atur quantity → tambah ke keranjang.
   - **Jalur Suara**: tekan tombol mic → ucapkan pesanan (mis. "saya mau pesan paket hemat satu, es teh dua") → audio dikirim ke STT service → teks dicocokkan ke menu lewat keyword matching → item otomatis masuk keranjang.
4. Pelanggan membuka cart sheet untuk memverifikasi/mengedit isi keranjang (ubah quantity, hapus item) — berlaku untuk hasil dari kedua jalur input.
5. Pelanggan melanjutkan ke halaman pembayaran, memilih metode pembayaran (QRIS / kartu kredit / virtual account) dan opsi tambahan (kirim struk lewat email, cetak struk).
6. Sistem mengirim request pembuatan order ke backend:
   - Backend memvalidasi ketersediaan tiap item dan status aktif kategorinya di dalam satu transaksi database.
   - Backend menghitung subtotal, pajak (11%), dan total, lalu membuat `order_number` unik (format `ORD-YYYYMMDD-XXXXXX`).
   - Order beserta order item disimpan ke database dengan status awal (mis. `paid`/`preparing` sesuai implementasi pembayaran simulasi).
7. Sistem menampilkan halaman struk (receipt) dengan nomor order, rincian item, dan total — sebagai konfirmasi ke pelanggan.
8. (Jika diaktifkan) struk dikirim ke email pelanggan dan/atau dicetak.

### 7.2 Alur Operasional Admin / Dapur

1. Admin login lewat halaman `/admin/login` (autentikasi Sanctum, session + token).
2. Admin mengelola data master:
   - CRUD kategori menu (nama, slug, icon, status aktif).
   - CRUD menu (nama, deskripsi, harga, gambar, ketersediaan, status rekomendasi, `serving_min_people`/`serving_max_people`).
3. Order baru dari pelanggan muncul di dashboard admin (daftar order).
4. Admin/dapur memperbarui status order seiring proses penyiapan: `preparing` → `ready` → `completed` (atau `cancelled` bila dibatalkan).
5. Status order yang diperbarui dapat dipantau ulang oleh pelanggan lewat nomor order (`GET /kiosk/orders/{orderNumber}`), atau dipantau staf di dashboard.

### 7.3 Aturan Bisnis Utama

- Item yang tidak `is_available` atau kategori yang tidak aktif tidak bisa di-order — divalidasi di backend sebelum order dibuat, bukan hanya di frontend.
- Pajak dihitung flat 11% dari subtotal.
- Data item pada order (`menu_name`, `unit_price`) disalin saat order dibuat (denormalisasi) sehingga histori order tidak berubah meskipun data menu diedit/dihapus setelahnya.
- Rekomendasi paket berbasis jumlah orang adalah saran tampilan (UI), bukan pembatas keras — pelanggan tetap bisa memilih menu apa pun.

## 8. Model Data Utama

| Entity | Field Kunci | Catatan |
| --- | --- | --- |
| `User` | id, name, email, password, role (admin/user) | Hanya role admin yang bisa akses `/admin/*` |
| `MenuCategory` | id, name, slug, icon, is_active | Kategori: Paket, Burger, Ayam, Sides, Minuman, Dessert |
| `Menu` | id, category_id, name, description, price, image, is_available, is_recommended, serving_min_people, serving_max_people | `serving_min/max_people` dipakai untuk rekomendasi paket |
| `Order` | id, order_number, status, payment_status, payment_method, subtotal, tax, total, customer_email, send_email_receipt, print_receipt | `order_number` format `ORD-YYYYMMDD-XXXXXX` |
| `OrderItem` | id, order_id, menu_id, menu_name, unit_price, quantity, line_total | `menu_name`/`unit_price` didenormalisasi dari `Menu` saat order dibuat |

## 9. Kebutuhan Non-Fungsional

- **Bahasa**: UI dan voice ordering berbahasa Indonesia.
- **Lingkungan dev seragam**: seluruh service dijalankan via Docker Compose agar tim tidak perlu install PHP/Node/Python/Postgres manual.
- **Latensi voice/CV**: belum ada SLA formal; STT memakai model Whisper `small` (~461MB, dependensi `ffmpeg`), CV memakai YOLOv8n (model ringan, nano).
- **Keamanan**: admin API memakai Sanctum (session + token) untuk MVP/internal — belum diaudit untuk produksi publik.
- **Observability**: tersedia endpoint `/health` di backend dan kedua AI service untuk pengecekan status dasar.

## 10. Asumsi & Batasan

- Pembayaran masih simulasi; integrasi payment gateway nyata belum termasuk MVP ini.
- Wake word dan validasi suara lanjutan masih tahap rencana, belum diimplementasikan di kode.
- Dokumentasi API teknis lengkap mengikuti Scramble (`http://localhost:8000/docs/api`), PRD ini berfokus pada gambaran produk & alur bisnis, bukan kontrak endpoint detail (lihat `docs/api.md`).

## 11. Lampiran

Prompt siap pakai untuk men-generate diagram visual (arsitektur, alur bisnis, sequence, ERD) dari dokumen ini ada di file terpisah: [`docs/prompt-diagram.md`](./prompt-diagram.md). Tempel prompt tersebut ke Claude (web) untuk menghasilkan diagram Mermaid/visual yang bisa langsung dirender.
