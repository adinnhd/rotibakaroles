# API Documentation

Dokumentasi API utama sekarang dibuat otomatis oleh Scramble dari route, controller, validasi, dan response Laravel.

Local docs:

```text
http://localhost:8000/docs/api
```

OpenAPI JSON:

```text
http://localhost:8000/docs/api.json
```

## Source of Truth

Gunakan Scramble sebagai sumber utama dokumentasi endpoint backend.

Postman tetap dipertahankan secukupnya untuk:

- request manual saat development
- auth dan cookie debugging
- upload image testing
- smoke test endpoint penting

Jangan maintain dokumentasi endpoint lengkap di dua tempat. Jika kontrak API berubah, update kode backend dan biarkan Scramble menghasilkan dokumentasi terbaru.

## Local Verification

Dari folder `backend/`:

```bash
php artisan route:list
php artisan scramble:analyze
```

Jika menjalankan command dari host Windows sementara `.env` memakai `DB_HOST=postgres`, gunakan Docker:

```bash
docker compose exec backend php artisan scramble:analyze
```

Atau jalankan sementara dengan sqlite in-memory untuk analisis dokumentasi:

PowerShell:

```powershell
$env:DB_CONNECTION='sqlite'; $env:DB_DATABASE=':memory:'; php artisan scramble:analyze
```

Bash:

```bash
DB_CONNECTION=sqlite DB_DATABASE=:memory: php artisan scramble:analyze
```
