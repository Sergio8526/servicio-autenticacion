/**
 * Middleware que protege rutas con JWT.
 * Revisa el encabezado "Authorization: Bearer <token>". Si el token es válido,
 * guarda su contenido en req.usuario y deja pasar la petición (next).
 * Si no, responde 401 y la petición nunca llega al controlador.
 */
const { TokenExpiredError } = require('jsonwebtoken');
const { verificarToken: verificar } = require('../utils/token.js');
const AppError = require('../utils/AppError.js');

function verificarToken(req, res, next) {
  const encabezado = req.headers.authorization ?? '';
  const [tipo, token] = encabezado.split(' ');

  if (tipo !== 'Bearer' || !token) {
    throw new AppError('Se requiere un token. Envíalo como: Authorization: Bearer <token>', 401);
  }

  try {
    req.usuario = verificar(token);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new AppError('La sesión expiró. Inicia sesión de nuevo', 401);
    }
    throw new AppError('Token inválido', 401);
  }

  next();
}

module.exports = verificarToken;
