# Arka Wijaya · Portofolio Fotografer

Portofolio full-stack dan studio galeri untuk persona fiktif Arka Wijaya dari Ruang Karya. Desain publik mempertahankan galeri lanskap gelap, seri Bromo, penampil foto berukuran besar, dan tautan setiap foto.

## Studio

- Masuk di `/admin` untuk mengunggah foto, mengisi judul, teks alternatif, lokasi, kredit, dan sumber atau lisensi.
- Pilih foto dari pustaka, pindahkan urutannya, dan pilih apakah seri tampil di portofolio. Foto pertama menjadi sampul seri. Satu foto dapat dipakai di beberapa seri.
- Galeri publik hanya membaca seri yang ditampilkan dan foto yang tergabung di dalamnya.

Foto JPEG, PNG, dan WebP statis diterima hingga 12 MB dan 30 megapiksel per file. Server menghasilkan WebP untuk tampilan besar dan thumbnail, tanpa menyimpan file asli atau metadata kamera. Database PostgreSQL menyimpan kedua ukuran, metadata, urutan seri, dan sesi login.

## Menjalankan secara lokal

Siapkan Node.js 24 dan database PostgreSQL. Salin `.env.example` ke `.env` dan isi `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, dan `ADMIN_PASSWORD` (minimal 16 karakter).

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
npm ci
npm run db:migrate
npm run db:seed
npm run admin:provision
npm run dev
```

Perintah pertama membuat rahasia sesi untuk `SESSION_SECRET`. Pengisian awal menyediakan enam foto dan dua seri contoh. `admin:provision` membuat atau mereset akun admin dan mengakhiri sesi sebelumnya. Mode pengembangan memakai [portofolio di port 5176](http://127.0.0.1:5176/) dan [studio admin](http://127.0.0.1:5176/admin).

Untuk hasil build lokal, atur `APP_ORIGIN=http://127.0.0.1:4176`, jalankan `npm run build`, lalu `npm start`. Express menyajikan frontend dan REST API pada origin yang sama. Frontend memakai React, Vite, TypeScript, dan CSS Modules. Prisma mengelola koneksi dan migrasi PostgreSQL.

## Kredit

- Pengembangan oleh [guspriaman](https://github.com/guspriaman) untuk [guspriStack](https://github.com/guspristack).
- Desain, potret generatif, dan foto sampel berasal dari prototipe Ruang Karya. Arka Wijaya adalah nama kredit konsep fiktif dalam seri sampel.
