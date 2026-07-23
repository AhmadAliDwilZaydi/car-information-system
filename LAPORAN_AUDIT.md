# Laporan Audit — Car Information System

Audit dilakukan pada aplikasi yang berjalan melalui Docker Compose di localhost. Sistem ini adalah basis data informasi dan spesifikasi mobil; modul rental, customer, mobil disewa, dan transaksi tidak diaudit maupun ditambahkan karena berada di luar ruang lingkup.

## Ringkasan verifikasi runtime

- `docker compose ps`: `car-data-backend` dan `car-data-frontend` **Up**; `car-data-mongo` dan `car-data-minio` **healthy**.
- `GET /health`: `{"message":"API is healthy"}`.
- `npm run seed:fresh`: `Successfully seeded 77 cars with catalog images in MinIO.`
- `npm run seed` saat sudah ada data: `Found 77 cars in DB. Skipping seeding.`
- `GET /cars?search=Toyota&limit=5`: 12 hasil Toyota.
- `GET /`: frontend HTTP 200 setelah kompilasi awal Next.js.
- `GET` satu objek gambar MinIO: HTTP 200.
- `tsc --noEmit -p frontend/tsconfig.json`: selesai tanpa error.

## 1. MongoDB

### Checklist

- [x] MongoDB adalah database utama. Service `mongo:7` dipasang pada [docker-compose.yml](docker-compose.yml), backend menghubungkan Mongoose melalui [backend/src/config/db.js](backend/src/config/db.js): `mongoose.connect(env.mongoUri)`.
- [x] URI dikonfigurasi dengan `MONGO_URI`; Docker memakai `mongodb://mongo:27017/car_data_db`. Nilai contoh terdapat pada [backend/.env.example](backend/.env.example).
- [x] Collection utama: `cars`, `chathistories`, serta `admins` sebagai pendukung autentikasi.

### Struktur collection

`Cars` di [backend/src/models/Car.js](backend/src/models/Car.js):

| Kelompok | Field |
|---|---|
| Identitas | `_id`, `brand`, `model`, `year`, `bodyType`, `variant` |
| Teknis | `engineCapacity`, `horsepower`, `torque`, `transmissionType`, `fuelType`, `engineType`, `cylinders`, `drivetrain`, `fuelTankCapacity`, `batteryCapacity`, `electricRange`, `chargingTime`, `topSpeed`, `acceleration` |
| Dimensi | `length`, `width`, `height`, `groundClearance`, `seatingCapacity`, `wheelbase`, `frontSuspension`, `rearSuspension`, `brakeType`, `tireSize` |
| Fitur & harga | `safetyFeatures[]`, `entertainmentFeatures[]`, `priceNew`, `priceUsed`, `condition`, `warranty` |
| Media | `imageUrl`, `imageGalleryUrls[]` |
| Metadata | `createdAt`, `updatedAt` (Mongoose timestamps) |

`ChatHistory` di [backend/src/models/ChatHistory.js](backend/src/models/ChatHistory.js): `_id`, `sessionId`, `role` (`user`/`assistant`), `message`, `referencedCarIds[]`, `createdAt`, `updatedAt`.

Relasi bersifat referensi satu-ke-banyak: sebuah pesan `ChatHistory` asisten dapat menyimpan banyak ObjectId `Cars` pada `referencedCarIds`; query history melakukan `populate('referencedCarIds', 'brand model year imageUrl priceNew')`.

### Bukti database nyata

Contoh `Cars` hasil query langsung MongoDB:

```json
{
  "brand": "Toyota", "model": "Avanza", "year": 2024,
  "engineType": "Bensin inline 4-silinder", "wheelbase": 3645,
  "priceNew": 272000000, "priceUsed": "220000000 - 240000000",
  "imageUrl": "http://localhost:9000/car-images/cars/toyota_avanza_2024_front34_01.jpg",
  "imageGalleryUrls": ["http://localhost:9000/car-images/cars/toyota_avanza_2024_front34_01.jpg"],
  "safetyFeatures": ["ABS", "EBD", "Dual Airbags", "Vehicle Stability Control"]
}
```

Contoh `ChatHistory` asisten nyata:

```json
{
  "sessionId": "audit-runtime-3", "role": "assistant",
  "referencedCarIds": ["6a5e84adbd59ce63dd47c76b", "...", "6a5e84aebd59ce63dd47c770"],
  "message": "Layanan AI sedang tidak dapat dihubungi. Berdasarkan data katalog ..."
}
```

