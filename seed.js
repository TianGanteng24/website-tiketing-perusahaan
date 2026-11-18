const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function seedDatabase() {
    try {
        console.log('⏳ Memulai proses generate 100 data dummy...');

        const hashedPassword = await bcrypt.hash('password123', 10);

        // 1. GENERATE 20 DATA USERS DUMMY
        const departemenList = ['Finance', 'HRD', 'Sales', 'Marketing', 'Operasional', 'Procurement', 'Warehouse', 'Legal'];
        const namaDepan = ['Andi', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fajar', 'Gita', 'Hendra', 'Indah', 'Joko', 'Kartika', 'Lukman', 'Maya', 'Nanda', 'Oki', 'Putri', 'Rizky', 'Sari', 'Taufik', 'Wulan'];
        const namaBelakang = ['Pratama', 'Saputra', 'Wijaya', 'Kusuma', 'Lestari', 'Santoso', 'Hidayat', 'Nugroho', 'Setiawan', 'Rahmawati'];

        const userIds = [];

        for (let i = 1; i <= 20; i++) {
            const nama = `${namaDepan[i % namaDepan.length]} ${namaBelakang[i % namaBelakang.length]}`;
            const email = `user${i}@kantor.com`;
            const dept = departemenList[i % departemenList.length];
            const role = i === 1 ? 'admin' : 'user'; // user1@kantor.com otomatis jadi admin

            const [res] = await db.query(
                'INSERT IGNORE INTO users (nama, email, password, departemen, role) VALUES (?, ?, ?, ?, ?)',
                [nama, email, hashedPassword, dept, role]
            );

            if (res.insertId) {
                userIds.push(res.insertId);
            }
        }

        // Ambil semua ID user yang ada di DB jika sebelumnya sudah ada data
        const [allUsers] = await db.query('SELECT id FROM users');
        const validUserIds = allUsers.map(u => u.id);

        if (validUserIds.length === 0) {
            throw new Error('Tidak ada user di database.');
        }

        // 2. GENERATE 100 DATA TIKET IT SUPPORT
        const kategoriList = ['Hardware', 'Software', 'Jaringan/Internet', 'Pengadaan Baru', 'Lainnya'];
        const prioritasList = ['Low', 'Medium', 'High', 'Urgent'];
        const statusList = ['Open', 'In Progress', 'Resolved', 'Rejected'];
        const judulList = [
            'Laptop sering blue screen saat buka Excel besar',
            'Request instalasi Microsoft Office & PDF Reader',
            'Koneksi WiFi ruangan sering putus-nyambung',
            'Printer tidak bisa menarik kertas / paper jam',
            'Pengajuan mouse wireless dan tas laptop baru',
            'Lupa password email kantor & akses VPN',
            'Monitor eksternal berkedip saat disambungkan HDMI',
            'Permintaan upgrade RAM laptop karena lemot',
            'Keyboard laptop beberapa tombol tidak berfungsi',
            'Setting sharing printer antar divisi'
        ];
        const catatanList = [
            'Sedang dicek oleh tim IT Support.',
            'Sudah dilakukan pembersihan cache dan update driver.',
            'Menunggu persetujuan pengadaan sparepart.',
            'Selesai ditangani, unit sudah normal kembali.',
            null
        ];

        for (let i = 1; i <= 100; i++) {
            const randomUser = validUserIds[Math.floor(Math.random() * validUserIds.length)];
            const ticketCode = `TIK-202611-${String(i).padStart(3, '0')}-${Math.floor(10 + Math.random() * 89)}`;
            const kategori = kategoriList[Math.floor(Math.random() * kategoriList.length)];
            const prioritas = prioritasList[Math.floor(Math.random() * prioritasList.length)];
            const status = statusList[Math.floor(Math.random() * statusList.length)];
            const judul = judulList[i % judulList.length];
            const deskripsi = `Laporan kendala operasional ke-${i}. Mohon segera dibantu pengecekan oleh tim IT Support agar pekerjaan tidak terhambat.`;
            const catatanIt = status === 'Open' ? null : catatanList[Math.floor(Math.random() * catatanList.length)];

            await db.query(
                `INSERT INTO tickets (ticket_code, user_id, kategori, prioritas, judul, deskripsi, status, catatan_it) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [ticketCode, randomUser, kategori, prioritas, judul, deskripsi, status, catatanIt]
            );
        }

        // 3. GENERATE 100 DATA INVENTARIS & STOK PERANGKAT IT
        const jenisList = ['Laptop', 'PC Desktop', 'Monitor', 'Printer/Scanner', 'Mouse/Keyboard', 'Lainnya'];
        const merkLaptop = ['ASUS ExpertBook B1', 'Lenovo ThinkPad T14', 'HP ProBook 440 G9', 'Dell Latitude 5430', 'MacBook Air M2'];
        const merkMonitor = ['Dell 24" P2422H', 'LG 24" IPS Full HD', 'Samsung 27" Curved', 'ASUS Eye Care 22"'];
        const merkPrinter = ['Epson EcoTank L3210', 'HP LaserJet Pro M404dn', 'Canon PIXMA G2010', 'Brother DCP-T420W'];
        const merkAksesoris = ['Logitech MK270 Wireless Combo', 'Logitech M331 Silent Mouse', 'Jabra Evolve2 20 Headset'];
        const kondisiList = ['Baik / Normal', 'Baik / Normal', 'Baik / Normal', 'Rusak Ringan', 'Perlu Maintenance', 'Rusak Berat'];
        const kelengkapanList = [
            'Unit Utama, Charger Original, Tas Laptop',
            'Unit Utama, Kabel Power, Kabel HDMI',
            'Unit Lengkap dengan Dus & Kartu Garansi',
            'Unit Utama + USB Dongle Receiver'
        ];

        for (let i = 1; i <= 100; i++) {
            const randomUser = validUserIds[Math.floor(Math.random() * validUserIds.length)];
            const jenis = jenisList[Math.floor(Math.random() * jenisList.length)];
            
            let merkTipe = 'Perangkat IT Standar';
            if (jenis === 'Laptop' || jenis === 'PC Desktop') {
                merkTipe = merkLaptop[Math.floor(Math.random() * merkLaptop.length)];
            } else if (jenis === 'Monitor') {
                merkTipe = merkMonitor[Math.floor(Math.random() * merkMonitor.length)];
            } else if (jenis === 'Printer/Scanner') {
                merkTipe = merkPrinter[Math.floor(Math.random() * merkPrinter.length)];
            } else if (jenis === 'Mouse/Keyboard') {
                merkTipe = merkAksesoris[Math.floor(Math.random() * merkAksesoris.length)];
            } else {
                merkTipe = 'TP-Link Switch / Hub USB-C';
            }

            const serialNumber = `SN-${jenis.substring(0, 3).toUpperCase()}-2026${String(i).padStart(4, '0')}${Math.floor(10 + Math.random() * 89)}`;
            const kodeAset = `INV-IT-${String(i).padStart(4, '0')}`;
            const kondisi = kondisiList[Math.floor(Math.random() * kondisiList.length)];
            const kelengkapan = kelengkapanList[Math.floor(Math.random() * kelengkapanList.length)];
            const keterangan = kondisi === 'Baik / Normal' 
                ? 'Berfungsi normal untuk operasional harian' 
                : 'Perlu pengecekan fisik / kalibrasi oleh tim IT';

            await db.query(
                `INSERT INTO assets (user_id, jenis_perangkat, merk_tipe, serial_number, kode_aset, kondisi, kelengkapan, keterangan) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [randomUser, jenis, merkTipe, serialNumber, kodeAset, kondisi, kelengkapan, keterangan]
            );
        }

        console.log('✅ BERHASIL! 20 User, 100 Tiket IT, dan 100 Data Perangkat IT telah dimasukkan ke database.');
        console.log('🔑 Akun Admin Testing -> Email: user1@kantor.com | Password: password123');
        process.exit(0);
    } catch (err) {
        console.error('❌ Gagal menjalankan seeder:', err);
        process.exit(1);
    }
}

seedDatabase();