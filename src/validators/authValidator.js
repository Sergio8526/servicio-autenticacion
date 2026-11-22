/**
 * Validaciones de los datos de registro e inicio de sesión.
 * Revisan los datos ANTES de llegar a la base de datos.
 */
const AppError = require('../utils/AppError.js');

/** Usuario: de 4 a 30 caracteres; letras sin tilde, números, punto o guion bajo. */
const PATRON_USUARIO = /^[a-zA-Z0-9._]{4,30}$/;

/** Longitudes de la contraseña. bcrypt solo usa los primeros 72 bytes, por eso el máximo. */
const CONTRASENA_MIN = 8;
const CONTRASENA_MAX = 72;

/**
 * Limpia el usuario: quita espacios a los lados y lo pasa a minúsculas,
 * para que "Sergio" y "sergio" sean el mismo usuario.
 * @param {unknown} valor
 * @returns {string}
 */
function limpiarUsuario(valor) {
  return typeof valor === 'string' ? valor.trim().toLowerCase() : '';
}

/**
 * Valida los datos del registro con todas las reglas.
 * @param {Object} [datos={}] - Cuerpo de la petición.
 * @returns {{usuario: string, contrasena: string}} Datos limpios.
 * @throws {AppError} 400 con la lista de problemas encontrados.
 */
function validarRegistro(datos = {}) {
  const errores = [];
  const usuario = limpiarUsuario(datos.usuario);
  const contrasena = typeof datos.contrasena === 'string' ? datos.contrasena : '';

  if (!usuario) {
    errores.push('El usuario es obligatorio');
  } else if (!PATRON_USUARIO.test(usuario)) {
    errores.push(
      'El usuario debe tener de 4 a 30 caracteres: letras sin tilde, números, punto o guion bajo'
    );
  }

  if (!contrasena) {
    errores.push('La contraseña es obligatoria');
  } else {
    if (contrasena.length < CONTRASENA_MIN || contrasena.length > CONTRASENA_MAX) {
      errores.push(
        `La contraseña debe tener entre ${CONTRASENA_MIN} y ${CONTRASENA_MAX} caracteres`
      );
    }
    if (!/[a-zA-Z]/.test(contrasena) || !/\d/.test(contrasena)) {
      errores.push('La contraseña debe tener al menos una letra y un número');
    }
  }

  if (errores.length > 0) {
    throw new AppError('Datos de registro no válidos', 400, errores);
  }

  return { usuario, contrasena };
}

/**
 * Valida los datos del inicio de sesión.
 * Aquí solo se revisa que lleguen los dos campos: no se repiten las reglas
 * del registro para no darle pistas a quien intenta adivinar contraseñas.
 * @param {Object} [datos={}]
 * @returns {{usuario: string, contrasena: string}}
 * @throws {AppError} 400 si falta algún campo.
 */
function validarLogin(datos = {}) {
  const usuario = limpiarUsuario(datos.usuario);
  const contrasena = typeof datos.contrasena === 'string' ? datos.contrasena : '';

  if (!usuario || !contrasena) {
    throw new AppError('El usuario y la contraseña son obligatorios', 400);
  }

  return { usuario, contrasena };
}

module.exports = { validarRegistro, validarLogin };