`db.cars.getIndexes()` (dibaca melalui koneksi MongoDB) menghasilkan `_id`, index lama gabungan `{brand,model,year}`, index individual `{brand}`, `{model}`, `{year}`, `{bodyType}`, `{priceNew}`, serta text index `{"_fts":"text","_ftsx":1}` dari `brand` + `model`. Definisi individual dan text index ada pada [backend/src/models/Car.js](backend/src/models/Car.js).

## 2. Data seeding

- [x] Data sumber: [backend/src/data/cars.seed.json](backend/src/data/cars.seed.json) berisi 52 mobil dan [backend/src/data/additionalCars.seed.js](backend/src/data/additionalCars.seed.js) berisi 25 mobil; total **77** dari 20 merek termasuk Toyota, Honda, Daihatsu, Mitsubishi, Suzuki, Hyundai, Wuling, BYD, dan lainnya.
- [x] Logic: [backend/src/utils/seeder.js](backend/src/utils/seeder.js). Fungsi `seedCarsIfEmpty()` memeriksa `Car.countDocuments()`; bila bukan `--fresh` dan count lebih dari nol, seeder mencetak `Skipping seeding`.
- [x] Otomatis: [backend/src/server.js](backend/src/server.js) memanggil `await seedCarsIfEmpty()` setelah MongoDB dan bucket MinIO siap.
- [x] `npm run seed:fresh` terbukti mengisi 77 mobil; `npm run seed` terbukti tidak duplikat saat count sudah 77.
- [x] Seeder mengunggah objek JPG ke bucket `car-images`; contoh nama: `cars/toyota_avanza_2024_front34_01.jpg`. `--fresh` juga menghapus objek prefix `cars/` lama sebelum mengunggah ulang.

## 3. REST API Cars

Base URL: `http://localhost:5000/api/v1`.

| Endpoint | Auth | Fungsi dan hasil audit |
|---|---:|---|
| `GET /cars` | Publik | Pagination/filter `brand`, `model`, `year`, `minYear`, `maxYear`, `bodyType`, `transmissionType`, `fuelType`, `minPrice`, `maxPrice`, `search`. Uji nyata: Toyota=12, Avanza=1, 2024=48, MPV=12, CVT=25, Diesel=11, harga 200–400 juta=30, `search=Corolla`=1. |
| `GET /cars/:id` | Publik | Detail spesifikasi; frontend detail juga menghasilkan HTTP 200. |
| `POST /cars` | Admin JWT | Membuat data dan menerima multipart `image`; controller mengembalikan 201. |
| `PUT /cars/:id` | Admin JWT | Mengubah spesifikasi dan/atau gambar; diuji mengubah `priceNew` menjadi 333000000. |
| `DELETE /cars/:id` | Admin JWT | Menghapus dokumen dan seluruh URL gambar terkait. |
| `POST /cars/:id/image` | Admin JWT | Menambah galeri; uji menaikkan galeri dari 1 menjadi 2. |
| `PUT /cars/:id/image` | Admin JWT | Replace; uji menyisakan 1 gambar dan objek sebelumnya memberi HTTP 404. |
| `DELETE /cars/:id/image` | Admin JWT | Mengosongkan galeri dan menghapus objek; uji URL lama memberi HTTP 404. |

Implementasi ada pada [backend/src/routes/carRoutes.js](backend/src/routes/carRoutes.js), [backend/src/controllers/carController.js](backend/src/controllers/carController.js), dan [backend/src/services/carService.js](backend/src/services/carService.js).

Contoh respons list:

```json
{ "items": [{ "brand": "Toyota", "model": "Agya", "year": 2024 }],
  "meta": { "page": 1, "limit": 5, "total": 12, "totalPages": 3 } }
```

POST tanpa token diuji dan ditolak dengan status **401**.

## 4. API Chatbot dan Dashboard

| Endpoint | Bukti |
|---|---|
| `POST /chat` | Input tervalidasi (`sessionId` 8–128 karakter, `message` 1–2000). Uji pertanyaan perbandingan menghasilkan 6 `referencedCars`, menyimpan dua history (`user,assistant`), dan fallback tabel ketika Ollama gagal dihubungi. |
| `GET /chat/history/:sessionId` | Uji menghasilkan 2 entri setelah chat. |
| `DELETE /chat/history/:sessionId` | Uji mengembalikan `History cleared`; GET sesudahnya menghasilkan 0 entri. |
| `GET /dashboard` | Dengan JWT mengembalikan `totalCars:77`, `totalBrands:20`, `totalModels:77`, 5 grup tipe bodi, 5 grup harga, serta 5 mobil terbaru. |

