/**
 * Punto de entrada: pone a escuchar el servicio en el puerto configurado.
 */
const app = require('./app.js');
const { puerto } = require('./config/env.js');

app.listen(puerto, (error) => {
  // En Express 5, si el puerto no se puede abrir, el error llega aquí
  if (error) {
    console.error(`No se pudo iniciar el servidor en el puerto ${puerto}:`, error.message);
    process.exit(1);
  }
  console.log(`Servicio de autenticación corriendo en http://localhost:${puerto}/api`);
});
