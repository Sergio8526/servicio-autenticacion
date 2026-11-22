/**
 * Conexión a MySQL.
 * Se usa un "pool": un grupo de conexiones abiertas que se reutilizan,
 * en lugar de abrir y cerrar una conexión en cada petición.
 */
const mysql = require('mysql2/promise');
const { db } = require('./env.js');

const pool = mysql.createPool({
  ...db,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
