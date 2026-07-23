# Panduan Asistensi — Car Data Information System

Dokumen ini berisi jawaban singkat yang dapat digunakan saat menjelaskan proyek kepada dosen/asisten. Sistem ini adalah **basis data informasi dan spesifikasi kendaraan**, bukan aplikasi rental, booking, customer, atau transaksi penyewaan.

## Penjelasan singkat proyek

> Car Data Information System adalah aplikasi full-stack untuk menyimpan, mencari, membandingkan, dan mengelola spesifikasi mobil. Pengunjung dapat melihat katalog dan memakai chatbot pencarian. Admin login untuk mengelola data mobil dan gambar. Data record disimpan di MongoDB, sedangkan gambar disimpan di MinIO.

## Pertanyaan inti

### 1. Di mana dataset atau data teks/record disimpan?

Semua record utama disimpan di **MongoDB**, bukan array sementara atau data mock.

- Collection `cars`: merek, model, tahun, spesifikasi mesin, dimensi, fitur, harga, dan URL gambar.
- Collection `chathistories`: pesan user/asisten dan referensi mobil dari chatbot.
- Collection `admins`: akun Admin dan password yang sudah di-hash BCrypt.

MongoDB berjalan dalam container `car-data-mongo`. Data fisiknya persisten di Docker volume `mongo_data`, sehingga tidak hilang hanya karena container direstart.

### 2. Di mana data gambar mobil disimpan?

File gambar **tidak disimpan di MongoDB**. File disimpan pada **MinIO Object Storage** di bucket `car-images`, sedangkan MongoDB menyimpan URL seperti:

```text
http://localhost:9000/car-images/cars/toyota_avanza_2024_front34_01.jpg
```

File MinIO dipersistenkan pada Docker volume `minio_data`. Saat ini aplikasi berfokus pada gambar eksterior mobil; belum ada fitur upload foto profil Admin.

### 3. Mengapa gambar tidak disimpan langsung ke MongoDB?

MongoDB lebih tepat untuk record/metadata. MinIO dirancang khusus untuk file objek seperti gambar, lebih efisien untuk file besar dan memudahkan URL publik, penggantian gambar, serta penghapusan object tanpa membebani collection `cars`.

### 4. Di mana dan bagaimana program dijalankan?

Program berjalan secara lokal melalui **Docker Desktop + Docker Compose** dari root proyek:

```powershell
cd "D:\ALI\SEMESTER 4\pemrograman web 4f KELOMPOK 4\car-information-system"
docker compose up --build -d
```

Container yang berjalan:

| Container | Fungsi | Port |
|---|---|---|
| `car-data-frontend` | Next.js UI | 3000 |
| `car-data-backend` | Express REST API | 5000 |
| `car-data-mongo` | MongoDB database | 27017 |
| `car-data-minio` | MinIO object storage/API | 9000 |
| `car-data-minio` | MinIO Console | 9001 |

Akses utama: frontend `http://localhost:3000`, Swagger `http://localhost:5000/api-docs`, dan MinIO Console `http://localhost:9001`.

### 5. Framework dan bahasa pemrograman apa yang digunakan?

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS, Axios, TanStack Query, React Hook Form, Zod, React Hot Toast, dan Lucide icons.
- **Backend:** Node.js, Express.js, JavaScript, Mongoose, JWT, BCrypt, Express Validator, Multer, Swagger OpenAPI, MinIO SDK, dan Axios.
- **Database/storage:** MongoDB dan MinIO.
- **Infrastruktur:** Docker, Docker Compose, serta konfigurasi GitHub Codespaces pada `.devcontainer/devcontainer.json`.

### 6. Bagaimana alur kerja fitur AI?

Fitur AI memakai pola **RAG sederhana**:

1. User mengirim pertanyaan ke `POST /api/v1/chat`.
2. Backend membaca kata kunci seperti merek/model, tipe bodi, bahan bakar, dan batas harga.
3. Backend mencari mobil relevan di MongoDB collection `cars`.
4. Spesifikasi mobil yang ditemukan dimasukkan ke system prompt sebagai konteks.
5. Untuk pertanyaan rekomendasi atau perbandingan, backend menyusun jawaban langsung dari record MongoDB agar nama mobil, harga, dan spesifikasi selalu sesuai katalog. Untuk konsultasi/edukasi istilah otomotif, backend mengirim prompt ke Ollama di `OLLAMA_BASE_URL` memakai model `OLLAMA_MODEL`.
6. Jawaban dan ID mobil rujukan disimpan ke `chathistories`, lalu ditampilkan di widget/panel chat.