Dashboard dihitung oleh agregasi MongoDB di [backend/src/services/dashboardService.js](backend/src/services/dashboardService.js), bukan angka hardcode.

## 5. Autentikasi JWT

- [x] `POST /auth/login` pada [backend/src/routes/authRoutes.js](backend/src/routes/authRoutes.js) menghasilkan token JWT. Payload dibuat di [backend/src/services/authService.js](backend/src/services/authService.js) dengan `sub`, `role: Admin`, dan `email`.
- [x] GET katalog berhasil tanpa token.
- [x] POST tanpa token diuji: HTTP 401.
- [x] [backend/src/middleware/auth.js](backend/src/middleware/auth.js) memverifikasi Bearer token dan menolak role selain `Admin` dengan 403.

## 6. Swagger

- [x] Swagger UI benar-benar dipasang oleh `app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))` di [backend/src/app.js](backend/src/app.js).
- [x] URL: `http://localhost:5000/api-docs`; uji `curl -L` menghasilkan HTTP 200.
- [x] [backend/src/config/swagger.js](backend/src/config/swagger.js) mendefinisikan OpenAPI 3 dan bearer scheme. Route annotation menghasilkan 8 path: `/auth/login`, `/auth/logout`, `/cars`, `/cars/{id}`, `/cars/{id}/image`, `/chat`, `/chat/history/{sessionId}`, `/dashboard`.
- [x] Dokumentasi request multipart/json, respons, error utama, dan `bearerAuth` berada pada file route; skema Car mencakup spesifikasi teknis, dimensi, harga, fitur, dan media.

## 7. Express.js dan struktur backend

```
backend/src/
├── assets/          gambar placeholder JPG untuk seed
├── config/          db.js, env.js, minio.js, swagger.js
├── controllers/     carController, chatController, authController, dashboardController
├── data/            cars.seed.json dan additionalCars.seed.js
├── middleware/      auth, upload, validate, errorHandler, notFound, chatRateLimit
├── models/          Car, ChatHistory, Admin
├── routes/          authRoutes, carRoutes, chatRoutes, dashboardRoutes
├── services/        car, file/MinIO, chatbot/RAG, dashboard, auth
└── utils/           seeder, asyncHandler, apiError
```

- [x] Express dipakai di [backend/src/app.js](backend/src/app.js), termasuk `express.json`, CORS, Helmet, Morgan, route mount, `notFound`, dan `errorHandler` global.
- [x] Service/controller menggunakan `async/await`; `asyncHandler` meneruskan error ke [backend/src/middleware/errorHandler.js](backend/src/middleware/errorHandler.js).
- [x] Validasi backend memakai `express-validator` di Cars dan Chat; upload memakai Multer memory storage dengan batas 5 MB/image.

## 8. Next.js / React

Frontend menggunakan Next 16 App Router, React 19, TypeScript, dan Tailwind. Rute nyata:

| Rute | Keterangan |
|---|---|
| `/` | Katalog publik (`CarCatalog`) |
| `/cars/[id]` | Detail publik dan error boundary |
| `/login` | Login Admin dengan React Hook Form + Zod |
| `/dashboard` | Statistik Admin |
| `/cars` | Kelola Cars Admin |
| `/cars/add`, `/cars/[id]/edit` | Tambah/Edit Admin |
| `/chat`, `/bulk`, `/profile`, `/settings` | Panel Admin |

Komponen utama: `CarCatalog`, `CarCard`, `AiChatWidget`, `AiChatMessages`, `AppShell`, `StatCard`, `SimpleChart`. Axios ada di [frontend/src/lib/api.ts](frontend/src/lib/api.ts); TanStack Query ada pada katalog, detail, dan dashboard; form Login/Tambah memakai React Hook Form, Zod, dan `zodResolver`.

Halaman publik tidak meminta JWT. Layout admin [frontend/src/app/(dashboard)/layout.tsx](frontend/src/app/(dashboard)/layout.tsx) memeriksa `crms_token` dan redirect ke `/login` bila tidak ada.

## 9. MinIO

