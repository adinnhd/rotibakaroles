# Olivia - Kiosk F&B Self Ordering

Olivia adalah aplikasi self-ordering kiosk untuk F&B.

Monorepo ini berisi:

- `backend/` - Laravel API
- `frontend/` - Next.js kiosk dan admin dashboard
- `ai/computer-vision/` - FastAPI computer vision service
- `ai/speech-to-text/` - FastAPI speech-to-text service (Whisper)
- `postman/` dan `docs/postman/` - request manual/debug API

## Fitur Saat Ini

- Kiosk menu browsing
- Admin dashboard untuk kategori dan menu
- Admin authentication dengan Laravel Sanctum
- Upload gambar menu
- Checkout order kiosk
- PostgreSQL database
- Computer vision service untuk menerima frame kamera web dari browser
- Voice ordering dengan Speech-to-Text (Whisper) — pelanggan bisa pesan menu via suara
- Scramble API documentation untuk backend

Belum termasuk payment gateway production, kitchen display, dan deployment production.

## Arsitektur Lokal

```text
Browser / Next.js
  - akses kamera web
  - halaman kiosk
  - halaman admin
  - kirim frame ke CV service
  - rekam suara dan kirim ke STT service

Laravel Backend
  - menu API
  - admin API
  - order API
  - auth API
  - Scramble API docs
  - upload gambar
  - database access

FastAPI CV Service (port 8010)
  - receive image bytes
  - YOLO people detection
  - return people_count

FastAPI STT Service (port 8020)
  - receive audio webm
  - audio normalization
  - Whisper small transcription (bahasa Indonesia)
  - return teks transkripsi

PostgreSQL
  - categories
  - menus
```

## Menjalankan Dengan Docker

Dengan Docker, teman satu tim tidak perlu install PHP, Composer, Node, Python, atau PostgreSQL secara manual.

Yang perlu di-install manual:

- Docker Desktop
- Git

Terdapat dua cara untuk menjalankan aplikasi dengan Docker, yaitu dengan CPU (standar) atau dengan GPU (untuk mempercepat AI service).

### 1. Menjalankan Tanpa GPU (CPU Default)

Gunakan perintah ini jika sistem Anda tidak memiliki GPU NVIDIA atau Anda belum mengkonfigurasi NVIDIA Container Toolkit.

```bash
docker compose up --build
```

### 2. Menjalankan Dengan GPU (NVIDIA)

Jika sistem Anda memiliki GPU NVIDIA dan telah menginstal [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html), Anda dapat mempercepat proses Computer Vision dan Speech-to-Text dengan menggunakan file konfigurasi GPU.

```bash
docker compose -f docker-compose.gpu.yml up --build
```

Service yang berjalan:

| Service | URL |
| --- | --- |
| Frontend kiosk | `http://localhost:3000` |
| Admin dashboard | `http://localhost:3000/admin` |
| Backend API | `http://localhost:8000/api/health` |
| API documentation | `http://localhost:8000/docs/api` |
| OpenAPI JSON | `http://localhost:8000/docs/api.json` |
| AI CV service | `http://localhost:8010/health` |
| AI STT service | `http://localhost:8020/health` |
| PostgreSQL | `localhost:5432` |

Backend container otomatis menjalankan:

```bash
composer install
php artisan migrate --force
php artisan db:seed --force
php artisan serve --host=0.0.0.0 --port=8000
```

Jika ingin menjalankan migration/seed manual:

```bash
docker compose exec backend php artisan migrate --seed
```

Reset database Docker:

```bash
docker compose down -v
docker compose up --build
```

Perintah `down -v` menghapus volume database, jadi data lokal Docker akan hilang.

## Database Docker

PostgreSQL ikut berjalan sebagai container. Orang lain tidak perlu install PostgreSQL lokal.

Konfigurasi Docker:

```text
DB_HOST=postgres
DB_DATABASE=kioskfnb
DB_USERNAME=kioskfnb
DB_PASSWORD=secret
```

Data PostgreSQL disimpan di Docker volume `postgres_data`, sehingga tidak hilang saat container restart biasa.

## Upload Gambar

Upload gambar menu disimpan di:

```text
backend/public/uploads/menu-images/
```

Folder upload di-mount ke container backend, sehingga file tetap ada selama file di workspace tidak dihapus.

Gambar upload akan memiliki URL seperti:

```text
http://localhost:8000/uploads/menu-images/example.jpg
```

## Computer Vision Service

