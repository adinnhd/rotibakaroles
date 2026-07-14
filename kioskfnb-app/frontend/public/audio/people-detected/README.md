# People Detected Audio

Letakkan audio pre-recorded untuk fitur text-to-speech jumlah orang di folder ini.

Folder ini disajikan langsung oleh Next.js dari path publik:

```text
/audio/people-detected
```

## Nama File

Batas rekomendasi saat ini adalah 5 orang, jadi cukup sediakan 5 file:

```text
people-detected-1.mp3
people-detected-2.mp3
people-detected-3.mp3
people-detected-4.mp3
people-detected-5.mp3
```

Contoh naskah rekaman:

```text
people-detected-1.mp3 -> Terdeteksi satu orang.
people-detected-2.mp3 -> Terdeteksi dua orang.
people-detected-3.mp3 -> Terdeteksi tiga orang.
people-detected-4.mp3 -> Terdeteksi empat orang.
people-detected-5.mp3 -> Terdeteksi lima orang.
```

Gunakan format `.mp3`, volume audio yang konsisten, dan beri jeda pendek di awal/akhir file agar terasa natural di kiosk.
