/**
 * Controlador de autenticación: registro, inicio de sesión y perfil.
 * Recibe la petición, valida, llama al modelo y responde.
 * Los errores no se capturan aquí: Express 5 los envía solos a manejarErrores.
 */
const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuarioModel.js');
const { validarRegistro, validarLogin } = require('../validators/authValidator.js');
const { generarToken, duracion } = require('../utils/token.js');
const { rondasBcrypt } = require('../config/env.js');
const AppError = require('../utils/AppError.js');

/** Mensaje único para cualquier falla de inicio de sesión (ver comentario en login). */
const MENSAJE_ERROR_LOGIN = 'Error en la autenticación';

/**
 * Hash de relleno para comparar cuando el usuario no existe.
 * Así el login tarda lo mismo exista o no el usuario, y nadie puede
 * averiguar qué usuarios están registrados midiendo el tiempo de respuesta.
 */
const HASH_DE_RELLENO = bcrypt.hashSync('contrasena-de-relleno-1', rondasBcrypt);

/**
 * POST /api/registro
 * Cuerpo: { "usuario": "sergio", "contrasena": "Clave123" }
 * Respuestas: 201 creado · 400 datos inválidos · 409 usuario repetido
 */
async function registrar(req, res) {
  const { usuario, contrasena } = validarRegistro(req.body);

  // Se cifra la contraseña: en la base de datos solo queda el hash
  const contrasenaHash = await bcrypt.hash(contrasena, rondasBcrypt);
  // Si el usuario ya existe, MySQL lanza ER_DUP_ENTRY y manejarErrores responde 409
  const id = await usuarioModel.crearUsuario(usuario, contrasenaHash);

  res.status(201).json({
    mensaje: 'Usuario registrado correctamente',
    usuario: { id, usuario },
  });
}

/**
 * POST /api/login
 * Cuerpo: { "usuario": "sergio", "contrasena": "Clave123" }
 * Respuestas: 200 autenticación satisfactoria + token · 400 faltan datos · 401 error
 */
async function iniciarSesion(req, res) {
  const { usuario, contrasena } = validarLogin(req.body);

  const encontrado = await usuarioModel.buscarPorUsuario(usuario);

  // bcrypt.compare aplica el mismo cifrado a la contraseña recibida y compara.
  // Si el usuario no existe se compara contra el hash de relleno (mismo tiempo).
  const contrasenaCorrecta = await bcrypt.compare(
    contrasena,
    encontrado?.contrasenaHash ?? HASH_DE_RELLENO
  );

  // Mismo mensaje si el usuario no existe o si la contraseña está mal:
  // decir "ese usuario no existe" le daría pistas a un atacante.
  if (!encontrado || !contrasenaCorrecta) {
    throw new AppError(MENSAJE_ERROR_LOGIN, 401);
  }

  res.json({
    mensaje: 'Autenticación satisfactoria',
    token: generarToken(encontrado),
    tipoToken: 'Bearer',
    expiraEn: duracion,
    usuario: { id: encontrado.id, usuario: encontrado.usuario },
  });
}

/**
 * GET /api/perfil (ruta protegida)
 * Encabezado: Authorization: Bearer <token>
 * Solo llega aquí si el middleware verificarToken aprobó el token.
 */
async function obtenerPerfil(req, res) {
  const usuario = await usuarioModel.buscarPorId(Number(req.usuario.sub));

  // El token puede ser válido pero el usuario haber sido borrado después
  if (!usuario) {
    throw new AppError('El usuario del token ya no existe', 401);
  }

  res.json({ mensaje: 'Acceso autorizado', usuario });
}

module.exports = { registrar, iniciarSesion, obtenerPerfil };