CV service berjalan di:

```text
http://localhost:8010
```

Endpoint:

```http
GET /health
POST /detect
```

Frontend menggunakan:

```env
NEXT_PUBLIC_CV_API_URL=http://localhost:8010
```

Browser tetap menjadi pemilik akses kamera. Container AI tidak membuka webcam langsung.

Alur kamera:

```text
Browser camera
  -> canvas snapshot JPEG
  -> POST http://localhost:8010/detect
  -> response people_count
  -> frontend menampilkan pesan/rekomendasi
```

Model default:

```text
ai/computer-vision/models/yolov8n.pt
```

Jika file model belum ada, Ultralytics akan mencoba menggunakan `yolov8n.pt` dan mengunduh/cache model saat pertama kali dipakai.

## Speech-to-Text Service

STT service berjalan di:

```text
http://localhost:8020
```

Endpoint:

```http
GET /health
POST /transcribe
```

Frontend menggunakan:

```env
NEXT_PUBLIC_STT_API_URL=http://localhost:8020
```

Alur voice ordering:

```text
User tekan tombol mic di kiosk
  -> browser rekam audio (webm/opus)
  -> POST http://localhost:8020/transcribe
  -> Whisper transkripsi ke teks bahasa Indonesia
  -> frontend cocokkan teks dengan keyword menu
  -> item otomatis masuk keranjang
```

Model: OpenAI Whisper `small` (~461MB). Model diunduh otomatis saat pertama kali service dijalankan dan di-cache di volume `stt_cache`.

**Catatan penting:** STT service membutuhkan `ffmpeg` untuk decode audio. Saat menggunakan Docker, ffmpeg sudah terinstall otomatis di dalam container.

## Menjalankan Tanpa Docker

Backend:

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

AI CV service:

```bash
cd ai/computer-vision
python -m venv .venv
.venv\Scripts\activate
pip install -r app/requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload
```

AI STT service:

```bash
cd ai/speech-to-text
pip install -r app/requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8020 --reload
```

STT service membutuhkan `ffmpeg`. Install via:

```bash
winget install Gyan.FFmpeg
```

Untuk mode non-Docker, frontend memakai:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_CV_API_URL=http://127.0.0.1:8010
NEXT_PUBLIC_STT_API_URL=http://127.0.0.1:8020
```

## Endpoint Utama

Dokumentasi API utama dibuat otomatis oleh Scramble:

```text
http://localhost:8000/docs/api
http://localhost:8000/docs/api.json
```

Kiosk:

```http
GET /api/health
GET /api/kiosk/categories
GET /api/kiosk/menus
GET /api/kiosk/menus?category=paket
GET /api/kiosk/menus?category_id=1
GET /api/kiosk/menus?search=cola
GET /api/kiosk/menus/{id}
POST /api/kiosk/orders
GET /api/kiosk/orders/{orderNumber}
```

Auth:

```http
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
```

Admin:

```http
GET /api/admin/categories
POST /api/admin/categories
PUT /api/admin/categories/{id}
DELETE /api/admin/categories/{id}

GET /api/admin/menus
POST /api/admin/menus
PUT /api/admin/menus/{id}
POST /api/admin/menus/{id}
DELETE /api/admin/menus/{id}

GET /api/admin/orders
GET /api/admin/orders/{id}
PUT /api/admin/orders/{id}/status
```

`POST /api/admin/menus/{id}` dipakai untuk update multipart/form-data dengan upload gambar.

## Postman

Scramble adalah sumber utama dokumentasi API. Postman tetap dipertahankan secukupnya sebagai toolbox untuk request manual, smoke test, upload gambar, auth cookie, dan debugging header.

Postman Local View membaca folder:

```text
postman/
```

Environment lokal:

```text
base_url = http://127.0.0.1:8000/api
```

Collection export JSON juga tersedia di:

```text
docs/postman/
```

## Testing

Backend:

```bash
cd backend
php artisan test
```

Docker:

```bash
docker compose exec backend php artisan test
```

Frontend build:

```bash
cd frontend
npm run build
```

## Catatan Penting

- Admin API memakai Sanctum untuk local/internal MVP, tetapi belum diaudit untuk production.
- Payment saat ini masih simulasi checkout. Belum memakai payment gateway production.
- Kitchen flow belum selesai.
- Docker setup ini ditujukan untuk local development agar semua anggota tim bisa menjalankan aplikasi dengan environment yang sama.
