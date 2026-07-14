# Prompt Generate Diagram — TapOrder

> Kumpulan prompt siap pakai untuk ditempel ke Claude (web/claude.ai) agar menghasilkan diagram visual berdasarkan `docs/prd.md`. Setiap prompt didesain berdiri sendiri (tidak perlu attach file lain) dan minta output dalam format Mermaid supaya bisa langsung dirender/disalin ke tools lain (draw.io, Mermaid Live Editor, Notion, dll).

## 1. Diagram Arsitektur Sistem

```
Buatkan diagram arsitektur sistem dalam format Mermaid (gunakan "flowchart TB" atau "graph TB") untuk aplikasi kios self-ordering F&B bernama TapOrder, dengan komponen berikut:

- Browser (Kiosk Touchscreen) dan Browser (Admin) sebagai entry point pengguna
- Frontend Next.js (port 3000) — render UI kios & admin
- Backend Laravel API (port 8000) — menu, order, auth, admin CRUD
- Computer Vision Service FastAPI (port 8010) — endpoint /detect, deteksi jumlah orang dari frame kamera
- Speech-to-Text Service FastAPI (port 8020) — endpoint /transcribe, transkripsi suara Bahasa Indonesia pakai Whisper
- PostgreSQL (port 5432) — database utama, hanya diakses oleh Backend Laravel

Hubungan antar komponen:
- Browser Kiosk -> Frontend Next.js (HTTP)
- Browser Admin -> Frontend Next.js (HTTP)
- Frontend Next.js -> Backend Laravel API (REST JSON: kategori, menu, order, auth, admin)
- Frontend Next.js -> CV Service (POST frame JPEG ke /detect)
- Frontend Next.js -> STT Service (POST audio webm/opus ke /transcribe)
- Backend Laravel API -> PostgreSQL (Eloquent ORM)

Catatan tambahan yang perlu ditampilkan sebagai label/anotasi:
- Browser yang memegang akses kamera & mikrofon langsung, bukan service AI
- CV Service dan STT Service tidak terhubung ke database, sifatnya stateless per-request

Tampilkan label bahasa Indonesia pada setiap node dan beri warna/grup berbeda untuk: layer pengguna, layer frontend, layer backend bisnis, layer AI service, dan layer database. Output dalam satu code block Mermaid.
```

## 2. Diagram Alur Proses Bisnis (Customer Journey)

```
Buatkan flowchart proses bisnis (Mermaid "flowchart TD") untuk perjalanan pelanggan di kios self-ordering F&B bernama TapOrder, dari pelanggan datang sampai menerima struk, dengan langkah-langkah berikut:

1. Pelanggan mendekati kios
2. Kamera mendeteksi jumlah orang (decision: berhasil deteksi atau tidak)
3. Sistem menampilkan sapaan maskot + rekomendasi ukuran paket sesuai jumlah orang
4. Decision: pelanggan pilih jalur input pesanan -> "Manual" atau "Suara"
   - Jalur Manual: buka menu -> pilih kategori -> pilih item -> atur jumlah -> tambah ke keranjang
   - Jalur Suara: tekan tombol mic -> rekam suara -> kirim ke STT service -> dapat teks transkrip -> cocokkan ke menu -> item otomatis masuk keranjang
5. Kedua jalur bertemu di langkah: pelanggan buka keranjang untuk verifikasi/edit (ubah jumlah, hapus item)
6. Pelanggan lanjut ke halaman pembayaran, pilih metode (QRIS / kartu kredit / virtual account), pilih opsi kirim email struk dan/atau cetak struk
7. Sistem membuat order: validasi ketersediaan item & status kategori aktif (decision: valid atau tidak -> jika tidak valid, kembali ke keranjang dengan pesan error)
8. Jika valid: hitung subtotal, pajak 11%, total, buat nomor order unik, simpan order ke database
9. Tampilkan halaman struk dengan nomor order dan rincian pesanan
10. Order masuk ke dashboard admin/dapur sebagai order baru

Gunakan bentuk decision (belah ketupat) untuk titik percabangan (jalur manual/suara, validasi order). Semua label dalam Bahasa Indonesia. Output dalam satu code block Mermaid.
```

