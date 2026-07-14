# Architecture

```text
Next.js Frontend
    |
    | REST API
    v
Laravel Backend
    |
    v
PostgreSQL Local

Future AI:
Camera / Microphone
    |
    v
Next.js Camera UI or Python AI Service
    |
    v
Laravel API
```

## AI Integration Boundary

Untuk MVP, Laravel tidak memuat model computer vision secara langsung.

Rekomendasi boundary:

```text
Next.js
  - akses kamera browser
  - ambil frame/snapshot
  - tampilkan hasil people count

Python CV Service
  - load model
  - inference image/frame
  - return JSON result

Laravel
  - API bisnis
  - simpan hasil AI bila nanti dibutuhkan
  - tidak menjalankan inference realtime
```
