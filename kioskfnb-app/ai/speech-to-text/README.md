# Olivia Speech-to-Text Service

FastAPI service untuk fitur voice ordering pada kiosk Olivia. Pelanggan bisa memesan menu menggunakan suara.

## Model

- OpenAI Whisper `small` (~461MB)
- Bahasa: Indonesia (`id`)
- Berjalan di CPU (FP32)
- Model diunduh otomatis saat pertama kali service dijalankan

## Alur

```text
Browser rekam audio (webm/opus)
  -> POST /transcribe
  -> audio normalization (numpy)
  -> Whisper transkripsi
  -> return teks
  -> frontend cocokkan dengan keyword menu
  -> item masuk keranjang
```

## Struktur

```text
ai/speech-to-text/
  README.md
  .gitignore
  app/
    Dockerfile
    main.py
    requirements.txt
    config.example.env
  experiments/
  samples/
  docs/
```

## Menjalankan Tanpa Docker

Pastikan `ffmpeg` sudah terinstall:

```bash
winget install Gyan.FFmpeg
```

Install dependency dan jalankan service:

```bash
cd ai/speech-to-text
pip install -r app/requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8020 --reload
```

Health check:

```http
GET http://127.0.0.1:8020/health
```

Transcribe audio:

```http
POST http://127.0.0.1:8020/transcribe
Content-Type: multipart/form-data

audio=<file.webm>
```

## Menjalankan Dengan Docker

```bash
docker compose up stt-service
```

ffmpeg sudah terinstall otomatis di dalam container. Model Whisper di-cache di Docker volume `stt_cache`.

## Environment Variables

Salin `app/config.example.env` ke `.env` jika ingin override:

| Variable | Default | Keterangan |
|---|---|---|
| `WHISPER_MODEL` | `small` | Ukuran model Whisper |
| `STT_LANGUAGE` | `id` | Bahasa transkripsi |
| `STT_ENGINE` | `whisper` | Engine STT |
| `WAKE_WORD` | `hai olivia` | Wake word (belum aktif) |

## Catatan

- Pertama kali dijalankan akan mengunduh model ~461MB — normal, cukup sekali.
- Akurasi tidak sempurna untuk nama menu yang tidak umum — ini limitasi model `small` di CPU.
- Fitur wake word ("hai Olivia") belum diimplementasikan.
