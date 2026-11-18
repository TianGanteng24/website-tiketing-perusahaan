const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const path = require('path');
const db = require('./config/db');
const { isAuthenticated, isAdmin } = require('./middleware/auth');

const app = express();

// Konfigurasi EJS & Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'rahasia_it_kantor_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 hari
}));

// Global variable user untuk EJS
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// ==================== AUTH ROUTES ====================

app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// ==================== AUTH ROUTES (UPDATE POST /login) ====================

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.render('login', { error: 'Email tidak ditemukan!' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'Password salah!' });
        }

        req.session.user = {
            id: user.id,
            nama: user.nama,
            email: user.email,
            departemen: user.departemen,
            role: user.role
        };

        // Flag untuk memicu SweetAlert SOP tepat setelah login berhasil
        req.session.showSopAlert = true;

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.render('login', { error: 'Terjadi kesalahan server.' });
    }
});

app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
    const { nama, email, password, departemen, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Catatan: Pada produksi, role 'admin' sebaiknya di-set manual di DB
        const userRole = role === 'admin' ? 'admin' : 'user';
        await db.query(
            'INSERT INTO users (nama, email, password, departemen, role) VALUES (?, ?, ?, ?, ?)',
            [nama, email, hashedPassword, departemen, userRole]
        );
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.render('register', { error: 'Email sudah terdaftar atau data tidak valid.' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});


// ==================== DASHBOARD ROUTES ====================

app.get('/dashboard', isAuthenticated, async (req, res) => {
    const user = req.session.user;
    const role = (user.role || 'user').toLowerCase().trim();
    const userId = Number(user.id);

    const showSopAlert = req.session.showSopAlert || false;
    req.session.showSopAlert = false;

    try {
        let tickets = [];
        let assets = [];

        if (role === 'admin') {
            // Admin IT melihat seluruh data dari semua karyawan
            [tickets] = await db.query(`
                SELECT t.*, u.nama AS pemohon, u.departemen 
                FROM tickets t 
                JOIN users u ON t.user_id = u.id 
                ORDER BY t.created_at DESC
            `);
            [assets] = await db.query(`
                SELECT a.*, u.nama AS pemegang, u.departemen 
                FROM assets a 
                JOIN users u ON a.user_id = u.id 
                ORDER BY a.tanggal_update DESC
            `);
        } else {
            // Karyawan (user) HANYA melihat data yang dia input sendiri (berdasarkan user_id)
            [tickets] = await db.query(
                'SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );
            [assets] = await db.query(
                'SELECT * FROM assets WHERE user_id = ? ORDER BY tanggal_update DESC',
                [userId]
            );
        }

        res.render('dashboard', { tickets, assets, showSopAlert });
    } catch (err) {
        console.error(err);
        res.status(500).send('Gagal memuat dashboard.');
    }
});

// ==================== TICKET ROUTES ====================

app.get('/tickets/new', isAuthenticated, (req, res) => {
    res.render('ticket_form');
});

app.post('/tickets', isAuthenticated, async (req, res) => {
    const { kategori, prioritas, judul, deskripsi } = req.body;
    const userId = req.session.user.id;
    const randomNum = Math.floor(100 + Math.random() * 900);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const ticketCode = `TIK-${dateStr}-${randomNum}`;

    try {
        await db.query(
            'INSERT INTO tickets (ticket_code, user_id, kategori, prioritas, judul, deskripsi) VALUES (?, ?, ?, ?, ?, ?)',
            [ticketCode, userId, kategori, prioritas, judul, deskripsi]
        );
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Gagal membuat tiket.');
    }
});

// Update Status Tiket (Khusus Admin IT)
app.post('/tickets/:id/update', isAuthenticated, isAdmin, async (req, res) => {
    const { status, catatan_it } = req.body;
    const ticketId = req.params.id;
    try {
        await db.query(
            'UPDATE tickets SET status = ?, catatan_it = ? WHERE id = ?',
            [status, catatan_it, ticketId]
        );
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Gagal memperbarui status tiket.');
    }
});

// ==================== ASSET ROUTES ====================

// ==================== UPDATE ASSET ROUTES ====================

app.post('/assets/:id/update', isAuthenticated, async (req, res) => {
    const assetId = Number(req.params.id);
    const { kondisi, kelengkapan, keterangan } = req.body;
    const user = req.session.user;
    const role = (user.role || 'user').toLowerCase().trim();
    const userId = Number(user.id);

    try {
        if (role === 'admin') {
            // Admin IT dapat memperbarui semua perangkat
            await db.query(
                'UPDATE assets SET kondisi = ?, kelengkapan = ?, keterangan = ? WHERE id = ?',
                [kondisi, kelengkapan, keterangan, assetId]
            );
        } else {
            // Karyawan HANYA dapat memperbarui perangkat miliknya sendiri (WHERE id = ? AND user_id = ?)
            await db.query(
                'UPDATE assets SET kondisi = ?, kelengkapan = ?, keterangan = ? WHERE id = ? AND user_id = ?',
                [kondisi, kelengkapan, keterangan, assetId, userId]
            );
        }
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Gagal memperbarui data perangkat.');
    }
});

// ==================== EXPORT EXCEL ROUTES ====================

app.get('/assets/export', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.kode_aset, a.jenis_perangkat, a.merk_tipe, a.serial_number, 
                   a.kondisi, a.kelengkapan, a.keterangan, a.tanggal_update,
                   u.nama AS pemegang, u.departemen
            FROM assets a
            JOIN users u ON a.user_id = u.id
            ORDER BY u.departemen ASC, a.jenis_perangkat ASC
        `);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Stok Perangkat IT');

        // Header Kolom Excel
        worksheet.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Kode Aset', key: 'kode_aset', width: 18 },
            { header: 'Jenis Perangkat', key: 'jenis_perangkat', width: 18 },
            { header: 'Merk & Tipe', key: 'merk_tipe', width: 25 },
            { header: 'Serial Number (S/N)', key: 'serial_number', width: 22 },
            { header: 'Pemegang / User', key: 'pemegang', width: 22 },
            { header: 'Departemen', key: 'departemen', width: 18 },
            { header: 'Kondisi', key: 'kondisi', width: 18 },
            { header: 'Kelengkapan', key: 'kelengkapan', width: 28 },
            { header: 'Keterangan', key: 'keterangan', width: 30 },
            { header: 'Terakhir Update', key: 'tanggal_update', width: 20 }
        ];

        // Styling Header
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0D6EFD' }
        };

        // Isi Data
        rows.forEach((row, index) => {
            worksheet.addRow({
                no: index + 1,
                kode_aset: row.kode_aset || '-',
                jenis_perangkat: row.jenis_perangkat,
                merk_tipe: row.merk_tipe,
                serial_number: row.serial_number,
                pemegang: row.pemegang,
                departemen: row.departemen,
                kondisi: row.kondisi,
                kelengkapan: row.kelengkapan,
                keterangan: row.keterangan || '-',
                tanggal_update: new Date(row.tanggal_update).toLocaleDateString('id-ID')
            });
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Stok_Aset_IT_${new Date().toISOString().slice(0, 10)}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Gagal mengexport data ke Excel.');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});


// ==================== API JSON ROUTES UNTUK AJAX ====================

app.get('/api/dashboard-data', isAuthenticated, async (req, res) => {
    const user = req.session.user;
    const role = (user.role || 'user').toLowerCase().trim();
    const userId = Number(user.id);

    try {
        let tickets = [];
        let assets = [];

        if (role === 'admin') {
            // Admin IT melihat seluruh tiket & aset perusahaan
            [tickets] = await db.query(`
                SELECT t.*, u.nama AS pemohon, u.departemen 
                FROM tickets t 
                JOIN users u ON t.user_id = u.id 
                ORDER BY t.created_at DESC
            `);
            [assets] = await db.query(`
                SELECT a.*, u.nama AS pemegang, u.departemen 
                FROM assets a 
                JOIN users u ON a.user_id = u.id 
                ORDER BY a.tanggal_update DESC
            `);
        } else {
            // Karyawan (user) HANYA mengambil data milik user_id-nya sendiri
            [tickets] = await db.query(
                'SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );
            [assets] = await db.query(
                'SELECT * FROM assets WHERE user_id = ? ORDER BY tanggal_update DESC',
                [userId]
            );
        }

        res.json({
            success: true,
            tickets,
            assets,
            userRole: role,
            currentUserId: userId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal memuat data' });
    }
});

// ==================== USER MANAGEMENT ROUTES (KHUSUS ADMIN) ====================

app.post('/users/create', isAuthenticated, isAdmin, async (req, res) => {
    const { nama, email, password, departemen, role } = req.body;
    try {
        // Cek apakah email sudah terdaftar
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).send('Gagal: Email sudah terdaftar di sistem.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role === 'admin' ? 'admin' : 'user';

        await db.query(
            'INSERT INTO users (nama, email, password, departemen, role) VALUES (?, ?, ?, ?, ?)',
            [nama, email, hashedPassword, departemen, userRole]
        );

        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Terjadi kesalahan saat membuat akun user baru.');
    }
});