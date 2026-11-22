/**
 * Rutas del servicio de autenticación.
 * Une cada dirección (URL + método HTTP) con su función del controlador.
 */
const { Router } = require('express');
const { registrar, iniciarSesion, obtenerPerfil } = require('../controllers/authController.js');
const verificarToken = require('../middlewares/verificarToken.js');

const router = Router();

router.post('/registro', registrar);
router.post('/login', iniciarSesion);
// verificarToken se ejecuta primero; si el token falla, obtenerPerfil nunca se ejecuta
router.get('/perfil', verificarToken, obtenerPerfil);

module.exports = router;
