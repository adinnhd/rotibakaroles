# CV Service App

Tempat AI engineer menulis service computer vision.

Service saat ini memakai FastAPI + Ultralytics YOLO.

Container AI tidak membuka webcam langsung. Kamera diakses dari browser frontend, lalu frontend mengirim snapshot JPEG ke endpoint `/detect`.

## Setup

Jalankan dari folder `ai/computer-vision` supaya import `app.main` konsisten:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r app/requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

Model disimpan di:

```text
ai/computer-vision/models/yolov8n.pt
```

Frontend membaca URL service dari:

```env
NEXT_PUBLIC_CV_API_URL=http://127.0.0.1:8001
```

Jika env tidak diset, frontend memakai default `http://127.0.0.1:8001`.

## Docker

Dari root project:

```bash
docker compose up --build ai-service
```

URL Docker:

```text
http://localhost:8010
```

## Endpoint

```http
GET /health
POST /detect
```

`POST /detect` menerima body gambar JPEG dari snapshot kamera browser.

Response:

```json
{
  "message": "Detection completed",
  "data": {
    "people_count": 0,
    "confidence": 0,
    "detections": []
  }
}
```