## 3. Diagram Sequence — Voice Ordering

```
Buatkan sequence diagram (Mermaid "sequenceDiagram") untuk alur voice ordering di kios self-ordering F&B bernama TapOrder, dengan partisipan:

- Pelanggan
- Frontend (Next.js)
- STT Service (FastAPI + Whisper)
- Voice Parser (lib/voice-parser.ts, jalan di frontend)
- Keranjang (state cart di frontend)

Urutan interaksi:
1. Pelanggan menekan tombol mic di frontend
2. Frontend merekam audio dari mikrofon browser (format webm/opus)
3. Pelanggan berhenti bicara / tekan tombol stop
4. Frontend mengirim audio (POST multipart) ke STT Service endpoint /transcribe
5. STT Service menjalankan transkripsi Whisper bahasa Indonesia
6. STT Service mengembalikan teks transkrip + confidence score ke Frontend
7. Frontend meneruskan teks transkrip ke Voice Parser
8. Voice Parser mencocokkan teks ke daftar menu via keyword matching (termasuk quantity, misal "dua", "satu")
9. Voice Parser mengembalikan daftar item yang cocok beserta jumlahnya
10. Frontend menambahkan item ke Keranjang
11. Frontend menampilkan konfirmasi visual ke Pelanggan (item masuk keranjang)

Tambahkan note di sequence diagram bahwa proses ini berjalan tanpa melibatkan Backend Laravel sama sekali (voice parsing terjadi di sisi frontend, bukan backend). Semua label dalam Bahasa Indonesia. Output dalam satu code block Mermaid.
```

## 4. Diagram Sequence — Checkout & Pembuatan Order

```
Buatkan sequence diagram (Mermaid "sequenceDiagram") untuk alur checkout di kios self-ordering F&B bernama TapOrder, dengan partisipan:

- Pelanggan
- Frontend (Next.js)
- Backend (Laravel API)
- Database (PostgreSQL)

Urutan interaksi:
1. Pelanggan menekan tombol checkout dari halaman keranjang
2. Pelanggan memilih metode pembayaran (QRIS / kartu kredit / virtual account) dan opsi email/print struk
3. Frontend mengirim POST /kiosk/orders ke Backend berisi daftar item, payment_method, dan opsi struk
4. Backend membuka database transaction
5. Backend memvalidasi: tiap menu_id tersedia (is_available) dan kategori menu aktif (is_active)
6. Alt: jika validasi gagal -> Backend rollback transaction -> kembalikan response error ke Frontend -> Frontend tampilkan pesan error ke Pelanggan
7. Alt: jika validasi berhasil -> Backend hitung subtotal, pajak 11%, total -> generate order_number unik -> simpan Order dan OrderItem ke Database -> commit transaction -> kembalikan response sukses berisi data order lengkap ke Frontend
8. Frontend menampilkan halaman struk (receipt) dengan order_number dan rincian ke Pelanggan

Gunakan blok "alt/else" pada sequence diagram untuk skenario validasi gagal vs berhasil. Semua label dalam Bahasa Indonesia. Output dalam satu code block Mermaid.
```

## 5. Diagram Sequence — Deteksi Orang & Rekomendasi Paket

```
Buatkan sequence diagram (Mermaid "sequenceDiagram") untuk alur deteksi jumlah orang di kios self-ordering F&B bernama TapOrder, dengan partisipan:

- Kamera Browser
- Frontend (Next.js)
- CV Service (FastAPI + YOLOv8n)
- UI Rekomendasi Paket

Urutan interaksi:
1. Frontend mengaktifkan akses kamera browser
2. Frontend mengambil snapshot frame dari video stream secara periodik (canvas to JPEG)
3. Frontend mengirim POST multipart JPEG ke CV Service endpoint /detect
4. CV Service menjalankan inference YOLOv8n pada frame tersebut
5. CV Service mengembalikan people_count, confidence, dan daftar bounding box deteksi ke Frontend
6. Frontend meneruskan people_count ke UI Rekomendasi Paket
7. UI Rekomendasi Paket menampilkan sapaan maskot dan menyaring/menyorot menu paket yang sesuai (berdasarkan serving_min_people dan serving_max_people)

Tambahkan note bahwa proses ini berulang secara periodik selama pelanggan berada di depan kios (bukan sekali saja), dan bahwa CV Service tidak menyimpan frame/gambar (stateless, tidak ada penyimpanan ke database). Semua label dalam Bahasa Indonesia. Output dalam satu code block Mermaid.
```

