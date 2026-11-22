/**
 * Configuración del servicio.
 * Lee las variables del archivo .env (que NO se sube a GitHub) y revisa que
 * las obligatorias existan. Si falta alguna, el servidor no arranca y lo dice,
 * en lugar de fallar más tarde con un error difícil de entender.
 */
require('dotenv').config({ quiet: true });

const OBLIGATORIAS = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRETO'];
const faltantes = OBLIGATORIAS.filter((nombre) => !process.env[nombre]);

if (faltantes.length > 0) {
  console.error(`Faltan variables en el archivo .env: ${faltantes.join(', ')}`);
  console.error('Copia .env.example como .env y completa los valores.');
  process.exit(1);
}

module.exports = {
  puerto: Number(process.env.PORT) || 4000,
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME,
  },
  jwt: {
    secreto: process.env.JWT_SECRETO,
    expira: process.env.JWT_EXPIRA || '1h', // ejemplos: '15m', '1h', '7d'
  },
  // Rondas de bcrypt: más rondas = más seguro pero más lento. 10 es el valor recomendado.
  rondasBcrypt: Number(process.env.BCRYPT_RONDAS) || 10,
};
