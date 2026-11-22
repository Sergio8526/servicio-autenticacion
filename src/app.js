/**
 * Configuración de la aplicación Express.
 * Se separa de server.js (que la pone a escuchar) para poder usarla
 * también en las pruebas automáticas sin abrir el puerto real.
 */
const express = require('express');
const authRoutes = require('./routes/authRoutes.js');
const { rutaNoEncontrada, manejarErrores } = require('./middlewares/manejarErrores.js');

const app = express();

// No revelar que el servidor usa Express (información útil para un atacante)
app.disable('x-powered-by');

// Lee cuerpos JSON de hasta 10 KB (un registro nunca necesita más)
app.use(express.json({ limit: '10kb' }));

// Página de bienvenida: lista los servicios disponibles
app.get('/api', (req, res) => {
  res.json({
    servicio: 'Servicio de autenticación - SENA GA7-220501096-AA5-EV01',
    rutas: {
      'POST /api/registro': 'Registra un usuario { usuario, contrasena }',
      'POST /api/login': 'Inicia sesión { usuario, contrasena } y devuelve un token JWT',
      'GET /api/perfil': 'Ruta protegida. Encabezado Authorization: Bearer <token>',
    },
  });
});

app.use('/api', authRoutes);

// Rutas que no existen → 404 en JSON
app.use(rutaNoEncontrada);

// Manejo centralizado de errores (siempre de último)
app.use(manejarErrores);

module.exports = app;
