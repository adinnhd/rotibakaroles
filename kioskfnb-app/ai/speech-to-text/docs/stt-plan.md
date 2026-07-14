# STT Button Microphone Plan

Tahap pertama fitur suara Olivia adalah STT berbasis tombol mikrofon.

## Tujuan

User menekan tombol mikrofon, mengucapkan pesanan, lalu sistem menampilkan teks hasil transkripsi.

Contoh:

```text
User: "Saya mau pesan paket hemat satu dan es teh dua"
STT:  "saya mau pesan paket hemat satu dan es teh dua"
```

## Alur MVP

```text
Frontend
  - user klik tombol mikrofon
  - browser mulai rekam audio
  - user klik selesai atau timeout otomatis
  - frontend kirim audio ke STT service

STT service
  - terima multipart/form-data field audio
  - jalankan transkripsi
  - return JSON

Frontend
  - tampilkan teks
  - nanti teks diproses menjadi intent/order draft
```

## Endpoint Prototype

```http
POST /transcribe
Content-Type: multipart/form-data

audio=<file>
```

Response:

```json
{
  "message": "Transcription completed",
  "data": {
    "engine": "mock",
    "language": "id",
    "text": "saya mau pesan paket hemat satu",
    "confidence": 0.99
  }
}
```

## Kandidat Engine

- Mock engine untuk kontrak awal.
- Browser Web Speech API untuk eksperimen cepat.
- Whisper untuk akurasi lokal.
- Cloud STT untuk pembanding akurasi dan latency.

## Hal Yang Perlu Diukur

- Akurasi bahasa Indonesia.
- Akurasi di tempat ramai.
- Latency dari selesai bicara sampai teks muncul.
- Ukuran file audio per request.
- Format audio browser yang paling praktis: `webm`, `wav`, atau `m4a`.

## Batasan Tahap Ini

- Belum membuat order otomatis.
- Belum wake word.
- Belum integrasi ke Laravel.
- Belum menyimpan audio.