Contoh pertanyaan yang baik: *“Bandingkan Toyota Avanza dan Honda BR-V”* atau *“MPV keluarga di bawah 400 juta”*.

### 7. Apakah fitur AI merusak atau membebani database utama?

Tidak merusak data utama.

- Chatbot melakukan **read/query** pada collection `cars`; tidak mengubah harga, spesifikasi, atau gambar mobil.
- Chatbot hanya melakukan **write** ke collection terpisah, yaitu `chathistories`, untuk menyimpan riwayat percakapan.
- Endpoint `/chat` memiliki rate limit agar request berulang tidak membebani backend atau Ollama.
- Admin CRUD tetap dilindungi JWT; chatbot tidak memiliki akses untuk menghapus atau mengubah data mobil.

### 8. Bagaimana jika Ollama kampus sedang tidak bisa diakses?

Backend memiliki timeout 20 detik dan fallback yang ramah. Sistem tetap menampilkan rekomendasi atau tabel perbandingan dari mobil yang ditemukan di MongoDB, lalu memberi tahu user bahwa layanan AI eksternal sedang tidak dapat dihubungi. Jadi katalog dan database utama tetap berjalan.

### 9. Apakah AI benar-benar memakai data mobil, bukan jawaban statis?

Ya. Service `backend/src/services/chatbotService.js` mengambil `relevantCars` dari MongoDB sebelum membangun prompt. Data seperti harga baru, estimasi harga bekas, transmisi, kapasitas mesin, tenaga, torsi, kapasitas kursi, dan fitur keselamatan dimasukkan ke konteks. Field `referencedCarIds` juga menyimpan ID mobil yang dipakai pada jawaban.

### 10. Bagaimana keamanan Admin diterapkan?

Admin login melalui `POST /auth/login`. Password disimpan dalam hash BCrypt, bukan teks biasa. Backend membuat JWT dengan role `Admin`. Endpoint publik GET katalog/detail tidak memerlukan token, tetapi POST/PUT/DELETE Cars dan operasi gambar akan ditolak HTTP 401 tanpa `Authorization: Bearer <token>` yang valid.

### 11. Bagaimana cara kerja pencarian agar cepat untuk banyak data?

Collection `cars` memiliki index MongoDB pada `brand`, `model`, `year`, `bodyType`, dan `priceNew`, serta text index gabungan `brand + model`. Endpoint `GET /cars` juga mendukung pagination dan filter brand, model, tahun, tipe bodi, transmisi, bahan bakar, dan rentang harga.

### 12. Bagaimana proses upload, replace, dan delete gambar?

1. Admin mengirim gambar `multipart/form-data`.
2. Multer memvalidasi bahwa file adalah image dan membatasi ukuran maksimum 5 MB.
3. Backend membuat object name, misalnya `cars/toyota_avanza_2024_front34_01.jpg`.
4. MinIO menyimpan object, lalu backend menyimpan URL object itu ke `imageUrl` dan `imageGalleryUrls` di MongoDB.
5. Saat replace/delete, backend menghapus object lama dari MinIO dan memperbarui URL di MongoDB.

### 13. Apa perbedaan endpoint publik dan endpoint Admin?

| Publik tanpa login | Admin dengan JWT |
|---|---|
| Lihat katalog, pencarian/filter, detail mobil, chatbot dan riwayat sesi | Dashboard, tambah mobil, edit mobil, hapus mobil, upload/replace/delete gambar |

### 14. Bagaimana saya mendemokan proyek dengan cepat?

1. Buka `http://localhost:3000` dan cari `Toyota` atau `Corolla`.
2. Pilih satu card mobil untuk menunjukkan detail spesifikasi, harga baru/bekas, dan galeri.
3. Buka chatbot dan tanya rekomendasi/perbandingan mobil.
4. Login sebagai Admin, buka Dashboard untuk melihat statistik nyata.
5. Buka Swagger untuk memperlihatkan endpoint API dan JWT.
6. Buka MinIO Console untuk menunjukkan bucket `car-images`.

### 15. Mengapa dashboard tidak memiliki “mobil disewa”, “customer”, atau “rental”?