## 6. Diagram ERD — Struktur Database

```
Buatkan Entity Relationship Diagram (Mermaid "erDiagram") untuk database aplikasi kios self-ordering F&B bernama TapOrder, dengan entity dan field berikut:

USER {
  int id
  string name
  string email
  string password
  string role "admin atau user"
}

MENU_CATEGORY {
  int id
  string name
  string slug
  string icon
  boolean is_active
}

MENU {
  int id
  int category_id
  string name
  string description
  decimal price
  string image
  boolean is_available
  boolean is_recommended
  int serving_min_people
  int serving_max_people
}

ORDER {
  int id
  string order_number "format ORD-YYYYMMDD-XXXXXX"
  string status "preparing, ready, completed, cancelled"
  string payment_status
  string payment_method "qris, credit_card, virtual_account"
  decimal subtotal
  decimal tax
  decimal total
  string customer_email
  boolean send_email_receipt
  boolean print_receipt
}

ORDER_ITEM {
  int id
  int order_id
  int menu_id
  string menu_name "disalin dari Menu saat order dibuat"
  decimal unit_price "disalin dari Menu saat order dibuat"
  int quantity
  decimal line_total
}

Relasi:
- MENU_CATEGORY memiliki banyak MENU (one-to-many)
- ORDER memiliki banyak ORDER_ITEM (one-to-many)
- MENU dapat dirujuk oleh banyak ORDER_ITEM (one-to-many), tapi data menu_name/unit_price di ORDER_ITEM sudah didenormalisasi (snapshot), jadi tidak strict foreign key dependency untuk histori

Tambahkan anotasi/komentar di luar diagram bahwa USER tidak punya relasi langsung ke ORDER (kiosk order dibuat tanpa autentikasi pelanggan). Semua label dalam Bahasa Indonesia. Output dalam satu code block Mermaid.
```

## 7. Diagram Alur Operasional Admin / Dapur

```
Buatkan flowchart (Mermaid "flowchart TD") untuk alur kerja admin/staf dapur di sistem kios self-ordering F&B bernama TapOrder:

1. Admin membuka halaman /admin/login
2. Admin login dengan email & password (autentikasi Sanctum)
3. Decision: login berhasil atau gagal -> jika gagal, tampilkan pesan error dan kembali ke form login
4. Jika berhasil, admin masuk ke dashboard
5. Dari dashboard, admin dapat memilih salah satu dari 3 cabang:
   a. Kelola Kategori Menu: lihat daftar -> tambah/edit/hapus kategori
   b. Kelola Menu: lihat daftar -> tambah/edit/hapus menu (termasuk upload gambar) -> atur ketersediaan dan status rekomendasi
   c. Kelola Order: lihat daftar order masuk -> pilih order -> ubah status order (preparing -> ready -> completed, atau cancelled)
6. Setiap perubahan data (kategori/menu/order) langsung tersimpan ke database dan tercermin di sisi kiosk pelanggan secara realtime saat pelanggan reload/fetch data

Semua label dalam Bahasa Indonesia. Output dalam satu code block Mermaid.
```

## Cara Pakai

1. Buka [claude.ai](https://claude.ai).
2. Salin salah satu blok prompt di atas (dalam ``` ```), tempel sebagai pesan baru.
3. Claude akan mengembalikan kode Mermaid di dalam code block.
4. Render hasilnya lewat [Mermaid Live Editor](https://mermaid.live), ekstensi Markdown preview di VS Code, atau langsung tempel ke editor yang mendukung Mermaid (Notion, GitHub markdown, dll).
5. Jika hasil diagram kurang sesuai, minta Claude merevisi bagian tertentu saja (misal "perbaiki bagian decision validasi order, jangan ubah bagian lain") agar tidak perlu generate ulang dari nol.