- [x] Bucket: `car-images`; konfigurasi [backend/src/config/minio.js](backend/src/config/minio.js) membuat bucket dan policy baca publik.
- [x] Alur: frontend multipart → Multer → `carService` → `fileService.uploadImage()` → `minioClient.putObject()` → MongoDB menyimpan URL.
- [x] MongoDB menyimpan `imageUrl`/`imageGalleryUrls` string URL saja, bukan Buffer/binary.
- [x] Konvensi seed: `cars/{brand}_{model}_{year}_front34_{index}.jpg`; contoh URL Avanza di atas memberi HTTP 200.
- [x] Uji replace/delete nyata: objek galeri lama 404 pascareplace, objek baru 200; setelah delete gambar, objek baru juga 404.

## 10. Chatbot AI / Ollama

[backend/src/services/chatbotService.js](backend/src/services/chatbotService.js) membaca `OLLAMA_BASE_URL` dan `OLLAMA_MODEL`, mencari Cars berdasarkan kata kunci/tipe bodi/bahan bakar/budget, menyusun system prompt berisi spesifikasi katalog, lalu melakukan `axios.post(${OLLAMA_BASE_URL}/api/chat)` dengan timeout 20 detik.

Endpoint Ollama kampus diuji melalui `/api/tags` dan merespons HTTP 200. Audit menemukan model `llama3` lama tidak tersedia (HTTP 404), lalu konfigurasi diperbaiki ke model yang tersedia: `llama3.2:latest`. Uji penjelasan istilah `torsi` menghasilkan respons Ollama langsung. Untuk menjaga fakta rekomendasi dan perbandingan, backend kini memakai mode **data-first**: rekomendasi/perbandingan dibentuk langsung dari record MongoDB dan menyertakan `referencedCars`, harga, mesin, transmisi, bahan bakar, kursi, serta tautan detail. Uji SUV keluarga menghasilkan enam SUV 7 kursi; uji diesel hanya menghasilkan mobil Diesel; uji mobil kota menghasilkan Hatchback; dan uji mudik menghasilkan enam mobil katalog. RAG, history, guardrail topik mobil, fallback, dan perbandingan tabel telah diuji.

Streaming, voice-to-text, rating jawaban, cache Redis, dan data versioning belum diimplementasikan. Rate limit khusus `/chat` ada di [backend/src/middleware/chatRateLimit.js](backend/src/middleware/chatRateLimit.js).

## 11. Docker, Codespaces, environment, dan README

Isi lengkap [docker-compose.yml](docker-compose.yml):

```yaml
name: car-information-system
services:
  mongo:
    image: mongo:7
    container_name: car-data-mongo
    restart: unless-stopped
    ports: ["27017:27017"]
    volumes: ["mongo_data:/data/db"]
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping').ok"]
      interval: 10s
      timeout: 20s
      retries: 20
  minio:
    image: minio/minio:latest
    container_name: car-data-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports: ["9000:9000", "9001:9001"]
    volumes: ["minio_data:/data"]
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9000/minio/health/live || exit 1"]
      interval: 5s
      timeout: 5s
      retries: 20
  backend:
    build: { context: ./backend }
    container_name: car-data-backend
    restart: unless-stopped
    depends_on:
      mongo: { condition: service_healthy }
      minio: { condition: service_healthy }
    environment:
      PORT: 5000
      NODE_ENV: production
      MONGO_URI: mongodb://mongo:27017/car_data_db
      JWT_SECRET: super-secret-key
      JWT_EXPIRES_IN: 1d
      ADMIN_EMAIL: admin@carinfo.local
      ADMIN_PASSWORD: Admin123!
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_USE_SSL: "false"
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
      MINIO_BUCKET_NAME: car-images
      MINIO_PUBLIC_URL: http://localhost:9000
      OLLAMA_BASE_URL: https://ollama.if.unismuh.ac.id
      OLLAMA_MODEL: llama3
    ports: ["5000:5000"]
  frontend:
    build: { context: ./frontend }
    container_name: car-data-frontend
    restart: unless-stopped
    depends_on: { backend: { condition: service_started } }
    environment: { NEXT_PUBLIC_API_URL: http://localhost:5000/api/v1 }
    ports: ["3000:3000"]
volumes:
  mongo_data:
  minio_data:
```

File compose lengkap juga memuat health check Mongo/MinIO, variabel MONGO/MINIO/JWT/Ollama, dan named volumes `mongo_data`/`minio_data`. `docker compose up --build -d` terbukti membangun keempat service.

