/**
 * Pruebas automáticas del servicio (node:test, incluido en Node.js).
 * Ejecutar con:  npm test
 * Requisitos: MySQL encendido, el script database/001_usuarios.sql ejecutado
 * y el archivo .env configurado.
 *
 * Cada ejecución usa un usuario distinto (con la hora actual en el nombre),
 * así las pruebas se pueden repetir sin borrar nada de la base de datos.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const app = require('../src/app.js');
const pool = require('../src/config/db.js');
const { jwt: configJwt } = require('../src/config/env.js');

let servidor;
let base;
const usuario = `prueba_${Date.now()}`;
const contrasena = 'ClaveSegura123';

/**
 * Hace una petición al servicio y devuelve el código y el cuerpo.
 * @param {string} ruta
 * @param {{metodo?: string, cuerpo?: Object, token?: string}} [opciones]
 */
async function pedir(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const encabezados = {};
  if (cuerpo) encabezados['Content-Type'] = 'application/json';
  if (token) encabezados.Authorization = `Bearer ${token}`;
  const respuesta = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: encabezados,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  return { estado: respuesta.status, cuerpo: await respuesta.json() };
}

// Antes de las pruebas: el servicio escucha en un puerto libre cualquiera (0)
before(async () => {
  await new Promise((listo) => {
    servidor = app.listen(0, listo);
  });
  base = `http://localhost:${servidor.address().port}/api`;
});

// Después: se borra el usuario de prueba y se cierran las conexiones
after(async () => {
  await pool.execute('DELETE FROM usuarios WHERE usuario = ?', [usuario]);
  await pool.end();
  servidor.close();
});

test('registro correcto responde 201 y no devuelve la contraseña', async () => {
  const { estado, cuerpo } = await pedir('/registro', {
    metodo: 'POST',
    cuerpo: { usuario, contrasena },
  });
  assert.equal(estado, 201);
  assert.equal(cuerpo.mensaje, 'Usuario registrado correctamente');
  assert.equal(cuerpo.usuario.usuario, usuario);
  assert.equal(JSON.stringify(cuerpo).includes(contrasena), false);
});

test('la contraseña se guarda cifrada con bcrypt, nunca en texto plano', async () => {
  const [filas] = await pool.execute('SELECT contrasena_hash FROM usuarios WHERE usuario = ?', [
    usuario,
  ]);
  assert.notEqual(filas[0].contrasena_hash, contrasena);
  assert.match(filas[0].contrasena_hash, /^\$2[aby]\$10\$/);
});

test('registrar el mismo usuario (aunque cambien mayúsculas) responde 409', async () => {
  const { estado, cuerpo } = await pedir('/registro', {
    metodo: 'POST',
    cuerpo: { usuario: usuario.toUpperCase(), contrasena },
  });
  assert.equal(estado, 409);
  assert.equal(cuerpo.mensaje, 'El usuario ya está registrado');
});

test('registro con datos inválidos responde 400 con la lista de errores', async () => {
  const { estado, cuerpo } = await pedir('/registro', {
    metodo: 'POST',
    cuerpo: { usuario: 'yo', contrasena: 'corta' },
  });
  assert.equal(estado, 400);
  assert.equal(cuerpo.detalles.length, 3);
});

test('inicio de sesión correcto responde 200, autenticación satisfactoria y token', async () => {
  const { estado, cuerpo } = await pedir('/login', {
    metodo: 'POST',
    cuerpo: { usuario, contrasena },
  });
  assert.equal(estado, 200);
  assert.equal(cuerpo.mensaje, 'Autenticación satisfactoria');
  assert.equal(cuerpo.token.split('.').length, 3); // encabezado.contenido.firma
});

test('contraseña incorrecta responde 401, error en la autenticación', async () => {
  const { estado, cuerpo } = await pedir('/login', {
    metodo: 'POST',
    cuerpo: { usuario, contrasena: 'ClaveEquivocada9' },
  });
  assert.equal(estado, 401);
  assert.equal(cuerpo.mensaje, 'Error en la autenticación');
});

test('usuario inexistente responde exactamente lo mismo que contraseña incorrecta', async () => {
  const { estado, cuerpo } = await pedir('/login', {
    metodo: 'POST',
    cuerpo: { usuario: 'nadie_registrado', contrasena },
  });
  assert.equal(estado, 401);
  assert.deepEqual(cuerpo, { mensaje: 'Error en la autenticación' });
});

test('inicio de sesión sin datos responde 400', async () => {
  const { estado } = await pedir('/login', { metodo: 'POST', cuerpo: {} });
  assert.equal(estado, 400);
});

test('ruta protegida: con token válido responde 200 con el perfil', async () => {
  const login = await pedir('/login', { metodo: 'POST', cuerpo: { usuario, contrasena } });
  const { estado, cuerpo } = await pedir('/perfil', { token: login.cuerpo.token });
  assert.equal(estado, 200);
  assert.equal(cuerpo.usuario.usuario, usuario);
  assert.equal('contrasenaHash' in cuerpo.usuario, false);
});

test('ruta protegida: sin token, token falso o token vencido responden 401', async () => {
  const sinToken = await pedir('/perfil');
  assert.equal(sinToken.estado, 401);

  const falso = await pedir('/perfil', { token: 'abc.def.ghi' });
  assert.equal(falso.cuerpo.mensaje, 'Token inválido');

  // Token firmado con el secreto correcto pero vencido hace 10 segundos
  const vencido = jwt.sign({ sub: '1', usuario }, configJwt.secreto, { expiresIn: -10 });
  const respuesta = await pedir('/perfil', { token: vencido });
  assert.equal(respuesta.estado, 401);
  assert.equal(respuesta.cuerpo.mensaje, 'La sesión expiró. Inicia sesión de nuevo');
});

test('JSON mal escrito responde 400 y una ruta inexistente responde 404', async () => {
  const malo = await fetch(`${base}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ usuario: sin comillas',
  });
  assert.equal(malo.status, 400);

  const { estado } = await pedir('/no-existe');
  assert.equal(estado, 404);
});
