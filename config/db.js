const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',        // Sesuaikan dengan user MySQL Anda
    password: '',        // Sesuaikan dengan password MySQL Anda
    database: 'db_it_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;