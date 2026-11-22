/**
 * Manejo centralizado de errores.
 * Todos los errores terminan aquí y se convierten en una respuesta JSON
 * con el código HTTP adecuado.
 */
const AppError = require('../utils/AppError.js');

/** Errores de MySQL que ya sabemos interpretar. */
const ERRORES_MYSQL = {
  ER_DUP_ENTRY: { estado: 409, mensaje: 'El usuario ya está registrado' },
};

/**
 * Responde 404 cuando se pide una ruta de la API que no existe.
 */
function rutaNoEncontrada(req, res) {
  res.status(404).json({ mensaje: `No existe la ruta ${req.method} ${req.originalUrl}` });
}

/**
 * Convierte cualquier error en una respuesta JSON.
 * Express reconoce este middleware como "de errores" porque recibe 4 parámetros.
 */
// eslint-disable-next-line no-unused-vars
function manejarErrores(error, req, res, next) {
  // Errores propios: validación, credenciales, token
  if (error instanceof AppError) {
    const cuerpo = { mensaje: error.message };
    if (error.detalles.length > 0) cuerpo.detalles = error.detalles;
    return res.status(error.estado).json(cuerpo);
  }

  // JSON mal escrito en el cuerpo de la petición
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'El cuerpo de la petición no es un JSON válido' });
  }

  // Cuerpo demasiado grande (límite configurado en app.js)
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ mensaje: 'El cuerpo de la petición es demasiado grande' });
  }

  // Errores conocidos de MySQL
  const errorMysql = ERRORES_MYSQL[error.code];
  if (errorMysql) {
    return res.status(errorMysql.estado).json({ mensaje: errorMysql.mensaje });
  }

  // Cualquier otro error: se registra en la consola y no se muestran detalles técnicos
  console.error(error);
  return res.status(500).json({ mensaje: 'Error interno del servidor' });
}

module.exports = { rutaNoEncontrada, manejarErrores };
