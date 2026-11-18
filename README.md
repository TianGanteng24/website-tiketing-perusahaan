# 🎫 Website Tiketing Perusahaan

Sistem aplikasi berbasis web untuk mengelola pelaporan kendala (IT Helpdesk / Customer Support), permintaan layanan, serta pemantauan progres penyelesaian tiket di lingkungan perusahaan secara terpusat dan terstruktur.

---

## ✨ Fitur Utama

* **Manajemen Tiket (CRUD):** Pembuatan tiket baru oleh karyawan/klien, pembaruan status, serta riwayat penanganan tiket.
* **Kategorisasi & Prioritas:** Pengelompokan tiket berdasarkan divisi/kategori masalah serta tingkat urgensi (*Low, Medium, High, Urgent*).
* **Pelacakan Status Real-time:** Pemantauan alur tiket mulai dari *Open*, *In Progress*, *Resolved*, hingga *Closed*.
* **Manajemen Pengguna & Hak Akses (Role):** Pembagian peran antara Admin, Tim Teknis/Support, dan User/Karyawan.
* **Dashboard & Laporan:** Ringkasan statistik jumlah tiket masuk, tiket selesai, dan performa penyelesaian.

---

## 🛠️ Teknologi yang Digunakan

*(Sesuaikan bagian ini dengan tech stack yang Anda gunakan di proyek)*

* **Frontend:** HTML5, CSS3, JavaScript, Bootstrap / Tailwind CSS
* **Backend:** PHP (Laravel / Native) / Node.js (Express)
* **Database:** MySQL / PostgreSQL
* **Tools:** Git, GitHub, Visual Studio Code

---

## ⚙️ Cara Instalasi & Menjalankan Proyek

Ikuti langkah-langkah berikut untuk menjalankan proyek ini di komputer lokal Anda:

1. **Clone repositori ini**
   ```bash
   git clone https://github.com
   ```

2. **Masuk ke direktori proyek**
   ```bash
   cd website-tiketing-perusahaan
   ```

3. **Instal dependensi** *(jika menggunakan Composer atau NPM)*
   ```bash
   composer install
   # atau
   npm install
   ```

4. **Konfigurasi Environment & Database**
   * Salin file `.env.example` menjadi `.env` (jika ada) dan sesuaikan pengaturan koneksi database.
   * Buat database baru di phpMyAdmin / MySQL, lalu import file `.sql` yang tersedia (atau jalankan migrasi database).

5. **Jalankan server lokal**
   ```bash
   php artisan serve
   # atau
   npm start
   ```
   Akses aplikasi melalui browser di `http://localhost:8000` (atau sesuai port yang muncul).

---

## 📸 Tangkapan Layar (Screenshots)

*(Opsional: Anda dapat menambahkan gambar tampilan halaman Login, Dashboard, dan Form Tiket di sini)*

---

## 👤 Pembuat

* **Cristian Greitfal Malok** – [@TianGanteng24](https://github.com)

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan internal dan pengembangan sistem perusahaan.
