# Computer Vision Workspace

Workspace ini disiapkan untuk eksperimen fitur kamera secara paralel tanpa mengganggu backend Laravel dan frontend Next.js.

## Rekomendasi Stack

Gunakan Python untuk kode AI/computer vision.

Alasan:
- ekosistem CV paling matang: OpenCV, PyTorch, Ultralytics/YOLO, ONNX Runtime;
- mudah membuat service kecil untuk eksperimen;
- tidak memaksa Laravel memuat model AI secara langsung.

Laravel tetap menjadi API bisnis utama. Next.js tetap menjadi UI kiosk dan pemilik akses kamera browser.

## Arsitektur MVP Yang Disarankan

```text
Next.js Camera UI
    |
    | frame/image snapshot
    v
Python CV Service
    |
    | JSON result
    v
Next.js UI
    |
    | optional: save result / create order metadata
    v
Laravel API
```

Untuk eksperimen awal, Python service cukup mengembalikan JSON seperti:

```json
{
  "message": "Detection completed",
  "data": {
    "people_count": 3,
    "confidence": 0.91,
    "detections": [
      {
        "label": "person",
        "confidence": 0.94,
        "box": {
          "x": 120,
          "y": 80,
          "width": 180,
          "height": 360
        }
      }
    ]
  }
}
```

## Bahasa Yang Disarankan

Prioritas:

1. Python untuk computer vision service.
2. TypeScript di Next.js jika model ingin dijalankan langsung di browser.
3. PHP/Laravel hanya untuk menyimpan hasil, audit, atau menghubungkan hasil AI ke flow bisnis.

Jangan jalankan model berat langsung di Laravel untuk MVP. Laravel tidak ideal untuk inference CV realtime.

## Format Model Yang Cocok

Untuk Python service:
- `.pt` atau `.pth`: cocok untuk eksperimen PyTorch/YOLO.
- `.onnx`: bagus untuk runtime netral dan lebih mudah dipindah ke environment lain.
- `.engine`: TensorRT untuk NVIDIA GPU, biasanya nanti ketika performance sudah penting.

Untuk Next.js/browser:
- `.onnx`: bisa dipakai dengan ONNX Runtime Web.
- TensorFlow.js model: biasanya `model.json` + shard `.bin`.
- `.tflite`: bisa, tapi integrasi web lebih spesifik dan perlu runtime yang sesuai.

Rekomendasi praktis:
- Mulai dari `.pt` untuk riset cepat.
- Export ke `.onnx` ketika kontrak API dan model sudah mulai stabil.
- Simpan model weight di `ai/computer-vision/models/`, tapi jangan commit ke git.

## Folder

```text
ai/computer-vision/
  README.md
  app/
    README.md
  data/
    .gitkeep
  models/
    .gitkeep
```

## Kontrak Integrasi Dengan Frontend

Frontend dapat mengirim snapshot kamera sebagai multipart upload:

```http
POST /detect
Content-Type: multipart/form-data

image=<file>
```

Response service AI sebaiknya tetap mengikuti pola:

```json
{
  "message": "...",
  "data": {}
}
```

## Catatan Manual Untuk AI Engineer

- Buat virtual environment sendiri di folder ini.
- Jangan commit file model besar, dataset, cache, atau video sample.
- Tulis instruksi menjalankan service di `app/README.md` begitu stack final dipilih.
- Jika butuh GPU, dokumentasikan versi CUDA/cuDNN/driver yang dipakai.
