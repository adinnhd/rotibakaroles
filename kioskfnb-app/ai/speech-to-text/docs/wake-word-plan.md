# Wake Word Plan

Tahap kedua fitur suara Olivia adalah wake word seperti "hai Olivia" atau "oke Olivia".

## Tujuan

User bisa memulai voice order tanpa menekan tombol, cukup dengan kata pemicu.

Contoh:

```text
User: "Hai Olivia"
System: mulai mendengarkan pesanan
User: "Saya mau pesan burger satu"
System: transcribe dan tampilkan draft pesanan
```

## Rekomendasi Arsitektur

Untuk kiosk browser, wake word sebaiknya dieksplorasi di frontend terlebih dahulu.

```text
Browser
  - akses mikrofon
  - deteksi wake word ringan atau kirim potongan audio
  - setelah wake word terdeteksi, rekam command

STT Service
  - transcribe command audio
  - return text
```

## Opsi Pendekatan

1. Browser-first
   - Lebih cepat untuk prototype.
   - Tidak perlu container akses mikrofon.
   - Cocok untuk kiosk web.

2. Service-side wake detection
   - Browser streaming audio chunk ke service.
   - Service mendeteksi wake word.
   - Lebih kompleks untuk latency dan network.

3. Hybrid
   - Frontend mendeteksi aktivitas suara.
   - Service memvalidasi wake word.

## Kandidat Library

- Web Speech API untuk prototype awal.
- Porcupine/Picovoice untuk wake word khusus.
- Whisper kecil untuk validasi teks wake phrase.
- Vosk untuk offline STT ringan.

## Risiko

- False positive di tempat ramai.
- Latency tinggi jika semua audio dikirim ke server.
- Permission mikrofon browser.
- Wake word bahasa Indonesia perlu banyak testing.

## Batasan Tahap Ini

- Jangan integrasikan ke flow order utama dulu.
- Jangan menyimpan audio pelanggan tanpa keputusan privasi yang jelas.
- Jangan jalankan model besar sebelum baseline latency diketahui.
