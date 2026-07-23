# Frontend dan Backend — Car Data Information System

Dokumen ini menjelaskan perbedaan frontend dan backend pada aplikasi **Car Data Information System**.

## Ringkasan

| Bagian | Frontend | Backend |
|---|---|---|
| Lokasi kode | `frontend/` | `backend/` |
| Teknologi utama | Next.js, React, TypeScript, Tailwind CSS | Node.js, Express.js, Mongoose |
| Diakses pengguna | Ya, melalui browser | Tidak langsung; berjalan sebagai server API |
| URL saat Docker aktif | `http://localhost:3000` | `http://localhost:5000` |
| Fungsi | Tampilan, interaksi pengguna, form, katalog, dashboard, chat | Logika bisnis, REST API, autentikasi, validasi, akses database dan storage |

## Frontend

Frontend adalah bagian aplikasi yang **terlihat dan digunakan oleh pengguna**. Pada proyek ini frontend berada di folder `frontend/` dan dibuat menggunakan Next.js App Router serta React.

Tanggung jawab frontend:

- Menampilkan katalog, kartu mobil, detail spesifikasi, dan gambar mobil.
- Menyediakan pencarian dan filter kendaraan.
- Menampilkan halaman login, dashboard admin, tambah/edit mobil, serta chatbot AI.
- Mengirim request ke backend menggunakan Axios dan menampilkan hasilnya.
- Melakukan validasi form menggunakan React Hook Form dan Zod.
- Mengatur tampilan responsif dengan Tailwind CSS.

Contoh: ketika pengguna mengetik **Daihatsu Rocky** pada kolom pencarian, frontend mengirim request API ke backend dan kemudian menampilkan kartu mobil hasil pencarian.

## Backend

Backend adalah bagian yang berjalan **di belakang layar**. Backend tidak langsung terlihat di browser, tetapi menerima request dari frontend dan mengelola data secara aman. Pada proyek ini backend berada di folder `backend/` dan dibuat menggunakan Node.js dan Express.js.

Tanggung jawab backend:

- Menyediakan REST API, misalnya `GET /api/v1/cars`.
- Mengambil dan menyimpan data spesifikasi kendaraan di MongoDB.
- Menerapkan autentikasi JWT untuk aktivitas Admin.
- Memvalidasi data mobil sebelum disimpan.
- Mengunggah, mengganti, dan menghapus gambar melalui MinIO.
- Menjalankan seeding data awal mobil.
- Menyediakan statistik dashboard dari data nyata MongoDB.
- Menghubungkan chatbot dengan data katalog dan layanan Ollama AI.

## Alur Pencarian Mobil

```text
Pengguna mengetik kata kunci di browser
        ↓
Frontend Next.js mengirim GET /api/v1/cars?search=Daihatsu+Rocky
        ↓
Backend Express menerima dan memvalidasi request
        ↓
Backend mencari dokumen yang sesuai di MongoDB
        ↓
Backend mengembalikan data dalam format JSON
        ↓
Frontend menampilkan kartu Daihatsu Rocky beserta gambar dan spesifikasinya
```

## Alur Upload Gambar Mobil

```text
Admin memilih gambar pada halaman Tambah/Edit Mobil
        ↓
Frontend mengirim form-data ke REST API backend
        ↓
Backend memvalidasi file melalui Multer
        ↓
Backend menyimpan file gambar ke MinIO
        ↓
Backend menyimpan URL gambar MinIO pada dokumen Cars di MongoDB
        ↓
Frontend membaca URL tersebut dan menampilkan gambar mobil
```

## Mengapa Dipisahkan?

Pemisahan frontend dan backend membuat aplikasi lebih aman dan mudah dikembangkan:

- Browser tidak memperoleh akses langsung ke MongoDB atau MinIO.
- Hak Admin dapat dilindungi menggunakan JWT di backend.
- Tampilan dapat diubah tanpa mengubah struktur database.
- API yang sama dapat digunakan oleh aplikasi lain, misalnya aplikasi mobile.
- Logika pencarian, AI, upload gambar, dan validasi tersimpan rapi di server.

## Cara Menjalankan

Jalankan seluruh bagian aplikasi dari folder utama proyek:

```powershell
docker compose up -d
```

Setelah aktif:

| Layanan | URL |
|---|---|
| Frontend aplikasi | `http://localhost:3000` |
| Backend REST API | `http://localhost:5000/api/v1` |
| Swagger API | `http://localhost:5000/api-docs` |
| MinIO Console | `http://localhost:9001` |

## Jawaban Singkat untuk Asistensi

> **Frontend** adalah tampilan yang pengguna buka di browser: katalog, detail mobil, dashboard, dan chatbot. Frontend dibuat dengan Next.js/React dan berjalan pada port 3000.
>
> **Backend** adalah server di belakang layar. Backend dibuat dengan Node.js/Express, berjalan pada port 5000, menyediakan REST API, mengelola MongoDB dan MinIO, menerapkan JWT, serta memproses chatbot AI.
