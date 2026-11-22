/**
 * Modelo de usuarios: todas las consultas SQL a la tabla "usuarios".
 * Se usan consultas parametrizadas (los ?) para evitar inyección SQL:
 * MySQL trata los valores como datos, nunca como parte de la instrucción.
 */
const pool = require('../config/db.js');

/**
 * Guarda un usuario nuevo.
 * @param {string} usuario - Nombre de usuario ya validado.
 * @param {string} contrasenaHash - Contraseña cifrada con bcrypt (nunca la original).
 * @returns {Promise<number>} id del usuario creado.
 */
async function crearUsuario(usuario, contrasenaHash) {
  const [resultado] = await pool.execute(
    'INSERT INTO usuarios (usuario, contrasena_hash) VALUES (?, ?)',
    [usuario, contrasenaHash]
  );
  return resultado.insertId;
}

/**
 * Busca un usuario por su nombre, incluido el hash para comparar la contraseña.
 * Solo lo usa el inicio de sesión; el hash nunca se envía al cliente.
 * @param {string} usuario
 * @returns {Promise<{id: number, usuario: string, contrasenaHash: string}|null>}
 */
async function buscarPorUsuario(usuario) {
  const [filas] = await pool.execute(
    'SELECT id, usuario, contrasena_hash AS contrasenaHash FROM usuarios WHERE usuario = ?',
    [usuario]
  );
  return filas[0] ?? null;
}

/**
 * Busca un usuario por id, SIN el hash (datos públicos del perfil).
 * @param {number} id
 * @returns {Promise<{id: number, usuario: string, fechaCreacion: Date}|null>}
 */
async function buscarPorId(id) {
  const [filas] = await pool.execute(
    'SELECT id, usuario, fecha_creacion AS fechaCreacion FROM usuarios WHERE id = ?',
    [id]
  );
  return filas[0] ?? null;
}

module.exports = { crearUsuario, buscarPorUsuario, buscarPorId };
