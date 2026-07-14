# STT App

Folder ini berisi prototype FastAPI untuk Speech-to-Text Olivia.

Endpoint awal:

```http
GET /health
POST /transcribe
```

`POST /transcribe` menerima file audio multipart/form-data dengan field `audio`.

Untuk saat ini response masih mock agar frontend/API contract bisa diuji lebih dulu sebelum memilih engine STT.

## Run

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8020 --reload
```

## Response Mock

```json
{
  "message": "Transcription completed",
  "data": {
    "engine": "mock",
    "language": "id",
    "text": "saya mau pesan paket hemat satu",
    "confidence": 0.99,
    "filename": "sample.wav"
  }
}
```