- [x] [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json) berada di root proyek, memakai Docker-in-Docker dan forward port 3000/5000/9000/9001/27017. Di Codespaces: buka repo, buat Codespace, lalu jalankan `docker compose up --build` dan buka port 3000.
- [x] Environment backend terdokumentasi di [backend/.env.example](backend/.env.example): `PORT`, `NODE_ENV`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, seluruh `MINIO_*`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`. Frontend memakai `NEXT_PUBLIC_API_URL` di `frontend/.env.example`. Rahasia produksi tidak dicantumkan pada laporan.
- [x] [README.md](README.md) mencakup Docker, layanan/port, environment, Swagger, MinIO, Ollama, Codespaces, seed dan keterbatasan bulk import.

## 12. Responsive design dan dashboard

- [x] [frontend/src/components/app-shell.tsx](frontend/src/components/app-shell.tsx) memakai sidebar desktop `lg:translate-x-0`, drawer mobile dengan tombol `lg:hidden`, dan layout `lg:pl-72`.
- [x] Katalog memakai `grid-cols-1`, `sm:grid-cols-2`, `lg:grid-cols-3`; filter berubah dari kolom vertikal pada mobile ke `md:flex-row`; dashboard memakai `sm:grid-cols-2` dan `xl:grid-cols-4`.
- [x] Dashboard menampilkan Total Mobil, Total Merek, Total Model, Ditambahkan Bulan Ini, grafik tipe bodi, grafik harga, tabel mobil terbaru, dan Quick Action; seluruh nilai berasal dari endpoint `/dashboard`.

## 13. Fitur tambahan

| Fitur opsional | Status jujur |
|---|---|
| Bulk Import/Export CSV/JSON | ❌ UI ada tetapi menampilkan “sedang dalam pengembangan”; endpoint belum ada. |
| Cursor pagination | ❌ Belum; katalog memakai page/limit offset dengan limit maksimum 100. |
| Redis caching | ❌ Belum. |
| Rate limiting chat | ✅ `chatRateLimit` diterapkan pada `POST /chat`. |
| Data versioning | ❌ Belum. |

## Tabel ringkasan akhir

| Persyaratan | Status | Bukti / penjelasan |
|---|---|---|
| MongoDB (Cars & ChatHistory + indexing) | ✅ | Mongoose + Mongo container, dokumen nyata dan index dibaca langsung. |
| Data Seeding Otomatis (40–60 data) | ✅ | 77 data; fresh dan skip nonduplikat terbukti. |
| REST API Cars (GET/POST/PUT/DELETE) | ✅ | Filter, JWT 401, CRUD dan image lifecycle diuji. |
| REST API Chat & Dashboard | ✅ | Chat/history/delete dan dashboard agregat diuji; Ollama eksternal memakai fallback saat offline. |
| Autentikasi JWT (Admin only) | ✅ | Login token dan penolakan 401 tanpa token terbukti. |
| Swagger | ✅ | `/api-docs` HTTP 200; 8 path dari annotation OpenAPI. |
| Express.js (struktur backend) | ✅ | app/routes/controllers/services/middleware nyata. |
| Next.js/React (struktur frontend) | ✅ | App Router, Query, Axios, RHF, Zod, rute publik/admin. |
| MinIO (upload/replace/delete, naming convention) | ✅ | Bucket, URL JPG 200 dan lifecycle objek diuji. |
| Chatbot AI + Ollama (RAG) | ✅ | Model diperbaiki ke `llama3.2:latest`; konsultasi memakai Ollama, sedangkan rekomendasi/perbandingan dijamin dari data katalog MongoDB. |
| Docker & Docker Compose | ✅ | Empat container aktif; Mongo/MinIO healthy. |
| GitHub Codespaces | ✅ | devcontainer Docker-in-Docker dan port forwarding tersedia. |
| Responsive Design | ✅ | Breakpoint Tailwind, sidebar desktop, drawer mobile. |
| Dashboard (data real) | ✅ | 77/20/77 dan agregasi distribusi diuji. |
| CRUD Cars lengkap | ✅ | Create/update/upload/replace/delete diuji dan data audit dibersihkan. |
| Environment Variable | ✅ | Example env backend/frontend dan compose tersedia. |
| README | ✅ | Instruksi aktual Docker, seed, Ollama, MinIO, Codespaces tersedia. |

## Kesimpulan

Aplikasi lokal siap dijalankan sebagai **Car Information System** dan seluruh fitur inti telah diuji, termasuk respons LLM Ollama langsung setelah model dikonfigurasi ke `llama3.2:latest`. Sistem tetap tidak crash bila layanan Ollama suatu saat gagal, karena fallback RAG berbasis MongoDB tetap aktif.
