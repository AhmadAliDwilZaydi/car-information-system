# Car Information System

Aplikasi Full Stack untuk manajemen referensi informasi kendaraan (big data) dengan arsitektur modern, clean code, AI Chatbot Terintegrasi, dan siap dijalankan menggunakan Docker Compose.

Untuk persiapan tanya jawab asistensi, baca [README_ASISTENSI.md](README_ASISTENSI.md).

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Swagger OpenAPI
- Multer
- MinIO SDK
- Ollama Client (AI Chatbot)

### Frontend
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Axios
- React Hook Form
- Zod
- TanStack Query

### Infra
- Docker
- Docker Compose
- GitHub Codespaces compatible

## Struktur Proyek

- backend/
- frontend/
- docker-compose.yml
- README.md

## Menjalankan Dengan Docker (Rekomendasi)

1. Pastikan Docker Desktop aktif.
2. Jalankan dari root proyek:

```bash
docker compose up --build
```

3. Akses service:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/v1
- Swagger UI: http://localhost:5000/api-docs
- MinIO API: http://localhost:9000
- MinIO Console: http://localhost:9001
- MongoDB: mongodb://localhost:27017

## Menjalankan di GitHub Codespaces

1. Buka repository di GitHub, klik tombol **Code → Codespaces → Create codespace**.
2. Codespace otomatis memakai konfigurasi `.devcontainer/devcontainer.json` (image universal + docker-in-docker).
3. Setelah terminal siap di root repository, jalankan:

```bash
docker compose up --build
```

4. Buka tab **Ports**, lalu akses port 3000 (frontend) dan 5000 (backend/Swagger) yang otomatis di-forward.

## Kredensial Default

Admin login:
- Email: admin@carinfo.local
- Password: Admin123!

MinIO:
- Access Key: minioadmin
- Secret Key: minioadmin

## Data Seeding

Saat container backend pertama kali start, aplikasi memeriksa collection `Cars`. Bila masih kosong, 77 data mobil dengan spesifikasi teknis, harga baru, estimasi harga bekas, dan gambar katalog JPG otomatis dibuat di bucket MinIO. Restart berikutnya tidak menduplikasi data.

Untuk memeriksa/menjalankan seed non-destruktif secara manual:
```bash
cd backend
npm run seed
```

Jika ingin mereset data development dan memasukkan kembali 77 data mobil yang bervariasi (termasuk menghapus objek gambar katalog lama pada prefix `cars/`):
```bash
cd backend
npm run seed:fresh
```

## Menjalankan Tanpa Docker

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Environment Variables Utama

### Backend (.env)

- PORT
- NODE_ENV
- MONGO_URI
- JWT_SECRET
- JWT_EXPIRES_IN
- ADMIN_EMAIL
- ADMIN_PASSWORD
- MINIO_ENDPOINT
- MINIO_PORT
- MINIO_USE_SSL
- MINIO_ACCESS_KEY
- MINIO_SECRET_KEY
- MINIO_BUCKET_NAME
- MINIO_PUBLIC_URL
- OLLAMA_BASE_URL (URL ke service Ollama)
- OLLAMA_MODEL (Model Ollama yang dipakai, default `llama3.2:latest`)

Referensi nilai ada di file backend/.env.example.

### Frontend (.env.local)

- NEXT_PUBLIC_API_URL

Referensi nilai ada di file frontend/.env.example.

Jangan memasukkan password produksi atau JWT secret nyata ke repository. Nilai default hanya untuk development lokal.

## API Endpoints

### Auth
- POST /auth/login
- POST /auth/logout

### Cars
- GET /cars
- GET /cars/:id
- POST /cars
- PUT /cars/:id
- DELETE /cars/:id
- POST /cars/:id/image
- PUT /cars/:id/image
- DELETE /cars/:id/image

### Chatbot AI
- POST /chat
- GET /chat/history/:sessionId
- DELETE /chat/history/:sessionId

### Dashboard
- GET /dashboard

Semua endpoint sudah terdaftar otomatis dan dapat dicoba di Swagger UI.

## Fitur Utama

- JWT Authentication untuk admin
- Manajemen Big Data Informasi Mobil Terlengkap
- AI Chatbot dengan konteks otomatis dari database menggunakan teknik RAG (Retrieval-Augmented Generation)
- Upload/Replace/Delete gambar mobil dengan penyimpanan MinIO Object Storage
- Dashboard dengan statistik kendaraan, visualisasi tipe bodi, dan kendaraan terbaru
- Frontend modern dengan Next.js App Router, SSR, dan TanStack Query
- UI responsif (desktop sidebar, mobile drawer, grid dinamis)
- Validasi input backend dan frontend yang ketat

## Bulk Data

Dataset awal dapat ditambah dengan mengedit `backend/src/data/cars.seed.json` atau `backend/src/data/additionalCars.seed.js`, lalu menjalankan `npm run seed:fresh`. Antarmuka Bulk Import/Export pada dashboard saat ini masih ditandai **dalam pengembangan**; belum ada endpoint import/export CSV/JSON produksi.

## GitHub Codespaces

Proyek siap digunakan di Codespaces karena seluruh service dapat dijalankan lewat:

```bash
docker compose up --build
```

Pastikan port 3000, 5000, 9000, 9001 di-forward.