Karena desain aplikasi ini adalah **Car Data Information System**, bukan sistem rental. Dashboard yang benar menampilkan Total Mobil, Total Merek, Total Model, Mobil Ditambahkan Bulan Ini, distribusi tipe bodi/rentang harga, dan mobil terbaru.

## Mengedit kode tanpa bentrok port Docker

### Pilihan A — tetap memakai Docker (paling sederhana)

Edit kode di VS Code, kemudian rebuild container yang berubah:

```powershell
docker compose up --build -d
```

Tidak ada bentrok port karena Docker tetap menggunakan frontend 3000 dan backend 5000.

### Pilihan B — development lokal dengan hot reload

Hentikan hanya frontend/backend Docker, tetapi biarkan MongoDB dan MinIO aktif:

```powershell
docker compose stop frontend backend
```

Untuk backend lokal, salin `backend/.env.example` menjadi `backend/.env`, lalu gunakan `MONGO_URI=mongodb://localhost:27017/car_data_db` dan `MINIO_ENDPOINT=localhost`. Jalankan:

```powershell
cd backend
npm install
npm run dev
```

Untuk frontend lokal, salin `frontend/.env.example` menjadi `frontend/.env.local`, set `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`, lalu jalankan:

```powershell
cd frontend
npm install
npm run dev
```

### Pilihan C — Docker tetap hidup, gunakan port alternatif

Jika Docker frontend/backend tetap aktif, pakai port lain untuk mode lokal:

```powershell
# Terminal backend
$env:PORT=5001
cd backend
npm run dev

# Terminal frontend; set NEXT_PUBLIC_API_URL ke http://localhost:5001/api/v1 terlebih dahulu
cd frontend
npx next dev --webpack -p 3001
```

Kemudian akses frontend lokal pada `http://localhost:3001`. Jangan menjalankan dua proses pada port yang sama.

## Pertanyaan lanjutan yang mungkin muncul

### Mengapa memakai MongoDB, bukan MySQL?

Spesifikasi mobil bersifat kaya dan bisa berkembang; MongoDB cocok untuk dokumen dengan banyak field, array fitur, serta data tambahan seperti baterai/range EV. Mongoose tetap memberikan schema dan validasi.

### Apakah data seed akan duplikat setiap restart?

Tidak. Backend memeriksa jumlah dokumen Cars terlebih dahulu. Jika sudah ada data, seeder melewati insert. Untuk reset development secara sengaja gunakan `docker compose exec backend npm run seed:fresh`.

### Apakah gambar hilang saat container direstart?

Tidak, karena MinIO memakai named volume `minio_data`. MongoDB juga memakai `mongo_data`.

### Di mana dokumentasi API?

Di Swagger UI: `http://localhost:5000/api-docs`. Gunakan tombol **Authorize** dan masukkan `Bearer <JWT>` untuk mencoba endpoint Admin.

### Apakah semua fitur opsional sudah dibuat?

Tidak semuanya. Bulk Import/Export, Redis cache, cursor pagination, streaming response, voice input, rating jawaban, dan data versioning belum tersedia. Hal ini tidak mengganggu fitur inti katalog, CRUD Cars, MinIO, JWT, dashboard, dan chatbot RAG.

### Bagaimana menjalankan di GitHub Codespaces?

Buat Codespace dari repository. Konfigurasi `.devcontainer/devcontainer.json` akan menyediakan Docker-in-Docker dan port forwarding. Setelah terminal siap jalankan `docker compose up --build`, lalu buka port 3000 dari panel **Ports**.

## Path penting untuk disebut saat asistensi

```text
backend/src/models/Car.js                 schema Cars + index
backend/src/models/ChatHistory.js         schema riwayat chatbot
backend/src/services/chatbotService.js     RAG + Ollama + fallback
backend/src/services/fileService.js        upload/delete MinIO
backend/src/utils/seeder.js                seed 77 mobil dan gambar
backend/src/routes/carRoutes.js            REST API Cars + Swagger annotation
backend/src/config/db.js                   koneksi MongoDB
frontend/src/components/cars/CarCatalog.tsx katalog dan filter
frontend/src/components/ai-chat/            widget chatbot
docker-compose.yml                         seluruh service Docker
```

## Batasan yang perlu disampaikan dengan jujur

Ollama terintegrasi melalui environment variable dan memiliki fallback RAG. Namun, jawaban LLM langsung hanya tersedia jika endpoint kampus `https://ollama.if.unismuh.ac.id` sedang aktif serta dapat dijangkau dari jaringan yang digunakan.
